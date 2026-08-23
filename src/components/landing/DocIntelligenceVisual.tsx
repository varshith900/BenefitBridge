import { motion } from "framer-motion";
import { FileText, Scan, CheckCircle } from "lucide-react";

export const DocIntelligenceVisual = () => {
  return (
    <div className="w-full mt-6 h-48 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden flex items-center justify-center gap-8">
      
      {/* Document */}
      <motion.div 
        className="relative w-24 h-32 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-2">
          <FileText className="w-2 h-2 text-slate-400" />
        </div>
        <div className="p-3 space-y-2">
          <div className="w-3/4 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-5/6 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>

        {/* Scanning Line */}
        <motion.div 
          className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]"
          initial={{ top: "10%", opacity: 0 }}
          whileInView={{ top: ["10%", "90%", "10%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Processing Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <Scan className="w-8 h-8 text-emerald-500" />
      </motion.div>

      {/* Structured Fields / Profile */}
      <motion.div 
        className="w-32 space-y-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded shadow-sm border border-slate-200 dark:border-slate-700"
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 + i * 0.4 }}
          >
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
          </motion.div>
        ))}
      </motion.div>
      
    </div>
  );
};
