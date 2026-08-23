import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Application } from '../types/application';
import { makeTimelineEvent } from './applicationService';
import { createDeadlineReminderTask, createTask } from './taskService';

export async function checkApplicationMonitoring(applicationId: string, appData: Application): Promise<Application> {
  const now = Date.now();
  const updates: Partial<Application> = {};
  const newTimelineEvents = [];
  let tasksCreated = 0;

  // 1. Detect Approaching Deadline
  if (appData.deadline && appData.deadline !== 'Ongoing') {
    const deadlineDate = new Date(appData.deadline.split(' ')[0]);
    if (!isNaN(deadlineDate.getTime())) {
      const daysLeft = Math.ceil((deadlineDate.getTime() - now) / (1000 * 60 * 60 * 24));
      
      // If deadline is <= 7 days and we haven't warned recently (e.g. in last 24h)
      if (daysLeft > 0 && daysLeft <= 7) {
        const lastDeadlineWarning = appData.timeline.find(t => 
          t.actor === 'SYSTEM' && t.note.includes('Deadline approaching') && (now - t.timestamp) < 24 * 60 * 60 * 1000
        );

        if (!lastDeadlineWarning) {
          newTimelineEvents.push(
            makeTimelineEvent('PREPARING', 'SYSTEM', `Deadline approaching in ${daysLeft} days. Action required.`)
          );
          
          await createDeadlineReminderTask(appData.uid, {
            benefitId: appData.benefitId,
            benefitTitle: appData.benefitTitle,
            deadline: deadlineDate.getTime(),
            applicationId: appData.id
          });
          tasksCreated++;
          updates.pendingAction = 'Complete application before deadline';
        }
      }
    }
  }

  // 2. Detect Prolonged Inactivity (no updates in > 7 days)
  const lastUpdate = appData.timeline.length > 0 
    ? appData.timeline[appData.timeline.length - 1].timestamp 
    : appData.updatedAt;
  
  const daysInactive = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24));
  if (daysInactive >= 7 && !['COMPLETED', 'REJECTED', 'APPROVED'].includes(appData.currentStatus)) {
    const lastInactivityWarning = appData.timeline.find(t => 
      t.actor === 'SYSTEM' && t.note.includes('prolonged inactivity') && (now - t.timestamp) < 7 * 24 * 60 * 60 * 1000
    );

    if (!lastInactivityWarning) {
      newTimelineEvents.push(
        makeTimelineEvent(appData.currentStatus, 'SYSTEM', `Detected prolonged inactivity (${daysInactive} days). Please review requirements.`)
      );

      await createTask(appData.uid, {
        title: `Resume Application: ${appData.benefitTitle}`,
        description: `Your application for ${appData.benefitTitle} has been inactive for ${daysInactive} days. Please review and continue.`,
        actionType: 'REVIEW_APPLICATION',
        priority: 'MEDIUM',
        createdBy: 'SYSTEM',
        relatedApplicationId: appData.id,
        relatedBenefitTitle: appData.benefitTitle,
        actionPayload: { redirectPath: `/applications/${appData.id}` }
      });
      tasksCreated++;
    }
  }

  // 3. Status Change Detection (If previousStatus != currentStatus)
  if (appData.previousStatus && appData.previousStatus !== appData.currentStatus) {
    newTimelineEvents.push(
      makeTimelineEvent(appData.currentStatus, 'SYSTEM', `Status changed from ${appData.previousStatus} to ${appData.currentStatus}`)
    );
    updates.previousStatus = appData.currentStatus;
  } else if (!appData.previousStatus) {
    updates.previousStatus = appData.currentStatus;
  }

  // 4. Missing Verification / Action Required
  if (appData.currentStatus === 'ACTION_REQUIRED' || (appData.blockers && appData.blockers.filter(b => !b.resolvedAt).length > 0)) {
    const lastBlockerWarning = appData.timeline.find(t => 
      t.actor === 'SYSTEM' && t.note.includes('action needed') && (now - t.timestamp) < 3 * 24 * 60 * 60 * 1000
    );
    if (!lastBlockerWarning) {
       newTimelineEvents.push(
         makeTimelineEvent('ACTION_REQUIRED', 'SYSTEM', `Application has active action items or missing required documents.`)
       );
       updates.pendingAction = 'Resolve blockers to proceed';
    }
  }

  // Apply updates
  if (newTimelineEvents.length > 0 || tasksCreated > 0) {
    updates.timeline = [...appData.timeline, ...newTimelineEvents];
    updates.updatedAt = now;
  }
  
  updates.lastChecked = now;
  updates.nextCheck = now + (24 * 60 * 60 * 1000); // Next check in 24h

  const docRef = doc(db, 'applications', applicationId);
  await updateDoc(docRef, updates);

  return {
    ...appData,
    ...updates,
  };
}

export async function runMonitoringForAllUserApplications(uid: string): Promise<number> {
  const q = query(collection(db, 'applications'), where('uid', '==', uid));
  const snap = await getDocs(q);
  
  let checkedCount = 0;
  for (const docSnap of snap.docs) {
    const app = docSnap.data() as Application;
    if (!['COMPLETED', 'REJECTED', 'APPROVED'].includes(app.currentStatus)) {
      await checkApplicationMonitoring(app.id, app);
      checkedCount++;
    }
  }
  return checkedCount;
}
