import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 mb-6">
        <Compass className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-pulse" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
        Error 404
      </span>
      <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3 text-slate-900 dark:text-white">
        Page Not Found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8">
        The benefit scheme, application record, or workspace page you are trying to access does not exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
        <Button onClick={() => navigate('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
