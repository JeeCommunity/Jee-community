import React from 'react';
import { Info } from 'lucide-react';
import { PageWrapper } from './Legal';

export const About = () => (
  <PageWrapper title="About Us" icon={Info}>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Our Mission</h3>
    <p className="leading-relaxed">
      The JEE Community is dedicated to providing a collaborative and supportive platform for students preparing for engineering and board examinations. Our mission is to democratize access to high-quality peer-to-peer learning and resources.
    </p>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">What We Offer</h3>
    <ul className="list-disc pl-6 space-y-2 mt-4">
      <li><strong>Community Forums:</strong> Discuss concepts, share strategies, and get help with difficult problems.</li>
      <li><strong>Live Study Rooms:</strong> Study alongside peers in a focused, distraction-free environment.</li>
    </ul>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Our Vision</h3>
    <p className="leading-relaxed">
      We believe that no student should have to prepare for competitive exams alone. By connecting students across the country, we aim to build the largest and most supportive community of future engineers.
    </p>

    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Contact Us</h3>
    <p className="leading-relaxed">
      Have questions, suggestions, or feedback? Please reach out to our administration team via the Feedback option in the application menu.
    </p>
  </PageWrapper>
);
