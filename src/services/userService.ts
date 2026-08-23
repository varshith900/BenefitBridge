import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types/user';

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  } else {
    return null;
  }
}

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const now = Date.now();
  
  await setDoc(docRef, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  
  await setDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  }, { merge: true });
}
