const fs = require('fs');
const statsModalContent = `import React from 'react';
import { X, Wrench } from 'lucide-react';

interface StatsModalProps {
  onClose: () => void;
}

export default function StatsModal({ onClose }: StatsModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Activity Stats</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-8 text-center flex flex-col items-center">
          <Wrench className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Under Maintenance</h3>
          <p className="text-slate-500 dark:text-slate-400">
            We are upgrading Activity Stats for better performance. Check back later!
          </p>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/StatsModal.tsx', statsModalContent);
