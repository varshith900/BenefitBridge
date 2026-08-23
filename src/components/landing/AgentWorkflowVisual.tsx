import { motion } from "framer-motion";
import { Target, ListTodo, Wrench, Zap, Eye, BrainCircuit, ArrowRight } from "lucide-react";

const steps = [
  { id: "goal", label: "GOAL", icon: Target },
  { id: "plan", label: "PLAN", icon: ListTodo },
  { id: "tools", label: "TOOLS", icon: Wrench },
  { id: "action", label: "ACTION", icon: Zap },
  { id: "observe", label: "OBSERVE", icon: Eye },
  { id: "memory", label: "MEMORY", icon: BrainCircuit },
  { id: "next", label: "NEXT ACTION", icon: ArrowRight },
];

export const AgentWorkflowVisual = () => {
  return (
    <div className="w-full mt-8 p-6 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
      
      <div className="flex items-center justify-between relative z-10 w-full overflow-x-auto hide-scrollbar pb-4 gap-4">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10%" }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="flex flex-col items-center gap-3 relative"
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center relative z-10"
                whileInView={{
                  borderColor: ["#334155", "#10b981", "#334155"],
                  boxShadow: ["0 0 0px transparent", "0 0 15px rgba(16,185,129,0.3)", "0 0 0px transparent"],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2 + 0.5,
                  repeat: Infinity,
                  repeatDelay: steps.length * 0.2 + 1
                }}
              >
                <step.icon className="w-5 h-5 text-slate-300" />
              </motion.div>
              <span className="text-[10px] font-bold tracking-widest text-slate-400">{step.label}</span>
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div 
                className="w-8 sm:w-12 h-[2px] mx-2 bg-slate-800 relative"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
              >
                <motion.div
                  className="absolute inset-0 bg-emerald-500 origin-left"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: false }}
                  transition={{ delay: i * 0.2 + 0.3, duration: 0.4 }}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
