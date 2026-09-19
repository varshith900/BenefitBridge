import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Bot, Mail, Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function Login() {
    

  
const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Human-readable errors
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by your browser. Please click the popup blocker icon in your address bar, select "Always allow popups", and try again.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="absolute inset-0 bg-mesh opacity-40 mix-blend-multiply pointer-events-none" />
      
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mx-auto w-full max-w-md lg:w-[450px]"
        >
          <div className="flex items-center gap-2 cursor-pointer mb-8 justify-center" onClick={() => navigate('/')}>
            <div className="bg-emerald-600 p-1.5 rounded-xl shadow-lg dark:shadow-none shadow-emerald-500/30">
              <Logo className="w-8 h-8" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">BenefitBridge</span>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading mb-2 text-center">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center">
              Don't have an account? <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors hover:underline underline-offset-4">Create one now</Link>
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mb-6 shadow-sm dark:shadow-none">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="email">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50/50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="password">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50/50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full flex justify-center py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 dark:shadow-none font-semibold text-base mt-2 transition-all hover:-translate-y-0.5"
                isLoading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                variant="outline" 
                className="w-full flex justify-center py-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md transition-all text-base font-semibold rounded-xl"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="hidden lg:flex relative w-0 flex-1 bg-slate-950 overflow-hidden items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 to-slate-950/95" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
         
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1, duration: 0.5 }}
           className="relative z-10 flex flex-col items-center justify-center p-12 text-center text-white"
         >
            <div className="relative mb-8 group cursor-default">
              <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
              <Bot className="w-24 h-24 text-emerald-400 relative z-10 drop-shadow-2xl" />
            </div>
            <h2 className="text-5xl font-black mb-6 max-w-lg leading-tight font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
              Your Autonomous Case Manager Awaits.
            </h2>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
              Discover, prepare, and track government benefits seamlessly with the power of agentic AI.
            </p>
         </motion.div>
      </div>
    </div>
  );
}


