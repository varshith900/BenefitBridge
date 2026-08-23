export type DocumentType = string;

export interface DocumentMetadata {
  id: string;
  uid: string;
  type: DocumentType;
  fileName: string;
  downloadURL?: string;
  uploadedAt: number;
  status: 'Verified' | 'Pending Verification' | 'Self-Declared';
}
