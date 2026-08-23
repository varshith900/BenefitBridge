// 🟢 Task Types 🟢

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskActionType =
  | 'UPLOAD_DOCUMENT'
  | 'FILL_PROFILE'
  | 'REVIEW_APPLICATION'
  | 'APPROVE_SUBMISSION'
  | 'CHECK_PORTAL_STATUS'
  | 'RESOLVE_BLOCKER'
  | 'VERIFY_DEADLINE'
  | 'RENEWAL_REMINDER'
  | 'PREPARE_RENEWAL'
  | 'GENERIC';

export type TaskCreatedBy = 'AGENT' | 'USER' | 'SYSTEM';

export interface Task {
  id: string;
  uid: string;

  title: string;
  description: string;
  actionType: TaskActionType;
  priority: TaskPriority;
  status: TaskStatus;

  // Relationships — both optional, may relate to either or both
  relatedApplicationId?: string;
  relatedBenefitId?: string;
  relatedBenefitTitle?: string;     // Denormalised for quick display

  // Optional action target (e.g. which document to upload, which URL to visit)
  actionPayload?: {
    documentType?: string;          // For UPLOAD_DOCUMENT tasks
    profileField?: string;          // For FILL_PROFILE tasks
    externalUrl?: string;           // For portal checks
    [key: string]: any;
  };

  // Attribution
  createdBy: TaskCreatedBy;

  // Timing
  dueDate?: number;                 // Unix ms — null = no due date
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// 🟢 Priority ordering 🟢

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  URGENT: 'bg-red-600 text-white',
  HIGH: 'bg-amber-500 text-white',
  MEDIUM: 'bg-blue-500 text-white',
  LOW: 'bg-slate-400 text-white',
};
