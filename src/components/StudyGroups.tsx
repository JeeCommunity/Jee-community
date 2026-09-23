import React from 'react';
import { Wrench } from 'lucide-react';

export default function StudyGroups(props: any) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
      <Wrench className="w-8 h-8 text-indigo-400 mb-3" />
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Under Maintenance</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        We are optimizing this feature to give you a better experience. It will be back shortly!
      </p>
    </div>
  );
}
