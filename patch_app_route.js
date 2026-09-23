import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "<Route path=\"my-notes\" element={<PersonalNotes />} />",
  "<Route path=\"my-notes\" element={<PersonalNotes />} />\n            <Route path=\"whiteboard/:groupId\" element={<Whiteboard />} />"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx routes");
