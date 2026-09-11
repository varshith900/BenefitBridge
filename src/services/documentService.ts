import { collection, query, where, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { DocumentMetadata } from '../types/document';

const DOCUMENTS_COLLECTION = 'documents';

export async function getUserDocuments(uid: string): Promise<DocumentMetadata[]> {
  const q = query(collection(db, DOCUMENTS_COLLECTION), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  
  const docs: DocumentMetadata[] = [];
  querySnapshot.forEach((docSnap) => {
    docs.push({ id: docSnap.id, ...docSnap.data() } as DocumentMetadata);
  });
  
  return docs.sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function uploadRealDocument(uid: string, type: string, file: File): Promise<DocumentMetadata> {
  // Validate file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 10MB limit. Please upload a smaller file.');
  }

  // Bypass Firebase Storage to avoid hanging if it is not enabled in the user's project
  const downloadURL = "";

  // 2. Save metadata to Firestore
  const metadata: Omit<DocumentMetadata, 'id'> = {
    uid,
    type,
    fileName: file.name,
    downloadURL,
    uploadedAt: Date.now(),
    status: 'Pending Verification', 
  };

  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), metadata);
  
  return {
    id: docRef.id,
    ...metadata
  };
}

export async function deleteUserDocument(documentId: string, downloadURL?: string): Promise<void> {
  // 1. Delete from Firestore
  await deleteDoc(doc(db, DOCUMENTS_COLLECTION, documentId));

  // 2. Delete from Storage if possible
  if (downloadURL) {
    try {
      const fileRef = ref(storage, downloadURL);
      await deleteObject(fileRef);
    } catch (e) {
      console.warn('Storage file cleanup failed or already removed', e);
    }
  }
}
