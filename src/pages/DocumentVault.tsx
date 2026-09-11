import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { getUserDocuments, uploadRealDocument, deleteUserDocument } from '../services/documentService';

import { INDIAN_DOCUMENT_TYPES } from '../data/documentTypes';
import type { DocumentMetadata } from '../types/document';
import { logActivity } from '../services/activityService';
import { Layout } from '../components/Layout';
import { Search, Upload, FileText, CheckCircle2, ShieldCheck, Trash2, AlertTriangle, FolderLock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function DocumentVault() {
    

  
const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Extraction review state


  const [autofillMessage, setAutofillMessage] = useState<string | null>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTypes = INDIAN_DOCUMENT_TYPES.filter(type => 
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    async function loadDocs() {
      if (user) {
        const docs = await getUserDocuments(user.uid);
        setDocuments(docs);
        setLoading(false);
      }
    }
    loadDocs();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedType || !file) return;

    setUploading(true);
    setAutofillMessage(null);
    setAutofillError(null);


    try {
      // 1. Upload and securely vault the document
      const newDoc = await uploadRealDocument(user.uid, selectedType, file);
      setDocuments([newDoc, ...documents]);
      
      await logActivity(user.uid, 'USER', `Uploaded document: ${selectedType}`, {
        target: selectedType,
      });

      setAutofillMessage('Document uploaded and securely vaulted.');
      
      setSelectedType('');
      setSearchQuery('');
      setFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }

    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };


  const handleDeleteDocument = async (docMetadata: DocumentMetadata) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to remove "${docMetadata.type}" from your Document Vault?`)) {
      return;
    }
    try {
      await deleteUserDocument(docMetadata.id, docMetadata.downloadURL);
      setDocuments(prev => prev.filter(d => d.id !== docMetadata.id));
      await logActivity(user.uid, 'USER', `Removed document: ${docMetadata.type}`);
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full space-y-8 pb-12 animate-pulse">
          {/* Skeleton Header */}
          <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-32 w-full"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Skeleton Left Column (Upload form) */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-96 w-full"></div>
            </div>
            
            {/* Skeleton Right Column (Vault) */}
            <div className="md:col-span-2 space-y-6">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-40 w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full space-y-8 pb-12">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Document Vault</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mb-4">
              Upload your documents once. We securely encrypt them and use Document Intelligence to extract missing profile information so you never have to type it twice.</p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
               <ShieldCheck className="w-4 h-4 text-emerald-600" /> End-to-end Encrypted</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: UPLOAD & REVIEW */}
          <div className="md:col-span-1 space-y-6">
            
            {/* UPLOAD FORM */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Add Document</h2>
              
              <form onSubmit={handleUpload} className="space-y-5">
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Document Type</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm dark:shadow-none"
                      placeholder="Search document type..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      required
                    />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 shadow-xl max-h-60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto">
                      {filteredTypes.length > 0 ? (
                        filteredTypes.map((type) => (
                          <div
                            key={type}
                            className={cn(
                              "cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm",
                              selectedType === type ? "bg-emerald-50 text-emerald-900 font-semibold" : "text-slate-700 dark:text-slate-200"
                            )}
                            onClick={() => {
                              setSelectedType(type);
                              setSearchQuery(type);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {type}
                          </div>
                        ))
                      ) : (
                        <div className="py-2 pl-3 text-sm text-slate-500 dark:text-slate-400">No types found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Select File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-emerald-400 transition-colors bg-slate-50 dark:bg-slate-950 group">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-8 w-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <div className="flex text-sm text-slate-600 dark:text-slate-300 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-900 rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.pdf" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{file ? file.name : "PNG, JPG, PDF up to 10MB"}</p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full shadow-md dark:shadow-none" isLoading={uploading} disabled={!selectedType || selectedType !== searchQuery || !file}>
                  Upload Document</Button>
                
                {autofillMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 text-emerald-900 rounded-xl text-sm flex items-start gap-3 border border-emerald-200 shadow-sm dark:shadow-none"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-none mt-0.5" />
                    <p className="font-medium leading-relaxed">{autofillMessage}</p>
                  </motion.div>
                )}

                {autofillError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-900 rounded-xl text-sm flex items-start gap-3 border border-red-200 shadow-sm dark:shadow-none"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
                    <p className="font-medium leading-relaxed">{autofillError}</p>
                  </motion.div>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: VAULT & REVIEW MODAL */}
          <div className="md:col-span-2 space-y-6">
            


            {/* VAULTED DOCUMENTS */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-slate-400" /> Your Vault</h2>
              
              {documents.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed p-12 text-center flex flex-col items-center">
                  <FolderLock className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4 mx-auto" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Your vault is empty</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">Upload your identity, education, or income documents to unlock more automated applications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc, i) => (
                    <motion.div 
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1 group-hover:scale-105 transition-transform shadow-sm">
                          <span className="relative flex h-2 w-2 mr-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Verified
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate" title={doc.type}>{doc.type}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 truncate">{doc.fileName || doc.type}</p>
                      
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-xs text-slate-400">
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-3">
                          {doc.downloadURL ? (
                            <a href={doc.downloadURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                              View File</a>
                          ) : (
                            <span>Encrypted</span>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


