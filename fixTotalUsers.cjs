const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const target = `<h3 className="text-3xl font-black text-slate-900 dark:text-white">{users.length}</h3>`;
const replacement = `<h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalUsersCount || users.length}</h3>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
