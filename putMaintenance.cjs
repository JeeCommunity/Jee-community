const fs = require('fs');

const generateMaintenancePage = (title, description, componentName) => `import React from 'react';
import { Wrench } from 'lucide-react';

export default function ${componentName}() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-20 h-20 bg-indigo-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <Wrench className="w-10 h-10 text-indigo-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">${title} is Under Maintenance</h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">
        ${description}
      </p>
    </div>
  );
}
`;

const generateMaintenanceComponent = (name) => `import React from 'react';
import { Wrench } from 'lucide-react';

export default function ${name}(props: any) {
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
`;

fs.writeFileSync('src/pages/NotesHub.tsx', generateMaintenancePage('Notes Hub', 'We are currently upgrading Notes Hub to improve performance and add new features. It will be back soon!', 'NotesHub'));
fs.writeFileSync('src/pages/RelaxHub.tsx', generateMaintenancePage('Relax Hub', 'We are optimizing Relax Hub to serve you better. We will be back online shortly!', 'RelaxHub'));
fs.writeFileSync('src/components/PrivateStudyGroups.tsx', generateMaintenanceComponent('PrivateStudyGroups'));
fs.writeFileSync('src/components/StudyGroups.tsx', generateMaintenanceComponent('StudyGroups'));

