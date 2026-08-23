import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShieldCheck, Activity, User, 
  LogOut, Menu, X, Bell, Moon, Sun, ChevronRight, ListTodo, FolderKanban
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from './Logo';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Opportunities', path: '/opportunities', icon: Activity },
    { name: 'Applications', path: '/applications', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Document Vault', path: '/vault', icon: ShieldCheck },
    { name: 'Audit Log', path: '/audit', icon: Activity },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="bg-mesh" />
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 fixed top-0 w-full shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm dark:shadow-none">
            <Logo className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 font-heading text-lg">BenefitBridge</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm pt-16"
          >
            <div className="bg-white dark:bg-slate-900 p-4 shadow-xl border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left w-full",
                      isActive 
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm dark:shadow-none border border-emerald-100 dark:border-emerald-800/50" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")} />
                    {item.name}
                  </button>
                );
              })}
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium text-left w-full"
              >
                {theme === 'dark' ? <><Sun className="w-5 h-5 text-amber-500" /> Switch to Light Mode</> : <><Moon className="w-5 h-5 text-slate-500" /> Switch to Dark Mode</>}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all font-medium text-left w-full"
              >
                <LogOut className="w-5 h-5" /> Sign Out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-40 shadow-sm dark:shadow-none flex-shrink-0">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg dark:shadow-none shadow-emerald-500/20">
            <Logo className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 font-heading">
            BenefitBridge</span>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Main Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center justify-between px-3 py-3 rounded-xl transition-all group text-left w-full",
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 shadow-sm dark:shadow-none border border-emerald-100/50 dark:border-emerald-800/50" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-700 font-bold shrink-0">
              {(userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {userProfile?.displayName || user?.displayName || (user?.email ? user.email.split('@')[0] : 'User')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="mb-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {theme === 'dark' ? <><Sun className="w-4 h-4" /> Light Mode</> : <><Moon className="w-4 h-4" /> Dark Mode</>}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative w-full pt-16 md:pt-0 max-h-screen overflow-y-auto">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-10 w-full max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}


