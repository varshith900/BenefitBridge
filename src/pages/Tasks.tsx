import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { getUserTasks, updateTaskStatus } from '../services/taskService';
import type { Task, TaskActionType } from '../types/task';
import { PRIORITY_COLORS } from '../types/task';
import {
  Loader2, CheckCircle2, XCircle, AlertTriangle,
  User, Clock, ChevronRight, RefreshCw, Bot,
  Upload, ClipboardCheck, ExternalLink, Activity,
  BellRing, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// ─── Icon map for action types ────────────────────────────────────────────────

const ACTION_ICONS: Record<TaskActionType, React.ReactNode> = {
  UPLOAD_DOCUMENT:     <Upload className="w-4 h-4" />,
  FILL_PROFILE:        <User className="w-4 h-4" />,
  REVIEW_APPLICATION:  <ClipboardCheck className="w-4 h-4" />,
  APPROVE_SUBMISSION:  <Shield className="w-4 h-4" />,
  CHECK_PORTAL_STATUS: <ExternalLink className="w-4 h-4" />,
  RESOLVE_BLOCKER:     <AlertTriangle className="w-4 h-4" />,
  VERIFY_DEADLINE:     <BellRing className="w-4 h-4" />,
  RENEWAL_REMINDER:    <BellRing className="w-4 h-4" />, PREPARE_RENEWAL:     <ClipboardCheck className="w-4 h-4" />, GENERIC:             <Activity className="w-4 h-4" />,
};

const ACTION_LABELS: Record<TaskActionType, string> = {
  UPLOAD_DOCUMENT:     'Upload Document',
  FILL_PROFILE:        'Complete Profile',
  REVIEW_APPLICATION:  'Review Application',
  APPROVE_SUBMISSION:  'Approve Submission',
  CHECK_PORTAL_STATUS: 'Check Portal',
  RESOLVE_BLOCKER:     'Resolve Blocker',
  VERIFY_DEADLINE:     'Deadline Alert',
  RENEWAL_REMINDER:    'Renewal Reminder', PREPARE_RENEWAL:     'Prepare Renewal', GENERIC:             'Action Required',
};

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  index,
  onComplete,
  onDismiss,
  onNavigate,
}: {
  task: Task;
  index: number;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (task: Task) => void;
}) {
    

  
const [completing, setCompleting] = useState(false);
  const isDone = task.status === 'COMPLETED' || task.status === 'CANCELLED';

  const daysUntilDue = task.dueDate
    ? Math.ceil((task.dueDate - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent  = daysUntilDue !== null && daysUntilDue <= 3;

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(task.id);
    setCompleting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDone ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all group',
        isDone ? 'border-slate-100 dark:border-slate-800/50' : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300',
        task.priority === 'URGENT' && !isDone ? 'border-red-200 bg-red-50/30' : '',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Priority dot */}
        <div className={cn(
          'w-2.5 h-2.5 rounded-full mt-2 shrink-0',
          task.priority === 'URGENT' ? 'bg-red-500' :
          task.priority === 'HIGH'     ? 'bg-amber-500' :
          task.priority === 'MEDIUM'   ? 'bg-blue-400' : 'bg-slate-300'
        )} />

        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded', PRIORITY_COLORS[task.priority])}>
              {task.priority}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {ACTION_ICONS[task.actionType]}
              {ACTION_LABELS[task.actionType]}
            </span>
            {task.createdBy === 'AGENT' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <Bot className="w-3 h-3" /> Agent</span>
            )}
            {isDone && (
              <span className={cn(
                'text-[10px] font-bold uppercase px-2 py-0.5 rounded',
                task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                {task.status}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={cn('font-semibold text-slate-900 dark:text-white leading-snug text-sm', isDone && 'line-through text-slate-400')}>
            {task.title}
          </h3>

          {/* Related benefit */}
          {task.relatedBenefitTitle && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Re:{task.relatedBenefitTitle}
            </p>
          )}

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{task.description}</p>

          {/* Due date */}
          {task.dueDate && (
            <p className={cn(
              'text-[11px] font-semibold mt-2 flex items-center gap-1',
              isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-400'
            )}>
              <Clock className="w-3 h-3" />
              {isOverdue
                ? `Overdue by ${Math.abs(daysUntilDue!)} day${Math.abs(daysUntilDue!) === 1 ? '' : 's'}`
                : daysUntilDue === 0 ? 'Due today'
                : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}
              {' '}({new Date(task.dueDate).toLocaleDateString('en-IN')})
            </p>
          )}
        </div>

        {/* Actions */}
        {!isDone && (
          <div className="flex flex-col gap-2 shrink-0">
            {/* Navigate to action */}
            {task.actionPayload?.redirectPath && (
              <button
                onClick={() => onNavigate(task)}
                className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-all shadow-sm dark:shadow-none"
                title="Go to action"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {/* Mark complete */}
            <button
              onClick={handleComplete}
              disabled={completing}
              className="p-2 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all"
              title="Mark complete"
            >
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            </button>
            {/* Dismiss */}
            <button
              onClick={() => onDismiss(task.id)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
              title="Dismiss"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Tasks() {
    

  
const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const all = await getUserTasks(user.uid);
    setTasks(all);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (taskId: string) => {
    await updateTaskStatus(taskId, 'COMPLETED');
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED', completedAt: Date.now() } : t));
  };

  const handleDismiss = async (taskId: string) => {
    await updateTaskStatus(taskId, 'CANCELLED');
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'CANCELLED' } : t));
  };

  const handleNavigate = (task: Task) => {
    const path = task.actionPayload?.redirectPath;
    if (path) navigate(path);
  };

  const pending   = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completed = tasks.filter(t => t.status === 'COMPLETED');
  const critical  = pending.filter(t => t.priority === 'URGENT');

  const displayed = filter === 'PENDING'   ? pending
                  : filter === 'COMPLETED' ? completed
                  : tasks;

  return (
    <Layout>
      <div className="w-full space-y-6 pb-16">

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-70 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">Tasks</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Actions generated by your AI agent based on real application state.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={load}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Refresh</button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-md dark:shadow-none"
              >
                <Bot className="w-4 h-4" /> Ask Agent</button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700">
              <span className="text-2xl font-black">{critical.length}</span> Critical</div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700">
              <span className="text-2xl font-black">{pending.length}</span> Pending</div>
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
              <span className="text-2xl font-black">{completed.length}</span> Completed</div>
          </div>
        </div>

        {/* Agent tip */}
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          <Bot className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <strong>Agent-Driven Tasks:</strong> Tasks are created automatically when the agent detects missing documents,
            incomplete profiles, blocked applications, or upcoming deadlines. Ask the agent{' '}
            <em>"What should I do next?"</em> or<em>"Scan my applications"</em> to trigger fresh task generation.</div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['PENDING', 'COMPLETED', 'ALL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all',
                filter === f
                  ? 'bg-slate-900 text-white border-slate-900 shadow'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              )}
            >
              {f} ({f === 'PENDING' ? pending.length : f === 'COMPLETED' ? completed.length : tasks.length})
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-16 text-center">
            <CheckCircle2 className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              {filter === 'PENDING' ? 'No pending tasks!' : 'No tasks here yet.'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              {filter === 'PENDING'
                ? 'Ask the agent "What should I do next?" to scan your applications and detect any actions needed.'
                : 'Tasks will appear here once the agent identifies actions you need to take.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {displayed.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onComplete={handleComplete}
                  onDismiss={handleDismiss}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}


