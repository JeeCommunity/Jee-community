const fs = require('fs');

let file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import PersonalNotes')) {
  code = code.replace(
    `import { About } from './pages/About';`,
    `import { About } from './pages/About';\nimport PersonalNotes from './pages/PersonalNotes';`
  );
}

fs.writeFileSync(file, code);
console.log("Fixed App.tsx import");
