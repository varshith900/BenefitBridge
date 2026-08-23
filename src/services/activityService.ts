import { collection, query, where, getDocs, setDoc, doc, } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityEvent, ActivityActor, ActivityStatus } from '../types/activity';

const COLLECTION = 'activities';

export async function logActivity(
  uid: string,
  actor: ActivityActor,
  action: string,
  params?: {
    tool?: string;
    target?: string;
    result?: string;
    status?: ActivityStatus;
    relatedApplicationId?: string;
    relatedTaskId?: string;
  }
): Promise<ActivityEvent> {
  const id = crypto.randomUUID();
  const event: ActivityEvent = {
    id,
    uid,
    timestamp: Date.now(),
    actor,
    action,
    status: params?.status || 'SUCCESS',
  };
  if (params?.tool) event.tool = params.tool;
  if (params?.target) event.target = params.target;
  if (params?.result) event.result = params.result;
  if (params?.relatedApplicationId) event.relatedApplicationId = params.relatedApplicationId;
  if (params?.relatedTaskId) event.relatedTaskId = params.relatedTaskId;

  await setDoc(doc(db, COLLECTION, id), event);
  return event;
}

export async function getUserActivities(uid: string, limitCount = 50): Promise<ActivityEvent[]> {
  const q = query(
    collection(db, COLLECTION),
    where('uid', '==', uid)
    // Note: To use orderBy with where, we would need a composite index in Firestore.
    // For MVP, we'll fetch all or order in memory, or just not use orderBy if we don't have the index.
  );
  const snap = await getDocs(q);
  const activities: ActivityEvent[] = [];
  snap.forEach(d => activities.push(d.data() as ActivityEvent));
  
  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limitCount);
}
