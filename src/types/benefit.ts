// 🟢 Benefit Model 🟢

export type EligibilityStatus = 'Eligible' | 'Potentially Eligible' | 'Not Eligible';
export type ProvenanceType = 'Official Government Portal' | 'Verified Scheme Database' | 'Curated Research';

export interface BenefitCriteria {
  states?: string[];            // 2-letter state codes; empty = all-India
  maxAnnualIncome?: number;     // In ₹1
  minAnnualIncome?: number;     // In ₹1
  educationLevels?: string[];   // Must exactly match UserProfile.educationLevel
  employmentStatuses?: string[];// Must exactly match UserProfile.employmentStatus
  ageMin?: number;
  ageMax?: number;
  genders?: string[];           // e.g. ['Female'] for women-specific schemes
  casteCriteria?: string[];     // e.g. ['SC', 'ST', 'OBC']
  requiresDisability?: boolean;
}

export interface BenefitProvenance {
  sourceName: string;           // e.g. "myscheme.gov.in"
  sourceUrl: string;            // Primary official source URL
  applicationUrl: string;       // URL where users apply
  lastVerified: string;         // ISO date string of when data was last verified by us
  dataType: ProvenanceType;
}

export interface RenewalInformation {
  renewalRequired: boolean;
  renewalFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  renewalPeriod?: string; // e.g., "June - September"
  renewalRequirements?: string[];
  renewalDocuments?: string[]; // Documents specifically needed for renewal
  renewalNotes?: string;
}

export interface Benefit {
  id: string;
  title: string;
  issuer: string;               // Ministry / Department / State Govt name
  category: 'Education' | 'Healthcare' | 'Financial Assistance' | 'Employment' | 'Agriculture' | 'Housing' | 'Social Welfare';
  description: string;          // Accurate description from official source
  eligibilityCriteria: BenefitCriteria;
  deadline: string;             // 'Ongoing' or ISO date string
  benefitAmount: string;        // e.g. "₹16,000 per year" — string since varies widely
  requiredDocuments: string[];  // List of required document types (must match INDIAN_DOCUMENT_TYPES)
  provenance: BenefitProvenance;
  
  // Renewal properties
  isRenewable: boolean;
  renewalInfo?: RenewalInformation;
}

// 🟢 Eligibility Model 🟢

export interface EligibilityResult {
  benefitId: string;
  status: EligibilityStatus;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'; // HIGH = all criteria verified; LOW = much missing data
  satisfiedCriteria: string[];  // Criteria the user passes with known data
  missingCriteria: string[];    // Criteria that cannot be checked (data missing from profile)
  unmetCriteria: string[];      // Criteria the user definitively fails
  missingDocuments: string[];   // Required docs user hasn't uploaded
}
