const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regex1 = /import \{ (.*) \} from 'firebase\/firestore';/;
code = code.replace(regex1, (match, p1) => {
  if (!p1.includes('getCountFromServer')) {
     return `import { ${p1}, getCountFromServer, startAfter } from 'firebase/firestore';`;
  }
  return match;
});

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
