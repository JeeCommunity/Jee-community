const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveStudy.tsx', 'utf8');

const target = `const q = query(collection(db, "study_sessions"), orderBy('lastUpdated', 'desc'), limit(50));`;
const replacement = `const q = query(collection(db, "study_sessions"), orderBy('lastUpdated', 'desc'), limit(100));`;
code = code.replace(target, replacement);

fs.writeFileSync('src/pages/LiveStudy.tsx', code);
