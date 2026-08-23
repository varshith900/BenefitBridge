import { getUserProfile } from '../userService';
import { CURATED_BENEFITS } from '../../data/benefits';
import { evaluateEligibility } from '../eligibilityEngine';
import {
  createTask, getPendingTasks, updateTaskStatus,
} from '../taskService';
import { getUserDocuments } from '../documentService';
import {
  getUserApplications, getApplication, createApplication,
  transitionApplication, recordExternalSubmission,
  computeDeadlineIntelligence,
} from '../applicationService';
import type { ApplicationStatus } from '../../types/application';
import type { UserProfile } from '../../types/user';

// ─── Tool Declarations for Gemini Function Calling ───────────────────────────

export const TOOLS = [
  {
    name: 'get_user_profile',
    description: "Retrieves the user's complete profile (state, income, education, employment, date of birth, category).",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'find_benefits',
    description: 'Returns all curated government benefit schemes and scholarships with eligibility criteria.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'check_eligibility',
    description: "Evaluates the user's eligibility for a specific benefit scheme by its ID.",
    parameters: {
      type: 'object',
      properties: {
        benefitId: { type: 'string', description: 'The benefit ID to evaluate.' },
      },
      required: ['benefitId'],
    },
  },
  {
    name: 'check_documents',
    description: "Checks the user's Document Vault for available and verified documents.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_applications',
    description: "Returns all of the user's benefit applications, tracking statuses, deadlines, readiness scores, and health.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_application',
    description: 'Retrieves a single application by its applicationId.',
    parameters: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'The unique application ID.' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'create_application',
    description: 'Starts and tracks a new benefit application for the user.',
    parameters: {
      type: 'object',
      properties: {
        benefitId: { type: 'string', description: 'The benefit ID to apply for.' },
      },
      required: ['benefitId'],
    },
  },
  {
    name: 'update_application_status',
    description: 'Transitions an application to a new state and adds a timeline log.',
    parameters: {
      type: 'object',
      properties: {
        applicationId: { type: 'string' },
        nextStatus: {
          type: 'string',
          enum: [
            'DISCOVERED', 'INTERESTED', 'PREPARING', 'READY_TO_APPLY',
            'APPLICATION_STARTED', 'AWAITING_EXTERNAL_SUBMISSION', 'SUBMITTED',
            'UNDER_REVIEW', 'ACTION_REQUIRED', 'VERIFICATION_PENDING',
            'APPROVED', 'REJECTED', 'COMPLETED', 'RENEWAL_DUE',
          ],
        },
        note: { type: 'string', description: 'Reason or note for this transition.' },
      },
      required: ['applicationId', 'nextStatus', 'note'],
    },
  },
  {
    name: 'record_external_submission',
    description: 'Records an official external portal submission with reference/acknowledgement number.',
    parameters: {
      type: 'object',
      properties: {
        applicationId: { type: 'string' },
        referenceNumber: { type: 'string', description: 'Government/Portal reference number.' },
        notes: { type: 'string' },
      },
      required: ['applicationId', 'referenceNumber'],
    },
  },
  {
    name: 'list_pending_tasks',
    description: 'Returns all pending/in-progress tasks the user needs to complete, sorted by priority.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_task',
    description: 'Creates a specific task for the user.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        actionType: {
          type: 'string',
          enum: [
            'UPLOAD_DOCUMENT', 'FILL_PROFILE', 'REVIEW_APPLICATION',
            'APPROVE_SUBMISSION', 'CHECK_PORTAL_STATUS', 'RESOLVE_BLOCKER',
            'VERIFY_DEADLINE', 'RENEWAL_REMINDER', 'PREPARE_RENEWAL', 'GENERIC',
          ],
        },
        priority: {
          type: 'string',
          enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
        },
        relatedApplicationId: { type: 'string' },
      },
      required: ['title', 'description', 'actionType', 'priority'],
    },
  },
  {
    name: 'complete_task',
    description: 'Marks a task as completed.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'check_deadlines',
    description: 'Checks upcoming deadlines across all active applications and categorizes urgency (SAFE, UPCOMING, URGENT, OVERDUE).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_renewals',
    description: 'Retrieves all recurring/renewable applications, upcoming renewal dates, and preparation windows.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'prepare_renewal',
    description: 'Prepares a renewal for an approved/completed benefit by checking required documents vs Document Vault.',
    parameters: {
      type: 'object',
      properties: {
        applicationId: { type: 'string' },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'check_application_health',
    description: 'Evaluates whether user applications are HEALTHY, ATTENTION_REQUIRED, URGENT, BLOCKED, or OVERDUE.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_next_best_action',
    description: 'Synthesizes active applications, deadlines, missing documents, and tasks to return the single highest-priority next action.',
    parameters: { type: 'object', properties: {} },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, any>,
  uid: string,
): Promise<any> {
  let result: any;

  const fallbackProfile: UserProfile = {
    uid,
    email: null,
    displayName: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  switch (name) {
    case 'get_user_profile': {
      const profile = await getUserProfile(uid);
      result = profile || fallbackProfile;
      break;
    }

    case 'find_benefits': {
      result = CURATED_BENEFITS.map(b => ({
        id: b.id,
        title: b.title,
        issuer: b.issuer,
        category: b.category,
        benefitAmount: b.benefitAmount,
        deadline: b.deadline,
        requiredDocuments: b.requiredDocuments,
        isRenewable: b.isRenewable,
      }));
      break;
    }

    case 'check_eligibility': {
      const benefit = CURATED_BENEFITS.find(b => b.id === args.benefitId);
      if (!benefit) {
        result = { error: 'Benefit not found.' };
        break;
      }
      const profile = (await getUserProfile(uid)) || fallbackProfile;
      const docs = await getUserDocuments(uid);
      result = evaluateEligibility(profile, benefit, docs.map(d => d.type));
      break;
    }

    case 'check_documents': {
      const docs = await getUserDocuments(uid);
      result = {
        totalDocuments: docs.length,
        documents: docs.map(d => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          status: d.status,
        })),
      };
      break;
    }

    case 'list_applications': {
      const apps = await getUserApplications(uid);
      result = apps.map(a => ({
        id: a.id,
        benefitTitle: a.benefitTitle,
        category: a.benefitCategory,
        status: a.currentStatus,
        readinessScore: a.readinessScore,
        deadline: a.deadline,
        daysRemaining: a.daysRemaining,
        health: a.healthStatus,
        referenceNumber: a.referenceNumber,
        nextAction: a.nextAction,
        isRenewable: a.isRenewable,
        nextRenewalDate: a.nextRenewalDate,
      }));
      break;
    }

    case 'get_application': {
      const app = await getApplication(args.applicationId);
      result = app || { error: 'Application not found.' };
      break;
    }

    case 'create_application': {
      const benefit = CURATED_BENEFITS.find(b => b.id === args.benefitId);
      if (!benefit) {
        result = { error: 'Benefit not found.' };
        break;
      }
      const profile = (await getUserProfile(uid)) || fallbackProfile;
      const docs = await getUserDocuments(uid);
      const eligibility = evaluateEligibility(profile, benefit, docs.map(d => d.type));
      const app = await createApplication(uid, benefit, eligibility, { autoStart: true });
      result = {
        message: `Application created for ${benefit.title}`,
        applicationId: app.id,
        status: app.currentStatus,
        readinessScore: app.readinessScore,
      };
      break;
    }

    case 'update_application_status': {
      const updated = await transitionApplication(
        args.applicationId,
        args.nextStatus as ApplicationStatus,
        'AGENT',
        args.note,
        {},
        'Autonomous Agent'
      );
      result = {
        message: `Status updated to ${updated.currentStatus}`,
        applicationId: updated.id,
      };
      break;
    }

    case 'record_external_submission': {
      const updated = await recordExternalSubmission(args.applicationId, uid, {
        referenceNumber: args.referenceNumber,
        notes: args.notes,
      });
      result = {
        message: `Submission confirmed with Reference #${args.referenceNumber}`,
        status: updated.currentStatus,
      };
      break;
    }

    case 'list_pending_tasks': {
      const tasks = await getPendingTasks(uid);
      result = tasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        actionType: t.actionType,
        relatedApplicationId: t.relatedApplicationId,
      }));
      break;
    }

    case 'create_task': {
      const task = await createTask(uid, {
        title: args.title,
        description: args.description,
        actionType: args.actionType,
        priority: args.priority,
        createdBy: 'AGENT',
        relatedApplicationId: args.relatedApplicationId,
      });
      result = { message: 'Task created.', taskId: task.id };
      break;
    }

    case 'complete_task': {
      const task = await updateTaskStatus(args.taskId, 'COMPLETED');
      result = { message: `Task "${task.title}" completed.` };
      break;
    }

    case 'check_deadlines': {
      const apps = await getUserApplications(uid);
      const deadlineReport = apps
        .filter(a => !['COMPLETED', 'REJECTED'].includes(a.currentStatus))
        .map(a => {
          const info = computeDeadlineIntelligence(a.deadline);
          return {
            applicationId: a.id,
            benefitTitle: a.benefitTitle,
            deadline: a.deadline,
            daysRemaining: info.daysRemaining,
            category: info.deadlineCategory,
          };
        })
        .sort((a, b) => a.daysRemaining - b.daysRemaining);
      result = { activeApplicationsWithDeadlines: deadlineReport };
      break;
    }

    case 'get_renewals': {
      const apps = await getUserApplications(uid);
      const renewals = apps.filter(a => a.isRenewable);
      result = renewals.map(r => ({
        applicationId: r.id,
        benefitTitle: r.benefitTitle,
        renewalStatus: r.renewalStatus,
        nextRenewalDate: r.nextRenewalDate,
        renewalDeadline: r.renewalDeadline,
        readinessScore: r.renewalReadinessScore,
      }));
      break;
    }

    case 'prepare_renewal': {
      const app = await getApplication(args.applicationId);
      if (!app) {
        result = { error: 'Application not found.' };
        break;
      }
      const docs = await getUserDocuments(uid);
      const docTypes = docs.map(d => d.type);
      const required = app.requiredDocuments || [];
      const have = required.filter(r => docTypes.includes(r));
      const missing = required.filter(r => !docTypes.includes(r));

      for (const m of missing) {
        await createTask(uid, {
          title: `Upload ${m} for renewal`,
          description: `Required for ${app.benefitTitle} renewal cycle.`,
          actionType: 'UPLOAD_DOCUMENT',
          priority: 'HIGH',
          createdBy: 'AGENT',
          relatedApplicationId: app.id,
          actionPayload: { documentType: m },
        });
      }

      result = {
        message: `Renewal preparation initiated for ${app.benefitTitle}`,
        requiredDocuments: required,
        availableDocuments: have,
        missingDocuments: missing,
        readinessScore: Math.round((have.length / Math.max(1, required.length)) * 100),
      };
      break;
    }

    case 'check_application_health': {
      const apps = await getUserApplications(uid);
      result = apps.map(a => ({
        id: a.id,
        benefitTitle: a.benefitTitle,
        healthStatus: a.healthStatus,
        reason: a.healthReason,
        recommendedAction: a.healthAction,
      }));
      break;
    }

    case 'get_next_best_action': {
      const apps = await getUserApplications(uid);
      const tasks = await getPendingTasks(uid);

      if (tasks.length > 0) {
        const topTask = tasks[0];
        result = {
          highestPriorityAction: topTask.title,
          description: topTask.description,
          priority: topTask.priority,
          relatedApplicationId: topTask.relatedApplicationId,
        };
      } else if (apps.length > 0) {
        const active = apps.filter(a => !['COMPLETED', 'REJECTED'].includes(a.currentStatus));
        if (active.length > 0) {
          const topApp = active[0];
          result = {
            highestPriorityAction: topApp.nextAction,
            benefitTitle: topApp.benefitTitle,
            applicationId: topApp.id,
            health: topApp.healthStatus,
          };
        } else {
          result = { message: 'All applications completed. Ready to discover new benefits.' };
        }
      } else {
        result = { message: 'No applications yet. Head to Opportunities to discover benefits matching your profile.' };
      }
      break;
    }

    default:
      result = { error: `Tool ${name} not recognized.` };
  }

  return result;
}
