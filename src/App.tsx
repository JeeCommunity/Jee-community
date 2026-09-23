import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import StatusReplies from './pages/StatusReplies';
import LiveStudy from './pages/LiveStudy';
import Campus from './pages/Campus';
import Calculator from './pages/Calculator';
import NotesHub from './pages/NotesHub';
import { isFirebaseConfigured } from './firebase';

import { PrivacyPolicy, TermsOfService, Disclaimer } from './pages/Legal';
import { About } from './pages/About';
import PersonalNotes from './pages/PersonalNotes';
import Whiteboard from './pages/Whiteboard';

export default function App() {
  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Setup Required</h1>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            Firebase is not configured. To get started, please click the <strong>Settings</strong> gear icon in the bottom-left corner of AI Studio, open the <strong>Environment Variables</strong> tab, and paste your Firebase configuration values.
          </p>
          <div className="bg-neutral-950 rounded-lg p-4 text-left text-sm font-mono text-neutral-300 border border-neutral-800">
            <div>VITE_FIREBASE_API_KEY</div>
            <div>VITE_FIREBASE_AUTH_DOMAIN</div>
            <div>VITE_FIREBASE_PROJECT_ID</div>
            <div>...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Auth isLogin={true} />} />
            <Route path="signup" element={<Auth isLogin={false} />} />
            <Route path="setup-profile" element={<ProfileSetup />} />
            <Route path="community" element={<Community />} />
            <Route path="study-room" element={<LiveStudy />} />
            <Route path="campus" element={<Campus />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="notes" element={<NotesHub />} />
            <Route path="my-notes" element={<PersonalNotes />} />
            <Route path="whiteboard/:groupId" element={<Whiteboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="status-replies" element={<StatusReplies />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfService />} />
            <Route path="disclaimer" element={<Disclaimer />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
