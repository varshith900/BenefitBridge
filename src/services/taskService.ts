import { collection, query, where, getDocs, setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Task, TaskStatus, TaskPriority, TaskActionType, TaskCreatedBy } from '../types/task';
import { PRIORITY_ORDER } from '../types/task';

const TASKS_COLLECTION = 'tasks';

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getTask(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, TASKS_COLLECTION, taskId));
  return snap.exists() ? (snap.data() as Task) : null;
}

export async function getUserTasks(uid: string): Promise<Task[]> {
  const q = query(collection(db, TASKS_COLLECTION), where('uid', '==', uid));
  const snap = await getDocs(q);
  const tasks: Task[] = [];
  snap.forEach(d => tasks.push(d.data() as Task));

  // Sort: PENDING first by priority, then COMPLETED/CANCELLED at bottom by completedAt
  return tasks.sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
    if (a.status === 'PENDING' && b.status === 'PENDING') {
      const pDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (pDiff !== 0) return pDiff;
      // Closer due date wins
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    }
    return b.updatedAt - a.updatedAt;
  });
}

export async function getPendingTasks(uid: string): Promise<Task[]> {
  const tasks = await getUserTasks(uid);
  return tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
}

export async function getTopPriorityTask(uid: string): Promise<Task | null> {
  const pending = await getPendingTasks(uid);
  return pending[0] ?? null;
}

export async function getTasksForApplication(applicationId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('relatedApplicationId', '==', applicationId),
  );
  const snap = await getDocs(q);
  const tasks: Task[] = [];
  snap.forEach(d => tasks.push(d.data() as Task));
  return tasks.sort((a, b) => b.createdAt - a.createdAt);
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description: string;
  actionType: TaskActionType;
  priority: TaskPriority;
  createdBy: TaskCreatedBy;
  relatedApplicationId?: string;
  relatedBenefitId?: string;
  relatedBenefitTitle?: string;
  actionPayload?: Task['actionPayload'];
  dueDate?: number;
}

export async function createTask(uid: string, data: CreateTaskInput): Promise<Task> {
  const taskId = crypto.randomUUID();
  const now = Date.now();

    const newTask: Task = {
      id: taskId,
      uid,
      title: data.title,
      description: data.description,
      actionType: data.actionType,
      priority: data.priority,
      status: 'PENDING',
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };
  
    if (data.relatedApplicationId) newTask.relatedApplicationId = data.relatedApplicationId;
    if (data.relatedBenefitId) newTask.relatedBenefitId = data.relatedBenefitId;
    if (data.relatedBenefitTitle) newTask.relatedBenefitTitle = data.relatedBenefitTitle;
    if (data.actionPayload) newTask.actionPayload = data.actionPayload;
    if (data.dueDate) newTask.dueDate = data.dueDate;

  await setDoc(doc(db, TASKS_COLLECTION, taskId), newTask);
  return newTask;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  const now = Date.now();
  const updates: Partial<Task> = {
    status,
    updatedAt: now,
    ...(status === 'COMPLETED' || status === 'CANCELLED' ? { completedAt: now } : {}),
  };
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), updates);
  const task = await getTask(taskId);
  if (!task) throw new Error('Task not found after update');
  return task;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    ...updates,
    updatedAt: Date.now(),
  });
}

// ─── Agent-Driven Task Generation ─────────────────────────────────────────────
// These are semantic helpers for the agent to create well-typed tasks from
// real application state. They do NOT invent blockers — they read real data.

export async function createDocumentUploadTask(
  uid: string,
  documentType: string,
  opts: { applicationId?: string; benefitId?: string; benefitTitle?: string; deadline?: number },
): Promise<Task> {
  return createTask(uid, {
    title: `Upload: ${documentType}`,
    description:
      `Your Document Vault is missing "${documentType}", which is required to apply for ` +
      `${opts.benefitTitle ?? 'a benefit'}. Upload it to unblock your application.`,
    actionType: 'UPLOAD_DOCUMENT',
    priority: opts.deadline && (opts.deadline - Date.now()) < 30 * 24 * 60 * 60 * 1000 ? 'HIGH' : 'MEDIUM',
    createdBy: 'AGENT',
    relatedApplicationId: opts.applicationId,
    relatedBenefitId: opts.benefitId,
    relatedBenefitTitle: opts.benefitTitle,
    actionPayload: { documentType, redirectPath: '/vault' },
    dueDate: opts.deadline,
  });
}

export async function createProfileFieldTask(
  uid: string,
  missingFields: string[],
  opts: { applicationId?: string; benefitId?: string; benefitTitle?: string },
): Promise<Task> {
  return createTask(uid, {
    title: `Complete Profile: ${missingFields.slice(0, 2).join(', ')}`,
    description:
      `Your profile is missing information needed to verify your eligibility for ` +
      `${opts.benefitTitle ?? 'benefits'}. Please fill in: ${missingFields.join(', ')}.`,
    actionType: 'FILL_PROFILE',
    priority: 'HIGH',
    createdBy: 'AGENT',
    relatedApplicationId: opts.applicationId,
    relatedBenefitId: opts.benefitId,
    relatedBenefitTitle: opts.benefitTitle,
    actionPayload: { missingFields, redirectPath: '/profile' },
  });
}

export async function createApprovalTask(
  uid: string,
  applicationId: string,
  benefitTitle: string,
  applicationUrl: string,
): Promise<Task> {
  return createTask(uid, {
    title: `Approve Submission: ${benefitTitle}`,
    description:
      `Your application for "${benefitTitle}" is ready. Review it and approve submission. ` +
      `You will be directed to the official government portal to complete the submission.`,
    actionType: 'APPROVE_SUBMISSION',
    priority: 'URGENT',
    createdBy: 'AGENT',
    relatedApplicationId: applicationId,
    relatedBenefitTitle: benefitTitle,
    actionPayload: { redirectPath: `/applications/${applicationId}`, externalUrl: applicationUrl },
  });
}

export async function createDeadlineReminderTask(
  uid: string,
  opts: { benefitId: string; benefitTitle: string; deadline: number; applicationId?: string },
): Promise<Task> {
  const daysLeft = Math.ceil((opts.deadline - Date.now()) / (1000 * 60 * 60 * 24));
  return createTask(uid, {
    title: `Deadline Alert: ${opts.benefitTitle}`,
    description:
      `The application deadline for "${opts.benefitTitle}" is in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. ` +
      `Complete your application soon to avoid missing this opportunity.`,
    actionType: 'VERIFY_DEADLINE',
    priority: daysLeft <= 7 ? 'URGENT' : 'HIGH',
    createdBy: 'AGENT',
    relatedApplicationId: opts.applicationId,
    relatedBenefitId: opts.benefitId,
    relatedBenefitTitle: opts.benefitTitle,
    dueDate: opts.deadline,
  });
}
