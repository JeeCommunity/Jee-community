import fs from 'fs';
let code = fs.readFileSync('src/main.tsx', 'utf8');

code = code.replace(/if \('serviceWorker' in navigator\) \{[\s\S]*?\}\n/, '');

fs.writeFileSync('src/main.tsx', code);
console.log("Patched main.tsx");
