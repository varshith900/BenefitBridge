import {
  doc, collection, getDoc, setDoc, updateDoc, query,
  where, getDocs, deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Application, ApplicationStatus, ApplicationBlocker, TimelineEvent,
  ApplicationHealth, DeadlineCategory, RenewalStatus,
} from '../types/application';
import { VALID_TRANSITIONS, STATUS_LABELS } from '../types/application';
import type { Benefit, EligibilityResult } from '../types/benefit';
import { createTask } from './taskService';
import { logActivity } from './activityService';

const COLLECTION = 'applications';

// ─── Helpers & Calculations ───────────────────────────────────────────────────

export function makeTimelineEvent(
  status: ApplicationStatus | RenewalStatus,
  actor: TimelineEvent['actor'],
  note: string,
  source: string = 'BenefitBridge Core',
  eventType?: string,
): TimelineEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    status,
    eventType: eventType || `STATUS_${status}`,
    actor,
    note,
    source,
  };
}

export function computeDeadlineIntelligence(deadlineStr: string): {
  daysRemaining: number;
  deadlineCategory: DeadlineCategory;
} {
  if (!deadlineStr || deadlineStr.toLowerCase() === 'ongoing') {
    return { daysRemaining: 999, deadlineCategory: 'SAFE' };
  }

  const parsed = Date.parse(deadlineStr);
  if (isNaN(parsed)) {
    return { daysRemaining: 999, deadlineCategory: 'SAFE' };
  }

  const diffMs = parsed - Date.now();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let deadlineCategory: DeadlineCategory = 'SAFE';
  if (daysRemaining <= 0) deadlineCategory = 'OVERDUE';
  else if (daysRemaining <= 14) deadlineCategory = 'URGENT';
  else if (daysRemaining <= 44) deadlineCategory = 'UPCOMING';
  else deadlineCategory = 'SAFE';

  return { daysRemaining, deadlineCategory };
}

