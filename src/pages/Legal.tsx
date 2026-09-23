import React, { useEffect } from 'react';
import { Shield, Lock, FileText, Info } from 'lucide-react';

export const PageWrapper = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-12">
        <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
        </div>
        <div className="text-slate-700 dark:text-slate-300 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicy = () => (
  <PageWrapper title="Privacy Policy" icon={Lock}>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Information Collection and Monitoring</h3>
    <p className="leading-relaxed">
      We collect information you provide directly to us, including when you create an account, update your profile, use the interactive features of the Services, participate in communities, or otherwise communicate with us.
    </p>
    <div className="bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
      <h4 className="flex items-center text-blue-900 dark:text-blue-100 mt-0 mb-2">
        <Shield className="w-5 h-5 mr-2" /> Important Security Notice
      </h4>
      <p className="text-blue-800 dark:text-blue-200 mb-0">
        For the safety, security, and integrity of the JEE Community platform, <strong>all chats, messages, posts, study room interactions, and platform activities are monitored and can be viewed by platform administrators</strong>. By using this platform, you acknowledge and consent to this monitoring. This is essential to prevent abuse, harassment, and ensure a productive study environment.
      </p>
    </div>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. How We Use Information</h3>
    <p className="leading-relaxed">We use the information we collect to:</p>
    <ul className="list-disc pl-6 space-y-2 mt-4">
      <li>Provide, maintain, and improve our Services</li>
      <li>Monitor platform safety and prevent abusive behavior</li>
      <li>Personalize your experience and content</li>
      <li>Send you technical notices, updates, and support messages</li>
      <li>Respond to your comments, questions, and customer service requests</li>
    </ul>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Information Sharing</h3>
    <p className="leading-relaxed">
      We may share personal information in the following circumstances:
    </p>
    <ul className="list-disc pl-6 space-y-2 mt-4">
      <li>With other users (your profile name, posts, and public activity)</li>
      <li>To comply with the law or protect the rights and safety of the JEE Community and its users</li>
      <li>With vendors, consultants, and other service providers who need access to such information</li>
    </ul>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. Contact Us</h3>
    <p className="leading-relaxed">If you have any questions about this Privacy Policy, please use the Feedback option in the app menu to contact the administration.</p>
  </PageWrapper>
);

export const TermsOfService = () => (
  <PageWrapper title="Terms of Service" icon={FileText}>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h3>
    <p className="leading-relaxed">
      By accessing or using the JEE Community platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.
    </p>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Community Guidelines</h3>
    <p className="leading-relaxed">To maintain a positive study environment, you agree NOT to:</p>
    <ul className="list-disc pl-6 space-y-2 mt-4">
      <li>Post spam, promotional content, or irrelevant material</li>
      <li>Harass, abuse, or harm other members</li>
      <li>Share inappropriate, offensive, or illegal content</li>
      <li>Attempt to bypass security or moderation systems</li>
    </ul>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Content Monitoring</h3>
    <div className="bg-orange-50 dark:bg-slate-800 border-l-4 border-orange-500 p-4 my-6 rounded-r-lg">
      <p className="text-orange-900 dark:text-orange-100 m-0">
        The JEE Community administrators reserve the right to monitor, review, and remove any content—including private messages, group chats, and public posts—at any time and without notice to ensure compliance with our guidelines and for general security purposes.
      </p>
    </div>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. Account Termination</h3>
    <p className="leading-relaxed">
      We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
    </p>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">5. Changes to Terms</h3>
    <p className="leading-relaxed">
      We reserve the right to modify these terms at any time. We will always post the most current version on our site. By continuing to use the Services after changes become effective, you agree to be bound by the revised terms.
    </p>
  </PageWrapper>
);

export const Disclaimer = () => (
  <PageWrapper title="Disclaimer" icon={Info}>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">General Information</h3>
    <p className="leading-relaxed">
      The content and materials available on the JEE Community platform are for educational and informational purposes only. We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.
    </p>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">User-Generated Content</h3>
    <p className="leading-relaxed">
      The platform hosts content created by its users. The JEE Community does not endorse, support, represent or guarantee the completeness, truthfulness, accuracy, or reliability of any user-generated content or communications.
    </p>

    <div className="bg-red-50 dark:bg-slate-800 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
      <h4 className="flex items-center text-red-900 dark:text-red-100 mt-0 mb-2">
        <Shield className="w-5 h-5 mr-2" /> Privacy & Security Disclaimer
      </h4>
      <p className="text-red-800 dark:text-red-200 mb-0">
        Please be aware that <strong>no communication on this platform is completely private</strong>. For security, moderation, and safety purposes, administrators have the ability to view all activities, including posts, study room sessions, direct messages, and group chats. Please do not share sensitive personal information (such as passwords, financial details, or personal addresses) on this platform.
      </p>
    </div>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Exam Results & Preparation</h3>
    <p className="leading-relaxed">
      While our platform aims to assist students in their preparation for the Joint Entrance Examination (JEE) and Board exams, we do not guarantee any specific results, scores, or admissions to educational institutions. Success depends on the individual student's effort, preparation, and performance.
    </p>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Limitation of Liability</h3>
    <p className="leading-relaxed">
      In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website.
    </p>
  </PageWrapper>
);
