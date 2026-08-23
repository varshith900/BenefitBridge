import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { 
  ArrowRight, ShieldCheck, Search, Sparkles, 
  Target, FileText, CheckCircle2, Activity,
  Moon, Sun, Menu, X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from '../components/Logo';
import { Reveal } from '../components/ui/Reveal';
import { HeroVisual } from '../components/landing/HeroVisual';
import { DocIntelligenceVisual } from '../components/landing/DocIntelligenceVisual';
import { AgentWorkflowVisual } from '../components/landing/AgentWorkflowVisual';

export function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* HEADER */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-emerald-600 p-2 rounded-xl shadow-lg dark:shadow-none shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <Logo className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-heading tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">BenefitBridge</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
              <a href="#how-it-works" className="relative group text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                How it Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#workflow" className="relative group text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Workflow
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#security" className="relative group text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Security
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-300 hover:rotate-12"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-700"></div>
              <button onClick={() => navigate('/login')} className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Sign In
              </button>
              <Button onClick={() => navigate('/signup')} className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 border-none">
                Get Started
              </Button>
              
              <button 
                className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 dark:text-slate-200 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">How it Works</a>
                <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 dark:text-slate-200 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Workflow</a>
                <a href="#security" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 dark:text-slate-200 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Security</a>
                <hr className="border-slate-200 dark:border-slate-800 my-2" />
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-left text-base font-semibold text-slate-800 dark:text-slate-200 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                >
                  {theme === 'dark' ? <><Sun className="w-5 h-5 text-amber-500" /> Switch to Light Mode</> : <><Moon className="w-5 h-5 text-slate-500" /> Switch to Dark Mode</>}
                </button>
                <button onClick={() => navigate('/login')} className="text-left text-base font-semibold text-slate-800 dark:text-slate-200 p-2">Sign In</button>
                <Button onClick={() => navigate('/signup')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-3">Get Started</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main className="relative">
        {/* HERO SECTION */}
        <section className="relative pt-40 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
          <motion.div style={{ y, opacity }} className="absolute inset-0 bg-mesh opacity-40 dark:opacity-20 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">
              <Reveal delay={0.25} direction="up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-sm mb-8 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Comprehensive Benefits Discovery</span>
                </div>
              </Reveal>
              
              <Reveal delay={0.4} direction="up">
                <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight font-heading leading-tight text-slate-900 dark:text-white">
                  Claim your scholarships & <br className="hidden md:block" />
                  benefits with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-400">zero friction.</span>
                </h1>
              </Reveal>

              <Reveal delay={0.55} direction="up">
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                  The comprehensive platform for Indian students and citizens. Discover eligible government schemes, private scholarships, and subsidies effortlessly.
                </p>
              </Reveal>

              <Reveal delay={0.7} direction="up">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" onClick={() => navigate('/signup')} className="w-full sm:w-auto text-base px-8 py-6 rounded-full shadow-xl shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
                    Start Discovery Free<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 shadow-sm">
                    Sign In to Account
                  </Button>
                </div>
              </Reveal>
            </div>
            
            <Reveal delay={0.85} direction="up" duration={0.8}>
              <HeroVisual />
            </Reveal>
          </div>
        </section>

        {/* WORKFLOW SECTION (How it Works) */}
        <section id="how-it-works" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Reveal>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">How it Works</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  A seamless three-step process to secure the financial assistance you deserve.
                </p>
              </Reveal>
            </div>

            <div className="relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-300 to-emerald-100 dark:from-emerald-900/30 dark:via-emerald-700/50 dark:to-emerald-900/30"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {/* Step 1 */}
                <Reveal delay={0.1}>
                  <div className="text-center relative bg-white dark:bg-slate-900 p-8 rounded-3xl group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5 dark:hover:bg-slate-800/80 border border-transparent dark:hover:border-slate-700">
                    <div className="w-24 h-24 mx-auto bg-emerald-50 dark:bg-emerald-900/20 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center mb-6 shadow-md group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-all duration-500">
                      <Target className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 font-heading">1. Discover</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Build your profile and instantly match with thousands of scholarships, subsidies, and government schemes.</p>
                  </div>
                </Reveal>

                {/* Step 2 */}
                <Reveal delay={0.2}>
                  <div className="text-center relative bg-white dark:bg-slate-900 p-8 rounded-3xl group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5 dark:hover:bg-slate-800/80 border border-transparent dark:hover:border-slate-700">
                    <div className="w-24 h-24 mx-auto bg-emerald-50 dark:bg-emerald-900/20 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center mb-6 shadow-md group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-all duration-500">
                      <FileText className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 font-heading">2. Prepare</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Upload your documents to the secure vault. Our intelligence automatically extracts data and fills out forms.</p>
                  </div>
                </Reveal>

                {/* Step 3 */}
                <Reveal delay={0.3}>
                  <div className="text-center relative bg-white dark:bg-slate-900 p-8 rounded-3xl group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5 dark:hover:bg-slate-800/80 border border-transparent dark:hover:border-slate-700">
                    <div className="w-24 h-24 mx-auto bg-emerald-50 dark:bg-emerald-900/20 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center mb-6 shadow-md group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-all duration-500">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 font-heading">3. Track</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Manage all your applications from a single dashboard. Get notified about deadlines and missing requirements.</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION (Workflow) */}
        <section id="workflow" className="py-24 bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <Reveal>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Intelligent Platform Features</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                  Designed to eliminate bureaucracy and simplify your applications.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <Reveal delay={0.1} className="h-full">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-700/50 dark:hover:bg-slate-800/80 h-full group">
                  <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 dark:border-blue-800 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 transition-all duration-500">
                    <Search className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-heading">Smart Discovery Engine</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                    Our system continuously scans federal, state, and private databases. It mathematically ranks opportunities by deadline urgency and eligibility strength.</p>
                </div>
              </Reveal>

              {/* Feature 2 */}
              <Reveal delay={0.2} className="h-full">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700/50 dark:hover:bg-slate-800/80 h-full group">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 dark:border-emerald-800 group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/50 transition-all duration-500">
                    <Sparkles className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-heading">Document Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg mb-6">
                    Upload official documents (Aadhaar, income certificates, marksheets) to your secure vault. The platform intelligently extracts the exact data needed for your applications.</p>
                  <DocIntelligenceVisual />
                </div>
              </Reveal>

              {/* Feature 3 (Agentic Workflow injected here) */}
              <Reveal delay={0.3} className="md:col-span-2">
                <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-30" />
                  <div className="relative z-10">
                    <div className="bg-slate-800 border border-slate-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                      <Activity className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4 font-heading">Complete Case Management</h3>
                    <p className="text-slate-300 text-xl max-w-3xl leading-relaxed mb-8">
                      Treats every opportunity as a persistent case. Tracks statuses, missing documents, and blockers. Generates automated tasks so you never miss a follow-up action.</p>
                    
                    <AgentWorkflowVisual />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section id="security" className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Reveal>
                <motion.div 
                  className="inline-block"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ShieldCheck className="w-20 h-20 text-emerald-600 dark:text-emerald-500 mx-auto mb-6 drop-shadow-lg" />
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 font-heading tracking-tight">Enterprise-Grade Security</h2>
                <p className="text-xl text-slate-600 dark:text-slate-400">
                  Your personal data and official documents are highly sensitive. You own your data.
                </p>
              </Reveal>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              {[
                { title: "Architecture", desc: "Server-side execution", delay: 0.1 },
                { title: "Database", desc: "Strict Firestore Rules", delay: 0.2 },
                { title: "Storage", desc: "Isolated user buckets", delay: 0.3 },
                { title: "Compliance", desc: "Zero frontend secrets", delay: 0.4 },
              ].map((item, i) => (
                <Reveal key={i} delay={item.delay}>
                  <div className="bg-slate-50 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 dark:hover:bg-slate-800/80">
                    <p className="font-bold text-lg text-slate-900 dark:text-emerald-400 mb-2">{item.title}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-base">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Reveal>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 font-heading tracking-tight text-slate-900 dark:text-white">Ready to claim your benefits?</h2>
              <p className="text-slate-600 dark:text-slate-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                Stop guessing. Start executing. Let our intelligent platform guide you through every step today.
              </p>
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-12 py-8 text-xl shadow-xl shadow-emerald-600/20 border-transparent font-bold transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl">
                Create Free Account
              </Button>
            </Reveal>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 py-20 border-t border-slate-200 dark:border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-emerald-600/10 p-2 rounded-xl group-hover:bg-emerald-600/20 transition-colors">
                <Logo className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <span className="text-2xl font-bold font-heading">BenefitBridge</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              The comprehensive benefits platform for Indian students and citizens. Secure, intelligent, and proactive.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-widest text-sm text-slate-900 dark:text-slate-100">Platform</h4>
            <ul className="space-y-5 text-base">
              <li><a href="#how-it-works" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">Features</a></li>
              <li><a href="#security" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">Security</a></li>
              <li><a href="#workflow" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">How it Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-widest text-sm text-slate-900 dark:text-slate-100">Company</h4>
            <ul className="space-y-5 text-base">
              <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">About Us</a></li>
              <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">Contact Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-widest text-sm text-slate-900 dark:text-slate-100">Legal</h4>
            <ul className="space-y-5 text-base">
              <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1 inline-block">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            &copy;{new Date().getFullYear()} BenefitBridge. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
