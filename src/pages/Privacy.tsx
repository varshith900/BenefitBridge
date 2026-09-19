
import { Layout } from '../components/Layout';

export function Privacy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-4">
            At BenefitBridge, we take your privacy seriously. We only collect the necessary information required to help you discover and apply for relevant government schemes and benefits.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-100">Data Security</h2>
          <p>
            Your personal information and uploaded documents are securely stored using enterprise-grade encryption. We do not sell your data to any third parties. Your data is used exclusively for matching you with relevant opportunities.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-100">Your Rights</h2>
          <p>
            You have the right to access, modify, or delete your personal data at any time through your Profile dashboard.
          </p>
        </div>
      </div>
    </Layout>
  );
}
