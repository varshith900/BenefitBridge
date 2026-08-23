import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRankedBenefits } from '../services/prioritizationEngine';
import type { RankedOpportunity } from '../services/prioritizationEngine';
import {
  createApplication, getApplicationForBenefit, transitionApplication,
} from '../services/applicationService';
import {
  Loader2, ExternalLink, Calendar, CheckCircle2, AlertTriangle,
  Activity, BadgeIndianRupee, ShieldCheck,
  FileWarning, Info, RefreshCw, XCircle, FileText, ArrowRight, X,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

function StatusBadge({ status }: { status: RankedOpportunity['result']['status'] }) {
  const styles = {
    'Eligible': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800',
    'Potentially Eligible': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
    'Not Eligible': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  };
  const icons = {
    'Eligible': <CheckCircle2 className="w-3 h-3" />,
    'Potentially Eligible': <AlertTriangle className="w-3 h-3" />,
    'Not Eligible': <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border', styles[status])}>
      {icons[status]} {status}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: RankedOpportunity['result']['confidenceLevel'] }) {
  const styles = {
    HIGH: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/50',
    MEDIUM: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/50',
    LOW: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  };
  const labels = { HIGH: 'High Confidence', MEDIUM: 'Medium Confidence', LOW: 'Low Confidence' };
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded', styles[level])}>
      <ShieldCheck className="w-3 h-3" /> {labels[level]}
    </span>
  );
}

