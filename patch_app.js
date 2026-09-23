import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace(
  "import PersonalNotes from './pages/PersonalNotes';", 
  "import PersonalNotes from './pages/PersonalNotes';\nimport Whiteboard from './pages/Whiteboard';"
);

// Add route outside layout
const routesToReplace = `<Route path="/admin" element={<AdminDashboard />} />
              <Route path="/status-replies" element={<StatusReplies />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />`;

const newRoutes = `<Route path="/admin" element={<AdminDashboard />} />
              <Route path="/status-replies" element={<StatusReplies />} />
              <Route path="/whiteboard/:groupId" element={<Whiteboard />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />`;

code = code.replace(routesToReplace, newRoutes);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
