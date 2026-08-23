import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserActivities } from '../services/activityService';
import type { ActivityEvent } from '../types/activity';
import { Layout } from '../components/Layout';
import { Loader2, Activity, Bot, User, Cpu, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function AuditLog() {
    

  
const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        const data = await getUserActivities(user.uid, 50);
        setActivities(data);
        setLoading(false);
      }
    }
    load();
  }, [user]);

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
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg dark:shadow-none">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Audit Log</h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                A secure, transparent record of all actions taken by you and the autonomous agent on your behalf.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Action History</h2>

          {activities.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              No activity recorded yet.</div>
          ) : (
            <div className="relative pl-6 space-y-8">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />
              
              {activities.map((activity, i) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative flex items-start gap-5"
                >
                  <div className={cn(
                    "absolute -left-6 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm dark:shadow-none z-10",
                    activity.actor === 'AGENT' ? "bg-emerald-100 text-emerald-600" :
                    activity.actor === 'USER' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}>
                    {activity.actor === 'AGENT' ? <Bot className="w-4 h-4" /> :
                     activity.actor === 'USER' ? <User className="w-4 h-4" /> :
                     <Cpu className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{activity.action}</span>
                        {activity.status === 'FAILURE' && (
                          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Failed</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(activity.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {activity.target && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Target:</span> {activity.target}
                      </p>
                    )}
                    
                    {activity.result && activity.result !== 'Success' && activity.result !== 'Error' && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Result:</span> {activity.result}
                      </p>
                    )}
                    
                    <div className="mt-3 flex gap-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                        activity.actor === 'AGENT' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        activity.actor === 'USER' ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        "bg-slate-200 text-slate-600 dark:text-slate-300"
                      )}>
                        Actor:{activity.actor}
                      </span>
                      {activity.tool && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200 px-2 py-1 rounded-md">
                          Tool:{activity.tool}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