function ReadinessBadge({ readiness }: { readiness: RankedOpportunity['applicationReadiness'] }) {
  const map = {
    'Ready': { style: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
    'Needs Documents': { style: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800', icon: <FileWarning className="w-3 h-3" /> },
    'Needs Profile Info': { style: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800', icon: <Info className="w-3 h-3" /> },
    'Not Eligible': { style: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800', icon: <XCircle className="w-3 h-3" /> },
  };
  const { style, icon } = map[readiness];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border', style)}>
      {icon} {readiness}
    </span>
  );
}

function PriorityBar({ score, label }: { score: number; label: RankedOpportunity['priorityLabel'] }) {
  const max = 2000;
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = label === 'Urgent' ? 'bg-red-500' : label === 'High' ? 'bg-amber-500' : label === 'Medium' ? 'bg-blue-400' : 'bg-slate-300 dark:bg-slate-700';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="uppercase tracking-wider">{label} Priority</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Opportunities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<RankedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Eligible' | 'Potentially Eligible' | 'Not Eligible'>('All');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  
  // Application Preparation Modal state
  const [selectedOpp, setSelectedOpp] = useState<RankedOpportunity | null>(null);
  const [preparingAction, setPreparingAction] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const results = await getRankedBenefits(user.uid);
    setOpportunities(results);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = opportunities.filter(o => {
    const statusMatch = filter === 'All' || o.result.status === filter;
    const sectorMatch = sectorFilter === 'All' || o.benefit.category.includes(sectorFilter);
    return statusMatch && sectorMatch;
  });

  const eligibleCount = opportunities.filter(o => o.result.status === 'Eligible').length;
  const potentialCount = opportunities.filter(o => o.result.status === 'Potentially Eligible').length;

  const handleOpenApplyModal = (opp: RankedOpportunity) => {
    setSelectedOpp(opp);
  };

  const handlePrepareOnly = async () => {
    if (!user || !selectedOpp) return;
    setPreparingAction(true);
    try {
      let existing = await getApplicationForBenefit(user.uid, selectedOpp.benefit.id);
      if (!existing) {
        existing = await createApplication(user.uid, selectedOpp.benefit, selectedOpp.result, {
          autoStart: false,
          source: 'Opportunity Preparation',
        });
      }
      setSelectedOpp(null);
      navigate(`/applications/${existing.id}`);
    } catch (err) {
      console.error('Failed to prepare application:', err);
    } finally {
      setPreparingAction(false);
    }
  };

  const handleProceedToOfficialPortal = async () => {
    if (!user || !selectedOpp) return;
    setPreparingAction(true);
    try {
      let existing = await getApplicationForBenefit(user.uid, selectedOpp.benefit.id);
      if (!existing) {
        existing = await createApplication(user.uid, selectedOpp.benefit, selectedOpp.result, {
          autoStart: true,
          source: 'Direct Portal Application',
        });
      }

      // Mark state as APPLICATION_STARTED
      if (['INTERESTED', 'PREPARING', 'READY_TO_APPLY'].includes(existing.currentStatus)) {
        existing = await transitionApplication(
          existing.id,
          'APPLICATION_STARTED',
          'USER',
          'User opened the official government portal to begin external application.',
          {
            applicationStartedAt: Date.now(),
            verificationLevel: 1,
            verificationSource: 'Official Portal Redirect',
            agentNotes: 'User redirected to official portal. Awaiting submission confirmation.',
          },
          'External Apply Flow'
        );
      }

      // Open external portal in new tab
      window.open(selectedOpp.benefit.provenance.applicationUrl, '_blank', 'noopener,noreferrer');
      
      // Close modal and navigate to the application detail page where confirmation will be prompted
      setSelectedOpp(null);
      navigate(`/applications/${existing.id}`);
    } catch (err) {
      console.error('Failed to start application:', err);
    } finally {
      setPreparingAction(false);
    }
  };

  return (
    <Layout>
      <div className="w-full py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 font-heading">Discovery Engine</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Personalized scholarships, subsidies, and government schemes matching your profile.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-none transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? 'Analyzing...' : 'Re-run Analysis'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Matches', value: opportunities.length, icon: Activity, color: 'text-slate-600 dark:text-slate-300' },
            { label: 'Highly Eligible', value: eligibleCount, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Potential Matches', value: potentialCount, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Total Value', value: '+' + opportunities.filter(o=>o.result.status !== 'Not Eligible').reduce((acc, curr) => acc + (parseInt(curr.benefit.benefitAmount.replace(/\D/g, '')) || 0), 0).toLocaleString('en-IN'), icon: BadgeIndianRupee, color: 'text-blue-600 dark:text-blue-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                <stat.icon className="w-4 h-4" /> {stat.label}
              </div>
              <div className={cn("text-2xl font-bold font-heading", stat.color)}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
            {['All', 'Eligible', 'Potentially Eligible', 'Not Eligible'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filter === f
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto overflow-x-auto">
            {['All', 'Scholarship', 'Subsidy', 'Government', 'Private'].map(s => (
              <button
                key={s}
                onClick={() => setSectorFilter(s)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  sectorFilter === s
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading && opportunities.length === 0 && (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Analyzing profile against massive benefits dataset...</p>
            </div>
          )}

          {filtered.map((opp, index) => (
            <motion.div
              key={opp.benefit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-none border transition-all",
                opp.result.status === 'Not Eligible' ? 'border-slate-200 dark:border-slate-800 opacity-75' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/50'
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="md:w-[120px] shrink-0 space-y-3">
                  <div className="flex md:flex-col gap-3 md:gap-2 items-center md:items-start">
                    <div className="text-4xl font-black text-slate-200 dark:text-slate-800 leading-none font-heading">#{opp.rank}</div>
                    <div className="flex-1 md:w-full">
                      <PriorityBar score={opp.priorityScore} label={opp.priorityLabel} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {opp.rank === 1 && opp.result.status !== 'Not Eligible' && (
                      <span className="bg-red-600 dark:bg-red-500/20 text-white dark:text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm dark:shadow-none">
                        🔥 Top Priority</span>
                    )}
                    <StatusBadge status={opp.result.status} />
                    <ConfidenceBadge level={opp.result.confidenceLevel} />
                    <ReadinessBadge readiness={opp.applicationReadiness} />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                      {opp.benefit.category}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug font-heading">{opp.benefit.title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opp.benefit.issuer}</p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{opp.benefit.description}</p>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50 font-medium">
                      <BadgeIndianRupee className="w-4 h-4" />
                      {opp.benefit.benefitAmount}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      {opp.benefit.deadline}
                    </div>
                  </div>

                  {opp.prioritySummary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">💡 {opp.prioritySummary}</p>
                  )}

                  {(opp.result.satisfiedCriteria.length > 0 || opp.result.missingCriteria.length > 0 || opp.result.unmetCriteria.length > 0) && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800/50 pt-3">
                      {opp.result.satisfiedCriteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c}
                        </div>
                      ))}
                      {opp.result.missingCriteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c}
                        </div>
                      ))}
                      {opp.result.unmetCriteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c}
                        </div>
                      ))}
                    </div>
                  )}

                  {opp.result.missingDocuments.length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <FileWarning className="w-3.5 h-3.5" /> Documents needed to apply:
                      </p>
                      <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
                        {opp.result.missingDocuments.map((doc, i) => (
                          <li key={i}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {opp.result.status !== 'Not Eligible' && (
                  <div className="md:w-[130px] shrink-0 flex flex-col gap-2 md:border-l md:border-slate-100 dark:md:border-slate-800 md:pl-5 pt-4 md:pt-0 border-t md:border-t-0">
                    <button
                      onClick={() => handleOpenApplyModal(opp)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-all shadow-md dark:shadow-none"
                    >
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Activity className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 font-heading">No results found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Try checking a different category or updating your profile.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── APPLICATION PREPARATION MODAL (SECTION 5) ─────────────────────────── */}
      <AnimatePresence>
        {selectedOpp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/60 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                    Application Workspace Prep
                  </span>
                  <span className="text-[10px] font-medium text-slate-300">
                    {selectedOpp.benefit.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-heading leading-tight">{selectedOpp.benefit.title}</h2>
                <p className="text-xs text-slate-300 mt-1">{selectedOpp.benefit.issuer}</p>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                {/* Readiness summary */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Readiness</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedOpp.priorityScore ? Math.min(100, Math.round((selectedOpp.priorityScore / 2000) * 100)) : 80}%
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={selectedOpp.result.status} />
                    <div className="text-[11px] text-slate-400 mt-1">Deadline: {selectedOpp.benefit.deadline}</div>
                  </div>
                </div>

                {/* Documents Checklist */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Document Intelligence Check
                  </h3>
                  <div className="space-y-2">
                    {selectedOpp.benefit.requiredDocuments.map((doc, idx) => {
                      const isMissing = selectedOpp.result.missingDocuments.includes(doc);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl text-xs font-medium border",
                            isMissing
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300"
                              : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isMissing ? (
                              <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            <span>{doc}</span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                            isMissing ? "bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200" : "bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                          )}>
                            {isMissing ? "Missing in Vault" : "Ready in Vault"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* What BenefitBridge will do */}
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> BenefitBridge Agent Workflow
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Clicking <strong>Open Official Application</strong> will create a live application tracking record in your workspace, preserve your progress, and take you to the verified government portal. When you finish, BenefitBridge will record your reference number and manage monitoring.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handlePrepareOnly}
                  disabled={preparingAction}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Prepare Application & Tasks
                </button>
                <button
                  type="button"
                  onClick={handleProceedToOfficialPortal}
                  disabled={preparingAction}
                  className="flex-1 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {preparingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Open Official Application <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
