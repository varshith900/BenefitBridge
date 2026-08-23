import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import {
  getApplication, transitionApplication,
  syncApplicationDocuments, recordExternalSubmission, recordSubmissionUnsure,
} from '../services/applicationService';
import { getUserDocuments } from '../services/documentService';
import { getTasksForApplication, updateTaskStatus } from '../services/taskService';
import type { Application, ApplicationStatus } from '../types/application';
import { STATUS_LABELS } from '../types/application';
import type { Task } from '../types/task';
import {
  Loader2, CheckCircle2, XCircle, AlertTriangle, FileText,
  ExternalLink, Clock, ShieldCheck,
  ArrowRight, Activity, Info, FileWarning, RefreshCw,
  HelpCircle, Check, X, Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// ─── Visual Status Pipeline ───────────────────────────────────────────────────

const STATUS_PIPELINE: ApplicationStatus[] = [
  'PREPARING',
  'READY_TO_APPLY',
  'APPLICATION_STARTED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'COMPLETED',
];

const STATUS_COLORS: Record<string, string> = {
  DISCOVERED: 'bg-slate-400',
  INTERESTED: 'bg-blue-500',
  PREPARING: 'bg-amber-500',
  READY_TO_APPLY: 'bg-emerald-500',
  APPLICATION_STARTED: 'bg-purple-500',
  AWAITING_EXTERNAL_SUBMISSION: 'bg-orange-500',
  SUBMITTED: 'bg-blue-600',
  UNDER_REVIEW: 'bg-indigo-600',
  ACTION_REQUIRED: 'bg-red-500',
  VERIFICATION_PENDING: 'bg-cyan-600',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-red-600',
  COMPLETED: 'bg-emerald-700',
  RENEWAL_DUE: 'bg-amber-600',
  RENEWAL_IN_PROGRESS: 'bg-blue-600',
  RENEWED: 'bg-emerald-700',
  EXPIRED: 'bg-slate-500',
};

export function ApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // External Submission Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [refNumberInput, setRefNumberInput] = useState('');
  const [subDateInput, setSubDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [notesInput, setNotesInput] = useState('');
  const [showUnsureGuide, setShowUnsureGuide] = useState(false);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    const [appData, taskList] = await Promise.all([
      getApplication(applicationId),
      getTasksForApplication(applicationId),
    ]);
    setApp(appData);
    setTasks(taskList);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const syncDocs = async () => {
    if (!app || !user) return;
    setSyncing(true);
    const docs = await getUserDocuments(user.uid);
    const updated = await syncApplicationDocuments(app.id, docs.map(d => d.type));
    setApp(updated);
    setSyncing(false);
  };

  const doTransition = async (
    nextStatus: ApplicationStatus,
    note: string,
    extra?: Partial<Application>,
  ) => {
    if (!app) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await transitionApplication(app.id, nextStatus, 'USER', note, extra);
      setApp(updated);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !user || !refNumberInput.trim()) return;
    setActionLoading(true);
    try {
      const updated = await recordExternalSubmission(app.id, user.uid, {
        referenceNumber: refNumberInput.trim(),
        submissionDate: subDateInput,
        notes: notesInput.trim() || undefined,
      });
      setApp(updated);
      setShowConfirmModal(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsureClick = async () => {
    if (!app || !user) return;
    setShowUnsureGuide(true);
    await recordSubmissionUnsure(app.id, user.uid);
    await load();
  };

  const handleCompleteTask = async (taskId: string) => {
    await updateTaskStatus(taskId, 'COMPLETED');
    await load();
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-24">
          <XCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-heading">Application Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">This application record does not exist or has been removed.</p>
          <Button onClick={() => navigate('/opportunities')}>Browse Opportunities</Button>
        </div>
      </Layout>
    );
  }

  const activeBlockers = (app.blockers || []).filter(b => !b.resolvedAt);
  const isAwaitingSubmissionConfirmation =
    app.currentStatus === 'APPLICATION_STARTED' || app.currentStatus === 'AWAITING_EXTERNAL_SUBMISSION';

  const pipelineIndex = STATUS_PIPELINE.indexOf(app.currentStatus);

  return (
    <Layout>
      <div className="w-full space-y-6 pb-20">
        {/* ── Top Header Card ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <button
            onClick={() => navigate('/applications')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 mb-4"
          >
            ← Back to Applications
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', STATUS_COLORS[app.currentStatus] ? 'text-white ' + STATUS_COLORS[app.currentStatus] : 'bg-slate-100 text-slate-800')}>
                  {STATUS_LABELS[app.currentStatus] || app.currentStatus}
                </span>

                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-medium">
                  {app.benefitCategory}
                </span>

                {app.healthStatus && (
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1',
                    app.healthStatus === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' :
                    app.healthStatus === 'ATTENTION_REQUIRED' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' :
                    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  )}>
                    <Activity className="w-3 h-3" /> Health: {app.healthStatus.replace('_', ' ')}
                  </span>
                )}

                {app.referenceNumber && (
                  <span className="text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full">
                    Ref #{app.referenceNumber}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-heading leading-tight">
                  {app.benefitTitle}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{app.benefitIssuer}</p>
              </div>

              {/* Next Action Box */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    Next Recommended Action
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {app.pendingAction || app.nextAction}
                  </p>
                  {app.healthReason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Reason: {app.healthReason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Readiness Dial */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-w-[160px] shrink-0 text-center">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-heading">
                {app.readinessScore}%
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Application Readiness
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${app.readinessScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── EXTERNAL APPLICATION CONFIRMATION (SECTION 6 & 7) ───────────────── */}
        {isAwaitingSubmissionConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 border border-slate-700 shadow-xl relative overflow-hidden"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Submission Tracking Gate
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading">Did you submit your application on the official portal?</h3>
                <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                  We cannot automatically assume external government portal submissions. Tell BenefitBridge so your AI agent can monitor progress, calculate verification milestones, and track deadlines.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Yes, I Submitted
                </button>
                <button
                  type="button"
                  onClick={() => window.open(app.applicationUrl, '_blank', 'noopener,noreferrer')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Reopen Official Portal
                </button>
                <button
                  type="button"
                  onClick={handleUnsureClick}
                  className="px-5 py-2.5 bg-transparent hover:bg-slate-800/60 border border-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" /> I'm Not Sure
                </button>
              </div>

              {showUnsureGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-slate-800/90 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-2"
                >
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400" /> How to check if your application was submitted:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Check your SMS and registered email for an Acknowledgement or Reference Number.</li>
                    <li>Log in to the official portal ({app.benefitIssuer}) and look at "My Applications" or "Submitted Forms".</li>
                    <li>Check your browser downloads for any downloaded PDF application acknowledgement receipt.</li>
                  </ul>
                  <p className="text-slate-400 text-[11px]">
                    Once you find your reference number, click "Yes, I Submitted" above to start active tracking.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Progress Pipeline ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Application Lifecycle Stage</h2>
          <div className="relative">
            <div className="absolute top-2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 z-0" />
            <div className="relative z-10 flex justify-between">
              {STATUS_PIPELINE.map((stage, idx) => {
                const isReached = pipelineIndex >= idx;
                const isCurrent = app.currentStatus === stage;
                return (
                  <div key={stage} className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
                        isReached ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900',
                        isCurrent ? 'ring-4 ring-emerald-100 dark:ring-emerald-950 scale-125' : ''
                      )}
                    >
                      {isReached && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold leading-tight hidden sm:block',
                      isReached ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                    )}>
                      {STATUS_LABELS[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 2-Column Grid: Details & Tasks ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Core Scheme Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Scheme & Verification Verification
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Eligibility Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {app.eligibilityStatus}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Deadline</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{app.deadline}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Verification Source</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {app.verificationSource || 'User Confirmed'}
                </span>
              </div>

              {app.isRenewable && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Renewal Cycle</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {app.renewalFrequency || 'Annual'} ({app.nextRenewalDate || 'Upcoming'})
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <a
                href={app.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Verified Official Portal
              </a>
            </div>
          </div>

          {/* Column 2: Associated Tasks & Action Items */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Pending Case Tasks ({tasks.filter(t => t.status === 'PENDING').length})
            </h3>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
                No pending tasks for this application.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {tasks.map(task => {
                  const isDone = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'p-3 rounded-2xl border text-xs flex items-center justify-between gap-3',
                        isDone
                          ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-semibold text-slate-900 dark:text-white truncate', isDone && 'line-through')}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      </div>
                      {!isDone && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Required Documents & Vault Sync ───────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Required Documents (
              {app.uploadedDocuments?.length || 0}/{app.requiredDocuments?.length || 0} Ready)
            </h3>
            <button
              onClick={syncDocs}
              disabled={syncing}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Sync with Document Vault
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {app.requiredDocuments.map(docType => {
              const have = (app.uploadedDocuments || []).includes(docType);
              return (
                <div
                  key={docType}
                  className={cn(
                    'p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2',
                    have
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {have ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <FileWarning className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="font-semibold truncate">{docType}</span>
                  </div>
                  {!have && (
                    <button
                      onClick={() => navigate('/vault')}
                      className="text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg hover:opacity-80 shrink-0"
                    >
                      Upload →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Active Blockers ──────────────────────────────────────────────── */}
        {activeBlockers.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-3xl p-6">
            <h3 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Active Action Items ({activeBlockers.length})
            </h3>
            <ul className="space-y-2 text-xs text-red-800 dark:text-red-300">
              {activeBlockers.map(b => (
                <li key={b.id} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{b.type.replace(/_/g, ' ')}: </span>
                    {b.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Chronological Case Timeline (Section 8) ──────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Chronological Case Timeline
          </h3>

          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
            {[...app.timeline].reverse().map((event, idx) => (
              <motion.div
                key={event.id || idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative flex items-start gap-3"
              >
                <div
                  className={cn(
                    'absolute left-[-17px] w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shrink-0',
                    STATUS_COLORS[event.status] || 'bg-emerald-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {STATUS_LABELS[event.status as ApplicationStatus] || event.status}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                        event.actor === 'AGENT'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : event.actor === 'USER'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      )}
                    >
                      {event.actor}
                    </span>
                    {event.source && (
                      <span className="text-[10px] text-slate-400">via {event.source}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{event.note}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(event.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── State Transition Controls ────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manual State Overrides & Actions</h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {app.currentStatus === 'SUBMITTED' && (
              <Button
                onClick={() => doTransition('UNDER_REVIEW', 'User reported portal shows application is under review.')}
                isLoading={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Mark as Under Review
              </Button>
            )}

            {app.currentStatus === 'UNDER_REVIEW' && (
              <>
                <Button
                  onClick={() => doTransition('APPROVED', 'User confirmed application approved by authorities.')}
                  isLoading={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Approved
                </Button>
                <Button
                  onClick={() => doTransition('REJECTED', 'User reported application was rejected.')}
                  isLoading={actionLoading}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Mark Rejected
                </Button>
              </>
            )}

            {app.currentStatus === 'APPROVED' && (
              <Button
                onClick={() => doTransition('COMPLETED', 'Benefit disbursement received. Application case closed.')}
                isLoading={actionLoading}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                <Award className="w-4 h-4 mr-2" /> Benefit Received — Mark Complete
              </Button>
            )}

            {app.currentStatus === 'REJECTED' && (
              <Button
                onClick={() => doTransition('PREPARING', 'Restarting application workflow after rejection.')}
                isLoading={actionLoading}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Restart Application
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── EXTERNAL SUBMISSION MODAL (SECTION 6) ──────────────────────────────── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 md:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                    Confirm Portal Submission
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record your official acknowledgement to activate tracking.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmSubmissionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Application / Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NSP-2026-981249 / MH-SCH-10294"
                    value={refNumberInput}
                    onChange={e => setRefNumberInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Found on your acknowledgement receipt or confirmation SMS/email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={subDateInput}
                    onChange={e => setSubDateInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Optional Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Submitted with bank passbook and Aadhaar acknowledgement..."
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    isLoading={actionLoading}
                    disabled={!refNumberInput.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Confirm Submission
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
