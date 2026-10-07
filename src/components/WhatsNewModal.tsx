import React, { useState, useEffect } from 'react';
import { X, Sparkles, Video, Palette, PartyPopper, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only show if user is logged in
    if (!user) return;
    
    // Check local storage to see if user has seen this specific update
    const updateKey = 'hasSeenUpdate_DigitalLibrary_2026';
    const hasSeen = localStorage.getItem(updateKey);
    
    if (!hasSeen) {
      // Small delay before showing to not overwhelm on initial load
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    localStorage.setItem('hasSeenUpdate_DigitalLibrary_2026', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Background patterns */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md mb-4 border border-white/30 shadow-sm">
                <PartyPopper className="w-6 h-6 text-yellow-300" />
              </div>
              <h2 className="text-2xl font-bold mb-1">New: Digital Library Meet 🎥</h2>
              <p className="text-blue-100 text-sm">Join live video study rooms, collaborate on the real-time whiteboard, and share your screen.</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Live Video Meet & Screen Share</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Join the study hall instantly with one click. Turn on your camera, mute/unmute mic, and share your screen with fellow aspirants.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Real-Time Collaborative Whiteboard</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Draw and solve JEE problems together! All strokes are synced in real time across everyone in the study room.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Pomodoro & Lo-Fi Focus Music</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Stay super productive with built-in 25-minute Pomodoro study timers and calming ambient focus beats.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
            <button 
              onClick={handleClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors active:scale-[0.98]"
            >
              Explore Digital Library 🚀
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
