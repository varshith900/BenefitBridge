import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { getUserApplications } from '../services/applicationService';
import type { Application, ApplicationStatus } from '../types/application';
import { STATUS_LABELS } from '../types/application';
import {
  Loader2, FileText, PlusCircle,
  AlertTriangle, Clock, CheckCircle2,
  RefreshCw, ArrowRight, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const STATUS_BADGE_COLORS: Record<ApplicationStatus, string> = {
  DISCOVERED: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  INTERESTED: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  PREPARING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  READY_TO_APPLY: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  APPLICATION_STARTED: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  AWAITING_EXTERNAL_SUBMISSION: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  SUBMITTED: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  UNDER_REVIEW: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  ACTION_REQUIRED: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  VERIFICATION_PENDING: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  APPROVED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  REJECTED: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
  EXPIRED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
  RENEWAL_DUE: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  RENEWAL_IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  RENEWED: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
};

type TabFilter = 'All' | 'Active' | 'Pending Action' | 'Under Review' | 'Approved' | 'Completed' | 'Rejected' | 'Renewal Due';

export function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const apps = await getUserApplications(user.uid);
    setApplications(apps);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filtered = applications.filter(app => {
    // Search
    const matchesSearch =
      app.benefitTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.benefitIssuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.referenceNumber && app.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab Filter
    switch (activeTab) {
      case 'Active':
        return !['COMPLETED', 'REJECTED', 'EXPIRED'].includes(app.currentStatus);
      case 'Pending Action':
        return ['ACTION_REQUIRED', 'PREPARING', 'READY_TO_APPLY', 'AWAITING_EXTERNAL_SUBMISSION'].includes(app.currentStatus) ||
          (app.blockers && app.blockers.some(b => !b.resolvedAt));
      case 'Under Review':
        return ['SUBMITTED', 'UNDER_REVIEW', 'VERIFICATION_PENDING'].includes(app.currentStatus);
      case 'Approved':
        return app.currentStatus === 'APPROVED';
      case 'Completed':
        return app.currentStatus === 'COMPLETED' || app.currentStatus === 'RENEWED';
      case 'Rejected':
        return app.currentStatus === 'REJECTED';
      case 'Renewal Due':
        return app.isRenewable && (app.renewalStatus === 'OPEN' || app.renewalStatus === 'UPCOMING' || app.currentStatus === 'RENEWAL_DUE');
      case 'All':
      default:
        return true;
    }
  });

  const activeCount = applications.filter(a => !['COMPLETED', 'REJECTED', 'EXPIRED'].includes(a.currentStatus)).length;
  const underReviewCount = applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW', 'VERIFICATION_PENDING'].includes(a.currentStatus)).length;
  const completedCount = applications.filter(a => ['COMPLETED', 'RENEWED'].includes(a.currentStatus)).length;
  const renewalDueCount = applications.filter(a => a.isRenewable && (a.renewalStatus === 'OPEN' || a.currentStatus === 'RENEWAL_DUE')).length;

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full space-y-6 pb-16">
        {/* Header banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  Lifecycle Command Center
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-heading">
                Benefit Applications
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Track, monitor, verify, and renew every government subsidy & scholarship you pursue.
              </p>
            </div>
            <button
              onClick={() => navigate('/opportunities')}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Discover New Benefits
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 relative z-10">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active In-Flight</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeCount}</div>
            </div>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">Under Review</div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{underReviewCount}</div>
            </div>
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Completed & Benefited</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{completedCount}</div>
            </div>
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">Renewals Due</div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{renewalDueCount}</div>
            </div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by scheme, issuer, ref..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Tracking
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto gap-1">
            {(['All', 'Active', 'Pending Action', 'Under Review', 'Approved', 'Completed', 'Rejected', 'Renewal Due'] as TabFilter[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0',
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-heading">
              {applications.length === 0 ? 'No applications created yet' : 'No matching applications'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm mx-auto">
              {applications.length === 0
                ? 'Browse the Discovery Engine to find benefit schemes matching your profile and start an application.'
                : 'Try adjusting your search terms or filter tabs to find your applications.'}
            </p>
            {applications.length === 0 && (
              <button
                onClick={() => navigate('/opportunities')}
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-md text-sm"
              >
                Browse Matched Opportunities
              </button>
            )}
          </div>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {filtered.map((app, idx) => (
            <ApplicationCard
              key={app.id}
              app={app}
              index={idx}
              onClick={() => navigate(`/applications/${app.id}`)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}

// ─── Application Card (Section 9 Specification) ──────────────────────────────

function ApplicationCard({
  app,
  index,
  onClick,
}: {
  app: Application;
  index: number;
  onClick: () => void;
}) {
  const activeBlockers = (app.blockers || []).filter(b => !b.resolvedAt);
  const statusBadgeColor = STATUS_BADGE_COLORS[app.currentStatus] || 'bg-slate-100 text-slate-800';

  const isUrgent = app.deadlineCategory === 'URGENT' || app.healthStatus === 'URGENT';
  const isBlocked = activeBlockers.length > 0 || app.healthStatus === 'BLOCKED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-3xl border p-6 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden',
        isBlocked
          ? 'border-red-200 dark:border-red-900/50 hover:border-red-300'
          : isUrgent
          ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
          : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/50'
      )}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Left Side: Header & Core Info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Top badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', statusBadgeColor)}>
              {STATUS_LABELS[app.currentStatus] || app.currentStatus}
            </span>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
              {app.benefitCategory}
            </span>

            {app.referenceNumber && (
              <span className="text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
                Ref: {app.referenceNumber}
              </span>
            )}

            {isBlocked && (
              <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {activeBlockers.length} Action Needed
              </span>
            )}

            {app.isRenewable && (
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 px-2.5 py-1 rounded-full">
                🔄 Renewable
              </span>
            )}
          </div>

          {/* Title & Issuer */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {app.benefitTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.benefitIssuer}</p>
          </div>

          {/* Next Action Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next Recommended Action</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{app.nextAction}</span>
            </div>
          </div>

          {/* Progress bar for documents */}
          {app.requiredDocuments && app.requiredDocuments.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${Math.round(((app.uploadedDocuments?.length || 0) / app.requiredDocuments.length) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-slate-400 font-medium shrink-0">
                {app.uploadedDocuments?.length || 0}/{app.requiredDocuments.length} docs ready
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Readiness & Deadlines */}
        <div className="md:w-56 shrink-0 flex flex-col justify-between items-start md:items-end md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
          <div className="space-y-1 w-full">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Readiness Score</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-heading">
              {app.readinessScore}%
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400 w-full">
            <div className="flex md:justify-end items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Deadline: <strong className="text-slate-700 dark:text-slate-200">{app.deadline}</strong></span>
            </div>
            {app.applicationSubmittedAt && (
              <div className="flex md:justify-end items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Submitted: {new Date(app.applicationSubmittedAt).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            {app.isRenewable && app.nextRenewalDate && (
              <div className="flex md:justify-end items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400">
                <span>Renewal window: {app.nextRenewalDate}</span>
              </div>
            )}
          </div>

          <div className="mt-5 w-full flex md:justify-end">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              View Workspace <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
