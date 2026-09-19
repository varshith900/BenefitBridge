
import { Layout } from '../components/Layout';

export function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-4">
            Welcome to BenefitBridge. By accessing or using our platform, you agree to be bound by these Terms of Service.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-100">Service Description</h2>
          <p>
            BenefitBridge provides a discovery and tracking platform for government benefits and scholarships. While we strive for accuracy, the final eligibility and approval of any application is determined by the respective government authority. We are not a government entity.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-800 dark:text-slate-100">User Responsibilities</h2>
          <p>
            You agree to provide accurate and truthful information in your profile and applications. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </div>
      </div>
    </Layout>
  );
}
