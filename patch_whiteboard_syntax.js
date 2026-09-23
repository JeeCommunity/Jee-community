import fs from 'fs';
let code = fs.readFileSync('src/pages/Whiteboard.tsx', 'utf8');

code = code.replace(/\\\$/g, '$');
code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/pages/Whiteboard.tsx', code);
console.log("Patched syntax in Whiteboard.tsx");
