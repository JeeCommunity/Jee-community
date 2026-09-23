const fs = require('fs');

let file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import PersonalNotes')) {
  code = code.replace(
    `import About from './pages/About';`,
    `import About from './pages/About';\nimport PersonalNotes from './pages/PersonalNotes';`
  );
}

if (!code.includes('<Route path="my-notes"')) {
  code = code.replace(
    `<Route path="notes" element={<NotesHub />} />`,
    `<Route path="notes" element={<NotesHub />} />\n            <Route path="my-notes" element={<PersonalNotes />} />`
  );
}

fs.writeFileSync(file, code);
console.log("Patched App.tsx");