export function computeReadiness(app: Partial<Application>): number {
  let score = 0;
  // 1. Eligibility (35 pts)
  if (app.eligibilityStatus === 'Eligible') score += 35;
  else if (app.eligibilityStatus === 'Potentially Eligible') score += 20;

  // 2. Documents (40 pts)
  const totalDocs = app.requiredDocuments?.length ?? 0;
  const missingDocs = app.missingDocuments?.length ?? 0;
  const haveDocs = totalDocs - missingDocs;
  if (totalDocs > 0) {
    score += Math.round((haveDocs / totalDocs) * 40);
  } else {
    score += 40;
  }

  // 3. Blockers (15 pts)
  const activeBlockers = (app.blockers ?? []).filter(b => !b.resolvedAt);
  if (activeBlockers.length === 0) score += 15;

  // 4. Progress Stage (10 pts)
  if (app.currentStatus === 'READY_TO_APPLY') score += 10;
  else if (['APPLICATION_STARTED', 'AWAITING_EXTERNAL_SUBMISSION', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'].includes(app.currentStatus || '')) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

export function computeApplicationHealth(app: Partial<Application>): {
  healthStatus: ApplicationHealth;
  healthReason: string;
  healthAction: string;
} {
  const activeBlockers = (app.blockers ?? []).filter(b => !b.resolvedAt);
  const deadlineInfo = computeDeadlineIntelligence(app.deadline || '');

  // 1. Overdue
  if (deadlineInfo.deadlineCategory === 'OVERDUE' && !['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'].includes(app.currentStatus || '')) {
    return {
      healthStatus: 'OVERDUE',
      healthReason: 'The official application deadline has passed.',
      healthAction: 'Check if portal allows late submissions or await next cycle.',
    };
  }

  // 2. Blocked
  if (activeBlockers.length > 0 || app.currentStatus === 'ACTION_REQUIRED') {
    const reason = activeBlockers[0]?.description || 'Required action needed from applicant.';
    return {
      healthStatus: 'BLOCKED',
      healthReason: reason,
      healthAction: 'Resolve missing documents or profile blockers to proceed.',
    };
  }

  // 3. Urgent
  if (deadlineInfo.deadlineCategory === 'URGENT' && !['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'].includes(app.currentStatus || '')) {
    return {
      healthStatus: 'URGENT',
      healthReason: `Deadline is approaching in ${deadlineInfo.daysRemaining} day(s).`,
      healthAction: 'Complete application on the official portal immediately.',
    };
  }

  // 4. Attention Required (Inactive for > 14 days)
  const lastActive = app.lastUpdatedAt || app.updatedAt || app.createdAt || Date.now();
  const daysInactive = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24));
  if (daysInactive >= 14 && ['SUBMITTED', 'UNDER_REVIEW', 'VERIFICATION_PENDING'].includes(app.currentStatus || '')) {
    return {
      healthStatus: 'ATTENTION_REQUIRED',
      healthReason: `Application has had no status updates for ${daysInactive} days.`,
      healthAction: 'Check the official portal for verification notes or status change.',
    };
  }

  return {
    healthStatus: 'HEALTHY',
    healthReason: 'Application is progressing normally on schedule.',
    healthAction: 'No immediate blocker. Follow up per schedule.',
  };
}

export function computeNextAction(app: Partial<Application>): string {
  switch (app.currentStatus) {
    case 'DISCOVERED':
      return 'Check your eligibility criteria for this scheme';
    case 'INTERESTED':
      return 'Review required documents and begin application preparation';
    case 'PREPARING':
      if ((app.missingDocuments?.length ?? 0) > 0) {
        return `Upload missing document: ${app.missingDocuments?.[0]}`;
      }
      return 'Mark application as ready and proceed to apply';
    case 'READY_TO_APPLY':
      return 'Open official application portal and submit your details';
    case 'APPLICATION_STARTED':
      return 'Complete submission on the official portal and confirm back here';
    case 'AWAITING_EXTERNAL_SUBMISSION':
      return 'Confirm whether you submitted on the official portal';
    case 'SUBMITTED':
      return 'Awaiting government / institution review. Keep your reference number handy';
    case 'UNDER_REVIEW':
      return 'Application under review. Monitor official portal for status updates';
    case 'ACTION_REQUIRED':
      return 'Action required by government authority. Check official portal notices';
    case 'VERIFICATION_PENDING':
      return 'Institution / field verification in progress';
    case 'APPROVED':
      if (app.isRenewable) return 'Benefit approved! Schedule renewal dates';
      return 'Benefit approved! Claim disbursement as per scheme guidelines';
    case 'REJECTED':
      return 'Review rejection reason. You can re-apply if eligible';
    case 'COMPLETED':
      if (app.isRenewable && app.renewalStatus === 'UPCOMING') {
        return `Renewal window approaches: ${app.nextRenewalDate || 'Upcoming'}`;
      }
      return 'Benefit received successfully — case complete';
    case 'RENEWAL_DUE':
      return 'Renewal window is open! Prepare your updated documents';
    case 'RENEWAL_IN_PROGRESS':
      return 'Submit renewal application on official portal and confirm';
    case 'RENEWED':
      return 'Benefit successfully renewed for the next cycle';
    case 'EXPIRED':
      return 'Scheme application expired. Check for future openings';
    default:
      return 'Review application details';
  }
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

export async function createApplication(
  uid: string,
  benefit: Benefit,
  eligibility: EligibilityResult,
  options?: { autoStart?: boolean; source?: string },
): Promise<Application> {
  const id = crypto.randomUUID();
  const now = Date.now();

  const blockers: ApplicationBlocker[] = [];
  if (eligibility.missingCriteria && eligibility.missingCriteria.length > 0) {
    blockers.push({
      id: crypto.randomUUID(),
      type: 'PROFILE_INCOMPLETE',
      description: `Profile fields required: ${eligibility.missingCriteria.join('; ')}`,
    });
  }
  (eligibility.missingDocuments || []).forEach(docType => {
    blockers.push({
      id: crypto.randomUUID(),
      type: 'MISSING_DOCUMENT',
      description: `Document required: ${docType}`,
    });
  });

  const isReady = (eligibility.missingDocuments?.length ?? 0) === 0 && (eligibility.missingCriteria?.length ?? 0) === 0;
  const initialStatus: ApplicationStatus = options?.autoStart
    ? (isReady ? 'READY_TO_APPLY' : 'PREPARING')
    : 'INTERESTED';

  const deadlineInfo = computeDeadlineIntelligence(benefit.deadline);

  // Renewal setup if renewable
  const isRenewable = !!benefit.isRenewable;
  let nextRenewalDate: string | undefined;
  let renewalDeadline: string | undefined;
  if (isRenewable) {
    const oneYearLater = new Date(now + 365 * 24 * 60 * 60 * 1000);
    nextRenewalDate = oneYearLater.toISOString().split('T')[0];
    const renewalDue = new Date(now + 395 * 24 * 60 * 60 * 1000);
    renewalDeadline = renewalDue.toISOString().split('T')[0];
  }

  const app: Application = {
    id,
    uid,
    benefitId: benefit.id,
    benefitTitle: benefit.title,
    benefitIssuer: benefit.issuer,
    benefitCategory: benefit.category,
    applicationUrl: benefit.provenance.applicationUrl,
    currentStatus: initialStatus,
    eligibilityStatus: eligibility.status,
    eligibilityConfidence: eligibility.confidenceLevel,
    requiredDocuments: benefit.requiredDocuments || [],
    uploadedDocuments: (benefit.requiredDocuments || []).filter(d => !(eligibility.missingDocuments || []).includes(d)),
    missingDocuments: eligibility.missingDocuments || [],
    blockers,
    taskIds: [],
    deadline: benefit.deadline || 'Ongoing',
    daysRemaining: deadlineInfo.daysRemaining,
    deadlineCategory: deadlineInfo.deadlineCategory,
    readinessScore: 0,
    nextAction: '',
    agentNotes: `Application tracking started. Initial eligibility: ${eligibility.status} (${eligibility.confidenceLevel} confidence).`,
    source: options?.source || 'Discovery Engine',
    verificationLevel: 1,
    verificationSource: 'Official Portal Discovery',
    timeline: [
      makeTimelineEvent('DISCOVERED', 'SYSTEM', 'Benefit discovered via BenefitBridge Discovery Engine', 'Discovery Engine', 'BENEFIT_DISCOVERED'),
      makeTimelineEvent('INTERESTED', 'AGENT', `Eligibility evaluated: ${eligibility.status} (${eligibility.confidenceLevel} confidence)`, 'Eligibility Engine', 'ELIGIBILITY_EVALUATED'),
      makeTimelineEvent(initialStatus, 'USER', `Application record created and tracking initiated in status: ${STATUS_LABELS[initialStatus]}`, 'User Action', 'APPLICATION_CREATED'),
    ],
    isRenewable,
    renewalStatus: isRenewable ? 'FUTURE' : 'NOT_APPLICABLE',
    renewalHistory: [],
    createdAt: now,
    updatedAt: now,
    lastUpdatedAt: now,
  } as unknown as Application;

  if (benefit.renewalInfo?.renewalFrequency || isRenewable) {
    app.renewalFrequency = benefit.renewalInfo?.renewalFrequency || 'ANNUAL';
  }
  if (nextRenewalDate) app.nextRenewalDate = nextRenewalDate;
  if (renewalDeadline) app.renewalDeadline = renewalDeadline;

  app.readinessScore = computeReadiness(app);
  const health = computeApplicationHealth(app);
  app.healthStatus = health.healthStatus;
  app.healthReason = health.healthReason;
  app.healthAction = health.healthAction;
  app.nextAction = computeNextAction(app);

  // Clean undefined from health stats if any
  const cleanApp = Object.fromEntries(Object.entries(app).filter(([_, v]) => v !== undefined));

  await setDoc(doc(db, COLLECTION, id), cleanApp);

  // Automatically generate tasks for missing documents if any
  for (const missingDoc of app.missingDocuments) {
    await createTask(uid, {
      title: `Upload ${missingDoc}`,
      description: `Required for "${benefit.title}" application. Upload to Document Vault.`,
      actionType: 'UPLOAD_DOCUMENT',
      priority: deadlineInfo.deadlineCategory === 'URGENT' ? 'URGENT' : 'HIGH',
      createdBy: 'AGENT',
      relatedApplicationId: id,
      relatedBenefitId: benefit.id,
      relatedBenefitTitle: benefit.title,
      actionPayload: { documentType: missingDoc, redirectPath: '/vault' },
      dueDate: typeof deadlineInfo.daysRemaining === 'number' && deadlineInfo.daysRemaining < 365 ? Date.now() + deadlineInfo.daysRemaining * 86400000 : undefined,
    });
  }

  await logActivity(uid, 'AGENT', `Created application tracking record for "${benefit.title}"`, {
    relatedApplicationId: id,
    target: benefit.title,
    status: 'SUCCESS',
  });

  return app;
}

export async function getApplication(applicationId: string): Promise<Application | null> {
  const snap = await getDoc(doc(db, COLLECTION, applicationId));
  return snap.exists() ? (snap.data() as Application) : null;
}

export async function getUserApplications(uid: string): Promise<Application[]> {
  const q = query(collection(db, COLLECTION), where('uid', '==', uid));
  const snap = await getDocs(q);
  const apps: Application[] = [];
  snap.forEach(d => {
    const item = d.data() as Application;
    // Recompute dynamic values on read
    const deadlineInfo = computeDeadlineIntelligence(item.deadline);
    item.daysRemaining = deadlineInfo.daysRemaining;
    item.deadlineCategory = deadlineInfo.deadlineCategory;
    const health = computeApplicationHealth(item);
    item.healthStatus = health.healthStatus;
    item.healthReason = health.healthReason;
    item.healthAction = health.healthAction;
    apps.push(item);
  });
  return apps.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getApplicationForBenefit(uid: string, benefitId: string): Promise<Application | null> {
  const q = query(
    collection(db, COLLECTION),
    where('uid', '==', uid),
    where('benefitId', '==', benefitId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const app = snap.docs[0].data() as Application;
  const deadlineInfo = computeDeadlineIntelligence(app.deadline);
  app.daysRemaining = deadlineInfo.daysRemaining;
  app.deadlineCategory = deadlineInfo.deadlineCategory;
  const health = computeApplicationHealth(app);
  app.healthStatus = health.healthStatus;
  app.healthReason = health.healthReason;
  app.healthAction = health.healthAction;
  return app;
}

// ─── State Machine Transition ─────────────────────────────────────────────────

export async function transitionApplication(
  applicationId: string,
  nextStatus: ApplicationStatus,
  actor: TimelineEvent['actor'],
  note: string,
  extraUpdates?: Partial<Application>,
  source: string = 'BenefitBridge Core',
): Promise<Application> {
  const app = await getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const allowed = VALID_TRANSITIONS[app.currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    // Gracefully handle or log transition
    console.warn(`Direct transition from ${app.currentStatus} to ${nextStatus}`);
  }

  const timelineEvent = makeTimelineEvent(nextStatus, actor, note, source);
  const now = Date.now();
  const updates: Partial<Application> = {
    currentStatus: nextStatus,
    previousStatus: app.currentStatus,
    timeline: [...app.timeline, timelineEvent],
    updatedAt: now,
    lastUpdatedAt: now,
    ...extraUpdates,
  };

  const merged = { ...app, ...updates };
  const deadlineInfo = computeDeadlineIntelligence(merged.deadline);
  updates.daysRemaining = deadlineInfo.daysRemaining;
  updates.deadlineCategory = deadlineInfo.deadlineCategory;
  updates.readinessScore = computeReadiness(merged);
  const health = computeApplicationHealth(merged);
  updates.healthStatus = health.healthStatus;
  updates.healthReason = health.healthReason;
  updates.healthAction = health.healthAction;
  updates.nextAction = computeNextAction(merged);

  await updateDoc(doc(db, COLLECTION, applicationId), updates);
  return { ...merged, ...updates } as Application;
}

// ─── Step 6 & 7: External Submission Confirmation ─────────────────────────────

export async function recordExternalSubmission(
  applicationId: string,
  uid: string,
  data: {
    referenceNumber: string;
    submissionDate?: string;
    notes?: string;
  },
): Promise<Application> {
  const app = await getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const now = Date.now();
  const ref = data.referenceNumber.trim();
  const note = data.notes
    ? `User confirmed external submission. Ref: ${ref}. Notes: ${data.notes}`
    : `User confirmed external submission with reference number: ${ref}`;

  const updated = await transitionApplication(
    applicationId,
    'SUBMITTED',
    'USER',
    note,
    {
      referenceNumber: ref,
      applicationNumber: ref,
      applicationSubmittedAt: data.submissionDate ? new Date(data.submissionDate).getTime() : now,
      verificationLevel: 2,
      verificationSource: 'User Confirmation & Reference Entry',
      agentNotes: `Submission confirmed by user on ${new Date().toLocaleDateString('en-IN')}. Reference number recorded: ${ref}. Active monitoring scheduled.`,
    },
    'External Submission Form',
  );

  // Automatically create a follow-up task
  await createTask(uid, {
    title: `Track Verification: ${app.benefitTitle}`,
    description: `Check the official portal using Reference #${ref} for verification updates and acknowledgement.`,
    actionType: 'CHECK_PORTAL_STATUS',
    priority: 'HIGH',
    createdBy: 'SYSTEM',
    relatedApplicationId: applicationId,
    relatedBenefitId: app.benefitId,
    relatedBenefitTitle: app.benefitTitle,
    actionPayload: { referenceNumber: ref, externalUrl: app.applicationUrl },
    dueDate: now + 7 * 24 * 60 * 60 * 1000, // Check after 7 days
  });

  await logActivity(uid, 'USER', `Confirmed submission for "${app.benefitTitle}" with Ref #${ref}`, {
    relatedApplicationId: applicationId,
    target: app.benefitTitle,
    result: ref,
    status: 'SUCCESS',
  });

  return updated;
}

export async function recordSubmissionUnsure(
  applicationId: string,
  uid: string,
): Promise<Application> {
  const app = await getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const updated = await transitionApplication(
    applicationId,
    'AWAITING_EXTERNAL_SUBMISSION',
    'USER',
    'User indicated uncertainty regarding portal submission status. Agent guidance initiated.',
    {
      agentNotes: 'User was unsure if external submission succeeded. Provide guidance on checking portal acknowledgement, email/SMS confirmation, or saved reference numbers.',
    },
    'Submission Check Dialog',
  );

  await createTask(uid, {
    title: `Verify Portal Submission: ${app.benefitTitle}`,
    description: 'Check your email/SMS inbox for acknowledgement, or re-open the portal to confirm if your application was received.',
    actionType: 'CHECK_PORTAL_STATUS',
    priority: 'HIGH',
    createdBy: 'AGENT',
    relatedApplicationId: applicationId,
    relatedBenefitId: app.benefitId,
    relatedBenefitTitle: app.benefitTitle,
    actionPayload: { externalUrl: app.applicationUrl },
  });

  return updated;
}

// ─── Document Sync ────────────────────────────────────────────────────────────

export async function syncApplicationDocuments(
  applicationId: string,
  uploadedDocTypes: string[],
): Promise<Application> {
  const app = await getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const newMissing = app.requiredDocuments.filter(d => !uploadedDocTypes.includes(d));
  const newUploaded = app.requiredDocuments.filter(d => uploadedDocTypes.includes(d));

  const updatedBlockers = app.blockers.map(b => {
    if (b.type === 'MISSING_DOCUMENT' && !b.resolvedAt) {
      const docName = b.description.replace('Document required: ', '');
      if (uploadedDocTypes.includes(docName)) {
        return { ...b, resolvedAt: Date.now() };
      }
    }
    return b;
  });

  const updates: Partial<Application> = {
    uploadedDocuments: newUploaded,
    missingDocuments: newMissing,
    blockers: updatedBlockers,
    updatedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  const merged = { ...app, ...updates };
  updates.readinessScore = computeReadiness(merged);
  const health = computeApplicationHealth(merged);
  updates.healthStatus = health.healthStatus;
  updates.healthReason = health.healthReason;
  updates.healthAction = health.healthAction;

  if (newMissing.length === 0 && app.currentStatus === 'PREPARING') {
    const event = makeTimelineEvent(
      'READY_TO_APPLY',
      'AGENT',
      'All required documents verified in Document Vault — application is ready to apply',
    );
    updates.currentStatus = 'READY_TO_APPLY';
    updates.timeline = [...app.timeline, event];
  }

  updates.nextAction = computeNextAction({ ...merged, ...updates });

  await updateDoc(doc(db, COLLECTION, applicationId), updates);
  return { ...merged, ...updates } as Application;
}

export async function deleteApplication(applicationId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, applicationId));
}
