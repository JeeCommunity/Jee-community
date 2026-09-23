const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveStudy.tsx', 'utf8');

const target = `    // Listener for active students list (limit to 50 most recently updated)
    const q = query(
      collection(db, "study_sessions"),
      or(
        where('isStudying', '==', true),
        where('dailyDate', '==', getLocalDate())
      )
    );`;

const replacement = `    // Listener for active students list
    const q = query(
      collection(db, "study_sessions"),
      where('isStudying', '==', true)
    );`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/LiveStudy.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Target not found!");
}
