import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Login } from '../../pages/Login';
import { SignUp } from '../../pages/SignUp';
import { Onboarding } from '../../pages/Onboarding';
import { Dashboard } from '../../pages/Dashboard';
import { Profile } from '../../pages/Profile';
import { Opportunities } from '../../pages/Opportunities';
import { DocumentVault } from '../../pages/DocumentVault';
import { Landing } from '../../pages/Landing';
import { Tasks } from '../../pages/Tasks';
import { Applications } from '../../pages/Applications';
import { ApplicationDetail } from '../../pages/ApplicationDetail';
import { AuditLog } from '../../pages/AuditLog';
import { NotFound } from '../../pages/NotFound';
import { About } from '../../pages/About';
import { Privacy } from '../../pages/Privacy';
import { Terms } from '../../pages/Terms';
import { ProtectedRoute } from '../ProtectedRoute';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        
        {/* Public Routes */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />

        {/* Semi-Protected Route (Requires Auth, but onboarding is handled inside) */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute requireOnboarding={false}>
              <PageTransition><Onboarding /></PageTransition>
            </ProtectedRoute>
          } 
        />

        {/* Fully Protected Routes (Requires Auth + Onboarding) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <PageTransition><Profile /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/opportunities" 
          element={
            <ProtectedRoute>
              <PageTransition><Opportunities /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vault" 
          element={
            <ProtectedRoute>
              <PageTransition><DocumentVault /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <PageTransition><Tasks /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit" 
          element={
            <ProtectedRoute>
              <PageTransition><AuditLog /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications" 
          element={
            <ProtectedRoute>
              <PageTransition><Applications /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications/:applicationId" 
          element={
            <ProtectedRoute>
              <PageTransition><ApplicationDetail /></PageTransition>
            </ProtectedRoute>
          } 
        />

        {/* 404 Catch-All Route */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
