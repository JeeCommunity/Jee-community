import React, { useState, useEffect } from 'react';
import { StickyNote, X, ChevronRight, Lock, Save, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyNotesAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenMyNotesModal');
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenMyNotesModal', 'true');
  };

  const handleExplore = () => {
    handleClose();
    setTimeout(() => {
      navigate('/my-notes');
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300"
        style={{ animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>

        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-4 transform -rotate-6 transition-transform hover:rotate-0 duration-300">
              <StickyNote className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              New Feature
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Personal Notepad</h2>
            <p className="text-indigo-100 font-medium text-sm max-w-xs mx-auto">
              A private space to quickly jot down your thoughts, to-dos, and quick notes.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">100% Private</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Only you can see your personal notes. Safely stored in your profile.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Auto-Save</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Never lose a thought. Notes are saved automatically as you type.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-4">
            <Edit3 className="w-8 h-8 text-indigo-500 hidden sm:block shrink-0" />
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 m-0">
              Access your personal notepad anytime from the Mobile Menu or Profile Dropdown on Desktop!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Got it
            </button>
            <button 
              onClick={handleExplore}
              className="flex-[2] py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Open My Notes
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
