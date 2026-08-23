import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AgentSession, AgentAction, AgentRun } from '../types/agent';

const SESSIONS_COLLECTION = 'agentSessions';
const RUNS_COLLECTION = 'agentRuns';

export async function getAgentSession(uid: string): Promise<AgentSession | null> {
  const docRef = doc(db, SESSIONS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as AgentSession;
  }
  return null;
}

export function subscribeToAgentSession(
  uid: string,
  onUpdate: (session: AgentSession) => void
): () => void {
  const docRef = doc(db, SESSIONS_COLLECTION, uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as AgentSession);
    }
  });
}

export async function createOrResetAgentSession(uid: string): Promise<AgentSession> {
  const docRef = doc(db, SESSIONS_COLLECTION, uid);
  const now = Date.now();
  
  const newSession: AgentSession = {
    uid,
    sessionId: uid, 
    status: 'IDLE',
    currentRunId: null,
    history: [],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, newSession);
  return newSession;
}

export async function updateAgentSession(uid: string, updates: Partial<AgentSession>): Promise<void> {
  const docRef = doc(db, SESSIONS_COLLECTION, uid);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function addAgentAction(uid: string, action: AgentAction, currentHistory: AgentAction[]): Promise<void> {
  const docRef = doc(db, SESSIONS_COLLECTION, uid);
  await updateDoc(docRef, {
    history: [...currentHistory, action],
    updatedAt: Date.now(),
  });
}

// --- Agent Runs ---

export async function createAgentRun(uid: string, goal: string): Promise<AgentRun> {
  const runId = crypto.randomUUID();
  const docRef = doc(db, RUNS_COLLECTION, runId);
  const now = Date.now();

  const newRun: AgentRun = {
    id: runId,
    uid,
    goal,
    status: 'PLANNING',
    plan: null,
    currentStepIndex: 0,
    toolsUsed: [],
    observations: [],
    decisions: [],
    pendingUserAction: null,
    nextAction: 'Create a plan to achieve the user goal',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, newRun);
  return newRun;
}

export async function getAgentRun(runId: string): Promise<AgentRun | null> {
  const docRef = doc(db, RUNS_COLLECTION, runId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as AgentRun;
  }
  return null;
}

export async function updateAgentRun(runId: string, updates: Partial<AgentRun>): Promise<void> {
  const docRef = doc(db, RUNS_COLLECTION, runId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}
