import React, { useState, useEffect } from 'react';
import { X, PlaySquare, Tv, Upload, Users, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const EDUTUBE_ANNOUNCEMENT_STORAGE_KEY = 'hasSeenUpdate_EduTubeCreatorHub_2026_v2';

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    if (location.pathname === '/edutube') return;

    const hasSeen = localStorage.getItem(EDUTUBE_ANNOUNCEMENT_STORAGE_KEY);
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 900);
      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  const handleClose = () => {
    localStorage.setItem(EDUTUBE_ANNOUNCEMENT_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleExploreEduTube = () => {
    localStorage.setItem(EDUTUBE_ANNOUNCEMENT_STORAGE_KEY, 'true');
    setIsOpen(false);
    setTimeout(() => {
      navigate('/edutube');
    }, 120);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/65 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white overflow-hidden shrink-0 border-b border-white/10">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/20 border border-red-500/40 text-red-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>New Feature Live</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
                  <PlaySquare className="w-6 h-6 text-white fill-current" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">
                    EduTube Creator Hub 🎬
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Apna Khud Ka YouTube-Style Channel Banao &amp; Videos Dekho!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Feature 1 */}
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create Your Own Channel (@handle)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Har student ab apna khud ka channel, custom logo, banner aur bio set kar sakta hai — bilkul YouTube ki tarah!
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upload Long Videos &amp; Shorts with #Hashtags
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Apne videos, tricks, vlogs ya 60-sec Shorts upload karein custom HD thumbnail aur searchable <span className="font-mono text-blue-600 dark:text-blue-400">#hashtags</span> ke saath.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Subscribe &amp; Follow Creators</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Official <strong>JEE Community (@jeecommunity)</strong> aur apne favourite creators ke channels ko Subscribe karein, Like aur Comment karein!
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleExploreEduTube}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>Open EduTube &amp; Create Channel</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
