const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const target = `        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">`;

const replacement = `        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white">Registered Users</h3>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Total Users: {totalUsersCount.toLocaleString()}</span>
              </div>
            </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
