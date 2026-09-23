const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveStudy.tsx', 'utf8');

const target = `const q = query(collection(db, "study_sessions"), orderBy('lastUpdated', 'desc'), limit(100));`;
const replacement = `const q = query(
      collection(db, "study_sessions"),
      or(
        where('isStudying', '==', true),
        where('dailyDate', '==', getLocalDate())
      )
    );`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/LiveStudy.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Target not found!");
}
