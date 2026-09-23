import React, { useState, useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { requestNotificationPermission } from '../lib/fcm';

export default function NotificationPromptModal() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and permission is 'default' (not yet asked/denied)
    let isIframe = false;
    try {
      isIframe = window.self !== window.top;
    } catch (e) {
      isIframe = true;
    }
    
    if (user && 'Notification' in window) {
      const dismissed = sessionStorage.getItem('notificationPromptDismissed');
      // If we're in an iframe and it's denied, it's likely blocked by the browser's iframe policy.
      // If permission is default, we show the prompt.
      if (!dismissed && (Notification.permission === 'default' || (isIframe && Notification.permission === 'denied'))) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  if (!isVisible) return null;

  const handleTurnOn = async () => {
    let isIframe = false;
    try {
      isIframe = window.self !== window.top;
    } catch (e) {
      isIframe = true;
    }
    
    if (isIframe) {
      alert("Push notifications cannot be enabled inside this preview window. Please click the 'Open in new tab' icon at the top right of the preview to enable them.");
      setIsVisible(false);
      return;
    }
    
    if (Notification.permission === 'denied') {
      alert("You have previously blocked notifications for this site. Please click the lock icon in your browser's address bar to allow them.");
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    if (user) {
      await requestNotificationPermission(user.uid);
    }
  };

  const handleNotNow = () => {
    setIsVisible(false);
    // Save to session storage so we don't bother them again in this specific session
    sessionStorage.setItem('notificationPromptDismissed', 'true');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={handleNotNow}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <button 
          onClick={handleNotNow}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <div className="relative">
              <BellRing className="w-10 h-10 text-blue-600 animate-bounce" />
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-3 tracking-tight">Stay Updated!</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
            Turn on notifications to catch <span className="font-semibold text-indigo-600">live study sessions</span> and <span className="font-semibold text-blue-600">instant doubt-solving</span> alerts. Never miss out!
          </p>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleTurnOn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Turn On Notifications
            </button>
            <button 
              onClick={handleNotNow}
              className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
