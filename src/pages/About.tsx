
import { Layout } from '../components/Layout';

export function About() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">About BenefitBridge</h1>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="text-lg">
            BenefitBridge is a comprehensive platform designed to connect Indian students and citizens with government benefit schemes, scholarships, and opportunities.
          </p>
          <p className="mt-4">
            Our mission is to simplify the complex process of finding, tracking, and applying for government benefits by providing an intelligent, secure, and proactive platform. We leverage AI to analyze your profile and automatically discover opportunities you are eligible for, saving you time and effort.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-100">Why We Built This</h2>
          <p>
            Millions of eligible citizens miss out on essential benefits due to lack of awareness, complex application processes, and missed deadlines. BenefitBridge solves this by acting as your personal case manager—tracking deadlines, managing documents, and providing step-by-step guidance.
          </p>
        </div>
      </div>
    </Layout>
  );
}
