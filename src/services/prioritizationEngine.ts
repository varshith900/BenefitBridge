import type { Benefit, EligibilityResult } from '../types/benefit';
import { evaluateAllBenefits } from './eligibilityEngine';
import { getUserProfile } from './userService';

// ─── Ranked Opportunity Model ────────────────────────────────────────────────

export interface RankedOpportunity {
  benefit: Benefit;
  result: EligibilityResult;
  priorityScore: number;  // 0–2000 composite score
  priorityLabel: 'Urgent' | 'High' | 'Medium' | 'Low';
  prioritySummary: string; // Short human-readable reason
  applicationReadiness: 'Ready' | 'Needs Documents' | 'Needs Profile Info' | 'Not Eligible';
  rank: number;
}

// ─── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  ELIGIBLE: 800,
  POTENTIALLY_ELIGIBLE: 400,
  NOT_ELIGIBLE: 0,
  CONFIDENCE_HIGH: 100,
  CONFIDENCE_MEDIUM: 50,
  CONFIDENCE_LOW: 0,
  DEADLINE_WITHIN_30_DAYS: 400,
  DEADLINE_WITHIN_90_DAYS: 200,
  DEADLINE_WITHIN_365_DAYS: 100,
  DEADLINE_ONGOING: 50,
  DEADLINE_PASSED: -600,
  DOCS_COMPLETE: 150,
  DOCS_PARTIAL: 50,
  DOCS_MISSING_ALL: 0,
};

// ─── Core Ranker ─────────────────────────────────────────────────────────────

export function rankOpportunities(
  opportunities: { benefit: Benefit; result: EligibilityResult }[]
): RankedOpportunity[] {
  const scored = opportunities.map(opp => {
    const { benefit, result } = opp;
    let score = 0;
    const reasons: string[] = [];

    // 1. Eligibility Status
    if (result.status === 'Eligible') {
      score += WEIGHTS.ELIGIBLE;
      reasons.push('Confirmed eligible');
    } else if (result.status === 'Potentially Eligible') {
      score += WEIGHTS.POTENTIALLY_ELIGIBLE;
      reasons.push('Likely eligible — some details unverified');
    } else {
      score += WEIGHTS.NOT_ELIGIBLE;
      reasons.push('Not eligible based on current profile');
    }

    // 2. Confidence Level
    if (result.confidenceLevel === 'HIGH') score += WEIGHTS.CONFIDENCE_HIGH;
    else if (result.confidenceLevel === 'MEDIUM') score += WEIGHTS.CONFIDENCE_MEDIUM;

    // 3. Deadline Urgency (only if not Not Eligible)
    if (result.status !== 'Not Eligible') {
      if (benefit.deadline === 'Ongoing') {
        score += WEIGHTS.DEADLINE_ONGOING;
        reasons.push('Always open');
      } else {
        const deadlineDate = new Date(benefit.deadline.split(' ')[0]);
        const today = new Date();
        const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          score += WEIGHTS.DEADLINE_PASSED;
          reasons.push('Deadline has passed — verify if scheme reopened');
        } else if (diffDays <= 30) {
          score += WEIGHTS.DEADLINE_WITHIN_30_DAYS;
          reasons.push(`Deadline closing in ${diffDays} days — apply now`);
        } else if (diffDays <= 90) {
          score += WEIGHTS.DEADLINE_WITHIN_90_DAYS;
          reasons.push(`Deadline in ${diffDays} days`);
        } else {
          score += WEIGHTS.DEADLINE_WITHIN_365_DAYS;
          reasons.push(`Deadline in ${diffDays} days`);
        }
      }
    }

    // 4. Document Readiness
    const totalDocs = benefit.requiredDocuments.length;
    const missingDocs = result.missingDocuments.length;
    const docsHave = totalDocs - missingDocs;

    if (totalDocs === 0 || missingDocs === 0) {
      score += WEIGHTS.DOCS_COMPLETE;
    } else if (docsHave > 0) {
      score += WEIGHTS.DOCS_PARTIAL;
    }

    // ── Application Readiness Label ─────────────────────────────────────────
    let applicationReadiness: RankedOpportunity['applicationReadiness'];
    if (result.status === 'Not Eligible') {
      applicationReadiness = 'Not Eligible';
    } else if (result.missingDocuments.length > 0) {
      applicationReadiness = 'Needs Documents';
    } else if (result.missingCriteria.length > 0) {
      applicationReadiness = 'Needs Profile Info';
    } else {
      applicationReadiness = 'Ready';
    }

    // ── Priority Label ──────────────────────────────────────────────────────
    let priorityLabel: RankedOpportunity['priorityLabel'];
    if (score >= 1100) priorityLabel = 'Urgent';
    else if (score >= 700) priorityLabel = 'High';
    else if (score >= 300) priorityLabel = 'Medium';
    else priorityLabel = 'Low';

    return {
      benefit,
      result,
      priorityScore: Math.max(0, score),
      priorityLabel,
      prioritySummary: reasons.join(' · '),
      applicationReadiness,
      rank: 0,
    } satisfies Omit<RankedOpportunity, 'rank'> & { rank: number };
  });

  // Sort descending
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  scored.forEach((opp, i) => { opp.rank = i + 1; });

  return scored as RankedOpportunity[];
}

// ─── Convenience async helpers ────────────────────────────────────────────────

export async function getRankedBenefits(uid: string): Promise<RankedOpportunity[]> {
  const profile = await getUserProfile(uid);
  if (!profile) return [];
  const evaluated = await evaluateAllBenefits(uid, profile);
  return rankOpportunities(evaluated);
}

export async function getTopPriorityAction(uid: string): Promise<RankedOpportunity | null> {
  const ranked = await getRankedBenefits(uid);
  return ranked.find(r => r.result.status !== 'Not Eligible') ?? null;
}
