import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AgentOrchestrator } from '../services/agent/orchestrator';
import { getAgentSession, createOrResetAgentSession, updateAgentSession, subscribeToAgentSession } from '../services/agentMemory';
import type { AgentSession, AgentAction } from '../types/agent';
import { Logo } from '../components/Logo';
import { AlertTriangle, Send, Loader2, CheckCircle2, ArrowRight, Activity, ListTodo, RotateCcw } from 'lucide-react';
import { getTopPriorityAction } from '../services/prioritizationEngine';
import type { RankedOpportunity } from '../services/prioritizationEngine';
import { getTopPriorityTask } from '../services/taskService';
import { getUserApplications } from '../services/applicationService';
import { getUserProfile } from '../services/userService';
import { getUserDocuments } from '../services/documentService';
import type { Application } from '../types/application';
import type { Task } from '../types/task';
import { PRIORITY_COLORS } from '../types/task';
import { Layout } from '../components/Layout';
import { cn } from '../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [topAction, setTopAction] = useState<RankedOpportunity | null>(null);
  const [topTask, setTopTask] = useState<Task | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Application[]>([]);
  const [stats, setStats] = useState({ profileDone: 0, docs: 0, apps: 0 });
  
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.history, session?.status]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initDashboard() {
      if (user) {
        // 1. Initialize Priority
        try {
          const priority = await getTopPriorityAction(user.uid);
          setTopAction(priority);
        } catch (e) {
          console.warn("Priority load note:", e);
        }

        // 2. Load top task
        try {
          const task = await getTopPriorityTask(user.uid);
          setTopTask(task);
        } catch (e) {
          console.warn("Top task load note:", e);
        }

        // 3. Load apps, renewals, stats
        try {
          const apps = await getUserApplications(user.uid);
          const renewals = apps.filter(a => a.isRenewable && ['UPCOMING', 'DUE_SOON', 'DUE', 'IN_PROGRESS', 'FUTURE'].includes(a.renewalStatus));
          setUpcomingRenewals(renewals);
          
          const profile = await getUserProfile(user.uid);
          const docsData = await getUserDocuments(user.uid);
          
          let filledFields = 0;
          if (profile?.state) filledFields++;
          if (profile?.annualIncome) filledFields++;
          if (profile?.educationLevel) filledFields++;
          if (profile?.category) filledFields++;
          if (profile?.gender) filledFields++;
          const profileDone = Math.round((filledFields / 5) * 100) || 0;
          
          setStats({ profileDone, docs: docsData.length || 0, apps: apps.length });
        } catch (e) {
          console.warn("Stats load note:", e);
        }

        // 4. Initialize Session & Real-time Subscription
        try {
          let currentSession = await getAgentSession(user.uid);
          if (!currentSession) {
            currentSession = await createOrResetAgentSession(user.uid);
          } else if (currentSession.status === 'PLANNING' || currentSession.status === 'EXECUTING') {
            // Unstick any previous stuck state on refresh
            await updateAgentSession(user.uid, { status: 'IDLE' });
            currentSession.status = 'IDLE';
          }
          
          setSession(currentSession);
          orchestratorRef.current = new AgentOrchestrator(user.uid, currentSession);

          // Subscribe for live updates
          unsubscribe = subscribeToAgentSession(user.uid, (updatedSession) => {
            setSession(updatedSession);
            if (orchestratorRef.current) {
              orchestratorRef.current.setSession(updatedSession);
            }
          });
        } catch (e) {
          console.warn("Session init note:", e);
        }

        setLoading(false);
      }
    }

    initDashboard();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleSend = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const query = customInput || input;
    if (!query.trim() || !orchestratorRef.current || sending || !user) return;

    setInput('');
    setSending(true);

    try {
      await orchestratorRef.current.run(query);
    } catch (error) {
      console.error("Dashboard send error:", error);
    } finally {
      setSending(false);
      const updated = await getAgentSession(user.uid);
      if (updated) setSession(updated);
    }
  };

  const handleResetSession = async () => {
    if (!user) return;
    try {
      const reset = await createOrResetAgentSession(user.uid);
      setSession(reset);
      if (orchestratorRef.current) {
        orchestratorRef.current.setSession(reset);
      }
    } catch (e) {
      console.error("Reset session error:", e);
    }
  };

  const renderAction = (action: AgentAction) => {
    switch (action.type) {
      case 'MESSAGE': {
        const isUserMsg = action.role === 'USER' || (action.role === undefined && (
          action.content.startsWith('Help me') || 
          action.content.toLowerCase().startsWith('what') || 
          action.content.toLowerCase().startsWith('do i') || 
          action.content.toLowerCase().startsWith('check') || 
          action.content.toLowerCase().startsWith('how')
        ));
        
        return (
          <div key={action.id} className={`flex gap-3 my-4 animate-fade-in-up ${isUserMsg ? 'justify-end' : ''}`}>
             <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm dark:shadow-none transition-transform hover:scale-[1.01] ${isUserMsg ? 'bg-emerald-600 text-white rounded-br-sm font-medium' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none'}`}>
                <ReactMarkdown>{action.content}</ReactMarkdown>
             </div>
          </div>
        );
      }
      case 'THOUGHT':
        return null; 
      case 'TOOL_CALL':
        return null;
      case 'ERROR':
        return (
           <div key={action.id} className="flex gap-2 items-start my-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl shadow-sm dark:shadow-none animate-fade-in-up">
             <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
             <p className="text-sm text-red-800 dark:text-red-400 font-medium">{action.content}</p>
           </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8 h-full max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: CRITICAL CONTEXT & ACTIONS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full lg:w-1/3 flex flex-col gap-6"
        >
          
          {/* Top Priority Action Card */}
          {topAction && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Top Recommended Benefit
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {topAction.result.confidenceLevel} Match
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 leading-snug">
                {topAction.benefit.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {topAction.benefit.issuer} · {topAction.benefit.benefitAmount}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Deadline: {topAction.benefit.deadline}</span>
                <Button size="sm" onClick={() => navigate('/opportunities')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  Review & Apply <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Top Pending Task Card */}
          {topTask && (
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">High-Priority Task</span>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", PRIORITY_COLORS[topTask.priority])}>
                  {topTask.priority}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{topTask.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{topTask.description}</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/tasks')} className="w-full text-xs hover:border-blue-500 hover:text-blue-600 transition-colors">
                Open Tasks Workspace
              </Button>
            </motion.div>
          )}

          {/* Upcoming Renewals */}
          {upcomingRenewals.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Upcoming Renewals
                </span>
                <span className="text-xs font-bold text-emerald-600">{upcomingRenewals.length} Active</span>
              </div>
              <div className="space-y-3">
                {upcomingRenewals.map(app => (
                  <div key={app.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-300 transition-all hover:-translate-y-0.5 hover:shadow-sm" onClick={() => navigate('/applications')}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-sm dark:shadow-none",
                        app.renewalStatus === 'UPCOMING' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800" :
                        app.renewalStatus === 'OPEN' ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800" :
                        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      )}>
                        {app.renewalStatus.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Due: {app.renewalDeadline || 'Upcoming'}</span>
                    </div>
                    {/* Visual Urgency Timeline Bar */}
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 mb-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: app.renewalStatus === 'OPEN' ? '100%' : app.renewalStatus === 'UPCOMING' ? '85%' : '30%' }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full", app.renewalStatus === 'OPEN' ? 'bg-red-500 animate-pulse' : app.renewalStatus === 'UPCOMING' ? 'bg-amber-500' : 'bg-emerald-500')} 
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{app.benefitTitle}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Stats Overview */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mt-auto group hover:shadow-lg transition-shadow">
             <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">At a Glance</span>
             </div>
             
             {/* Profile Completeness Ring */}
             <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => navigate('/profile')}>
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-200 dark:text-slate-800 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <motion.path 
                      className="text-emerald-500 stroke-current" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      fill="none" 
                      strokeDasharray={`${stats.profileDone}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${stats.profileDone}, 100` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{stats.profileDone}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Profile Completeness</div>
                  <div className="text-[10px] text-slate-500">Complete it to unlock more matches.</div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-300 transition-colors hover:-translate-y-0.5" onClick={() => navigate('/applications')}>
                   <div className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:scale-110 transition-transform">{stats.apps}</div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase">Tracked</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-300 transition-colors hover:-translate-y-0.5" onClick={() => navigate('/vault')}>
                   <div className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:scale-110 transition-transform">{stats.docs}</div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase">Documents</div>
                </div>
             </div>
          </motion.div>

        </motion.div>

        {/* RIGHT COLUMN: AGENT WORKSPACE */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
          
          {/* Agent Header */}
          <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-emerald-600 p-2 rounded-xl shadow-md dark:shadow-none">
                  <Logo className="w-6 h-6 text-white" />
                </div>
                {(session?.status === 'PLANNING' || session?.status === 'EXECUTING') && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white leading-tight">Agent Workspace</h2>
                <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  {session?.status === 'PLANNING' ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Planningâ€¦</>
                  ) : session?.status === 'EXECUTING' ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Executing toolsâ€¦</>
                  ) : (
                    <><CheckCircle2 className="w-3 h-3" /> Online &amp; Ready</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSession}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Chat
              </button>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50 relative min-h-[350px] max-h-[500px]">
            {(!session || session.history.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-4 py-8">
                <Logo className="w-14 h-14 text-slate-300 dark:text-slate-700" />
                <p className="text-center max-w-sm text-sm">
                  I'm your autonomous case manager. Tell me what you need, and I'll inspect your profile, check your documents, and find eligible benefits for you.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button onClick={() => handleSend(undefined, "What benefits am I eligible for?")} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm">
                    "What benefits am I eligible for?"
                  </button>
                  <button onClick={() => handleSend(undefined, "What are my uploaded documents as of now?")} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm">
                    "What are my uploaded documents as of now?"
                  </button>
                  <button onClick={() => handleSend(undefined, "What are my active tracked applications?")} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm">
                    "Check my applications"
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {session.history.map(renderAction)}
                {session?.status === 'EXECUTING' && (
                  <div className="flex gap-3 my-4 animate-fade-in-up">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm max-w-[85%]">
                      <div className="flex gap-1.5 items-center h-5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none">
            <form onSubmit={handleSend} className="flex gap-3 relative">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your case manager to check documents, find benefits..."
                  disabled={sending}
                  className="w-full pl-4 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white dark:placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner disabled:opacity-50 text-sm"
                />
              </div>
              <Button 
                type="submit" 
                disabled={sending || !input.trim()} 
                className="rounded-xl px-6 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md flex-shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-3 font-medium">
              BenefitBridge Agent autonomously inspects your real Document Vault and Firestore database.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
