export type ActivityActor = 'USER' | 'AGENT' | 'SYSTEM';

export type ActivityStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface ActivityEvent {
  id: string;
  uid: string;
  timestamp: number;
  actor: ActivityActor;
  action: string;
  tool?: string;
  target?: string;
  result?: string;
  status: ActivityStatus;
  relatedApplicationId?: string;
  relatedTaskId?: string;
}
