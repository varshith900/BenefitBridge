import { motion } from "framer-motion";
import { User, Bot, Search, FileText, CheckCircle2, Navigation } from "lucide-react";

const nodes = [
  { id: 'user', icon: User, label: 'User Goal', color: 'bg-blue-500' },
  { id: 'agent', icon: Bot, label: 'AI Agent', color: 'bg-emerald-500' },
  { id: 'discover', icon: Search, label: 'Discover', color: 'bg-purple-500' },
  { id: 'docs', icon: FileText, label: 'Documents', color: 'bg-orange-500' },
  { id: 'apply', icon: Navigation, label: 'Apply', color: 'bg-indigo-500' },
  { id: 'track', icon: CheckCircle2, label: 'Track', color: 'bg-green-500' },
];

export const HeroVisual = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 p-1 rounded-3xl bg-gradient-to-b from-white/60 to-white/20 dark:from-slate-800/60 dark:to-slate-900/20 backdrop-blur-2xl shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-30 dark:opacity-10 mix-blend-overlay"></div>
      
      <div className="relative bg-white/60 dark:bg-slate-950/60 rounded-[22px] p-8 md:p-16 border border-white/50 dark:border-slate-800/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          {nodes.map((node, i) => (
            <div key={node.id} className="relative flex flex-col items-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 + i * 0.2, type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className={`w-16 h-16 rounded-2xl ${node.color} flex items-center justify-center shadow-lg relative z-20 cursor-pointer`}
              >
                <node.icon className="w-8 h-8 text-white" />
                <motion.div 
                  className="absolute inset-0 border-2 border-white rounded-2xl"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1.4] }}
                  transition={{ delay: 1.5 + i * 0.2, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.2 }}
                className="mt-4 font-semibold text-sm text-slate-700 dark:text-slate-300 tracking-wide"
              >
                {node.label}
              </motion.span>

              {/* Connector Line */}
              {i < nodes.length - 1 && (
                <div className="hidden md:block absolute top-8 left-16 w-[calc(100%+2rem)] h-[2px] z-0">
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-emerald-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1.2 + i * 0.2, duration: 0.5, ease: "easeInOut" }}
                  />
                  {/* Flowing particle */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.8)]"
                    initial={{ left: "0%", opacity: 0 }}
                    animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                    transition={{ 
                      delay: 1.5 + i * 0.2, 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatDelay: 2,
                      ease: "linear"
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
