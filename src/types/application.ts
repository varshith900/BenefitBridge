// ─── Application State Machine ────────────────────────────────────────────────

export type ApplicationStatus =
  | 'DISCOVERED'
  | 'INTERESTED'
  | 'PREPARING'
  | 'READY_TO_APPLY'
  | 'APPLICATION_STARTED'
  | 'AWAITING_EXTERNAL_SUBMISSION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFICATION_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'RENEWAL_DUE'
  | 'RENEWAL_IN_PROGRESS'
  | 'RENEWED';

export type RenewalStatus =
  | 'NOT_APPLICABLE'
  | 'FUTURE'
  | 'UPCOMING'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'RENEWED'
  | 'MISSED';

export type ApplicationHealth =
  | 'HEALTHY'
  | 'ATTENTION_REQUIRED'
  | 'URGENT'
  | 'BLOCKED'
  | 'OVERDUE';

export type DeadlineCategory = 'SAFE' | 'UPCOMING' | 'URGENT' | 'OVERDUE';

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DISCOVERED:                   ['INTERESTED', 'PREPARING', 'READY_TO_APPLY'],
  INTERESTED:                   ['PREPARING', 'READY_TO_APPLY', 'DISCOVERED'],
  PREPARING:                    ['READY_TO_APPLY', 'ACTION_REQUIRED', 'APPLICATION_STARTED'],
  READY_TO_APPLY:               ['APPLICATION_STARTED', 'PREPARING'],
  APPLICATION_STARTED:          ['AWAITING_EXTERNAL_SUBMISSION', 'SUBMITTED', 'PREPARING'],
  AWAITING_EXTERNAL_SUBMISSION: ['SUBMITTED', 'APPLICATION_STARTED', 'PREPARING'],
  SUBMITTED:                    ['UNDER_REVIEW', 'ACTION_REQUIRED', 'VERIFICATION_PENDING', 'APPROVED'],
  UNDER_REVIEW:                 ['APPROVED', 'REJECTED', 'ACTION_REQUIRED', 'VERIFICATION_PENDING'],
  ACTION_REQUIRED:              ['UNDER_REVIEW', 'VERIFICATION_PENDING', 'SUBMITTED', 'PREPARING'],
  VERIFICATION_PENDING:         ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED'],
  APPROVED:                     ['COMPLETED', 'RENEWAL_DUE'],
  REJECTED:                     ['PREPARING', 'APPLICATION_STARTED', 'INTERESTED'],
  COMPLETED:                    ['RENEWAL_DUE', 'EXPIRED'],
  EXPIRED:                      ['PREPARING', 'RENEWAL_DUE'],
  RENEWAL_DUE:                  ['RENEWAL_IN_PROGRESS', 'MISSED' as any, 'COMPLETED'],
  RENEWAL_IN_PROGRESS:          ['RENEWED', 'SUBMITTED', 'RENEWAL_DUE'],
  RENEWED:                      ['COMPLETED', 'RENEWAL_DUE'],
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DISCOVERED:                   'Discovered',
  INTERESTED:                   'Interested',
  PREPARING:                    'Preparing',
  READY_TO_APPLY:               'Ready to Apply',
  APPLICATION_STARTED:          'Application Started',
  AWAITING_EXTERNAL_SUBMISSION: 'Awaiting Submission Confirmation',
  SUBMITTED:                    'Submitted',
  UNDER_REVIEW:                 'Under Review',
  ACTION_REQUIRED:              'Action Required',
  VERIFICATION_PENDING:         'Verification Pending',
  APPROVED:                     'Approved',
  REJECTED:                     'Rejected',
  COMPLETED:                    'Completed',
  EXPIRED:                      'Expired',
  RENEWAL_DUE:                  'Renewal Due',
  RENEWAL_IN_PROGRESS:          'Renewal In Progress',
  RENEWED:                      'Renewed',
};

export interface TimelineEvent {
  id: string;
  timestamp: number;
  status: ApplicationStatus | RenewalStatus;
  eventType?: string;
  actor: 'USER' | 'AGENT' | 'SYSTEM' | 'EXTERNAL_SOURCE';
  note: string;
  source?: string;
}

export interface ApplicationBlocker {
  id: string;
  type: 'MISSING_DOCUMENT' | 'PROFILE_INCOMPLETE' | 'ELIGIBILITY_UNVERIFIED' | 'USER_ACTION_REQUIRED';
  description: string;
  resolvedAt?: number;
}

export interface RenewalHistoryRecord {
  id: string;
  cycle: string;
  submittedAt?: number;
  status: RenewalStatus;
  referenceNumber?: string;
  documentsUsed: string[];
  notes?: string;
  timeline: TimelineEvent[];
}

export interface Application {
  id: string;
  uid: string;
  benefitId: string;
  benefitTitle: string;
  benefitIssuer: string;
  benefitCategory: string;
  applicationUrl: string;
  currentStatus: ApplicationStatus;
  
  eligibilityStatus: 'Eligible' | 'Potentially Eligible' | 'Not Eligible';
  eligibilityConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  readinessScore: number;
  
  requiredDocuments: string[];
  uploadedDocuments: string[];
  missingDocuments: string[];
  blockers: ApplicationBlocker[];
  taskIds: string[];
  
  deadline: string;
  daysRemaining?: number;
  deadlineCategory?: DeadlineCategory;
  referenceNumber?: string;
  applicationNumber?: string;
  
  applicationStartedAt?: number;
  applicationSubmittedAt?: number;
  lastUpdatedAt?: number;
  
  verificationStatus?: string;
  approvalStatus?: string;
  externalStatus?: string;
  externalStatusLastChecked?: number;
  
  verificationLevel?: 1 | 2 | 3 | 4 | 5;
  verificationSource?: string;
  
  healthStatus?: ApplicationHealth;
  healthReason?: string;
  healthAction?: string;
  
  nextAction: string;
  pendingAction?: string;
  agentNotes: string;
  notes?: string;
  source?: string;
  
  timeline: TimelineEvent[];
  
  lastChecked?: number;
  previousStatus?: ApplicationStatus;
  nextCheck?: number;
  
  isRenewable: boolean;
  renewalFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  renewalCycle?: string;
  renewalStatus: RenewalStatus;
  nextRenewalDate?: string;
  renewalWindowStart?: string;
  renewalDeadline?: string;
  previousRenewalDate?: string;
  lastRenewedAt?: number;
  renewalReadinessScore?: number;
  renewalHistory: RenewalHistoryRecord[];

  createdAt: number;
  updatedAt: number;
}
