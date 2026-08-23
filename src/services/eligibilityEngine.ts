import type { Benefit, EligibilityResult, EligibilityStatus } from '../types/benefit';
import type { UserProfile } from '../types/user';
import { CURATED_BENEFITS } from '../data/benefits';
import { getUserDocuments } from './documentService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateAge(dobString?: string): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

function parseMaxIncomeFromRange(incomeRange?: string): number | null {
  if (!incomeRange) return null;
  if (incomeRange === '0-250000') return 250000;
  if (incomeRange === '250001-500000') return 500000;
  if (incomeRange === '500001-800000') return 800000;
  if (incomeRange === '800001+') return 800001;
  return null;
}

// ─── Core Eligibility Evaluator ──────────────────────────────────────────────

export function evaluateEligibility(
  user: UserProfile,
  benefit: Benefit,
  uploadedDocTypes: string[] = []
): EligibilityResult {
  const satisfied: string[] = [];
  const missing: string[] = [];
  const unmet: string[] = [];
  const missingDocs: string[] = [];

  const { eligibilityCriteria: c } = benefit;
  const income = parseMaxIncomeFromRange(user.annualIncome);
  const age = calculateAge(user.dateOfBirth);

  // ── State ─────────────────────────────────────────────────────────────────
  if (c.states && c.states.length > 0) {
    if (!user.state) {
      missing.push('State of residence not set in profile');
    } else if (c.states.includes(user.state)) {
      satisfied.push(`Resident of eligible state (${user.state})`);
    } else {
      unmet.push(`Scheme available only in: ${c.states.join(', ')} — your state: ${user.state}`);
    }
  }

  // ── Max Income ────────────────────────────────────────────────────────────
  if (c.maxAnnualIncome !== undefined) {
    if (income === null) {
      missing.push('Annual income not set in profile');
    } else if (income <= c.maxAnnualIncome) {
      satisfied.push(`Income (₹${income.toLocaleString('en-IN')}) within limit of ₹${c.maxAnnualIncome.toLocaleString('en-IN')}`);
    } else {
      unmet.push(`Income exceeds scheme limit of ₹${c.maxAnnualIncome.toLocaleString('en-IN')}`);
    }
  }

  // ── Min Income ────────────────────────────────────────────────────────────
  if (c.minAnnualIncome !== undefined) {
    if (income === null) {
      missing.push('Annual income not set in profile');
    } else if (income >= c.minAnnualIncome) {
      satisfied.push(`Income meets minimum requirement of ₹${c.minAnnualIncome.toLocaleString('en-IN')}`);
    } else {
      unmet.push(`Income below scheme minimum of ₹${c.minAnnualIncome.toLocaleString('en-IN')}`);
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (c.educationLevels && c.educationLevels.length > 0) {
    if (!user.educationLevel) {
      missing.push('Education level not set in profile');
    } else if (c.educationLevels.includes(user.educationLevel)) {
      satisfied.push(`Education level (${user.educationLevel}) qualifies`);
    } else {
      unmet.push(`Education level must be one of: ${c.educationLevels.join(', ')}`);
    }
  }

  // ── Employment ────────────────────────────────────────────────────────────
  if (c.employmentStatuses && c.employmentStatuses.length > 0) {
    if (!user.employmentStatus) {
      missing.push('Employment status not set in profile');
    } else if (c.employmentStatuses.includes(user.employmentStatus)) {
      satisfied.push(`Employment status (${user.employmentStatus}) qualifies`);
    } else {
      unmet.push(`Scheme targets: ${c.employmentStatuses.join(', ')} — your status: ${user.employmentStatus}`);
    }
  }

  // ── Age Min ───────────────────────────────────────────────────────────────
  if (c.ageMin !== undefined) {
    if (age === null) {
      missing.push('Date of birth not set in profile');
    } else if (age >= c.ageMin) {
      satisfied.push(`Age (${age}) meets minimum requirement of ${c.ageMin}`);
    } else {
      unmet.push(`Minimum age required: ${c.ageMin} — your age: ${age}`);
    }
  }

  // ── Age Max ───────────────────────────────────────────────────────────────
  if (c.ageMax !== undefined) {
    if (age === null) {
      missing.push('Date of birth not set in profile');
    } else if (age <= c.ageMax) {
      satisfied.push(`Age (${age}) within maximum of ${c.ageMax}`);
    } else {
      unmet.push(`Maximum age allowed: ${c.ageMax} — your age: ${age}`);
    }
  }

  // ── Caste Criteria (cannot verify — mark as user-verify) ──────────────────
  if (c.casteCriteria && c.casteCriteria.length > 0) {
    missing.push(`Caste certificate required (eligible categories: ${c.casteCriteria.join(', ')}) — user must verify`);
  }

  // ── Required Documents ────────────────────────────────────────────────────
  for (const requiredDoc of benefit.requiredDocuments) {
    if (!uploadedDocTypes.includes(requiredDoc)) {
      missingDocs.push(requiredDoc);
    }
  }

  // ── Status Determination ──────────────────────────────────────────────────
  let status: EligibilityStatus;
  if (unmet.length > 0) {
    status = 'Not Eligible';
  } else if (missing.length > 0) {
    status = 'Potentially Eligible';
  } else {
    status = 'Eligible';
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  const totalCriteriaCount = Object.values(c).filter(v =>
    v !== undefined && (!Array.isArray(v) || v.length > 0)
  ).length;
  const verifiedCount = satisfied.length + unmet.length;
  const confidence: EligibilityResult['confidenceLevel'] =
    totalCriteriaCount === 0 ? 'HIGH'
    : verifiedCount / totalCriteriaCount >= 0.7 ? 'HIGH'
    : verifiedCount / totalCriteriaCount >= 0.4 ? 'MEDIUM'
    : 'LOW';

  return {
    benefitId: benefit.id,
    status,
    confidenceLevel: confidence,
    satisfiedCriteria: satisfied,
    missingCriteria: missing,
    unmetCriteria: unmet,
    missingDocuments: missingDocs,
  };
}

// ─── Batch Evaluator ─────────────────────────────────────────────────────────

export async function evaluateAllBenefits(
  uid: string,
  profile: UserProfile
): Promise<{ benefit: Benefit; result: EligibilityResult }[]> {
  const docs = await getUserDocuments(uid);
  const uploadedDocTypes = docs.map(d => d.type);

  return CURATED_BENEFITS.map(benefit => ({
    benefit,
    result: evaluateEligibility(profile, benefit, uploadedDocTypes),
  }));
}

// ─── Re-export dataset ───────────────────────────────────────────────────────
export { CURATED_BENEFITS };
