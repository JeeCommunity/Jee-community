const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveStudy.tsx', 'utf8');

const target = `            {sessions.map(s => ({ ...s, ...(usersData[s.id] || { fullName: "Unknown User", userClass: "N/A", userState: "N/A", role: "student" }) })).sort((a, b) => {`;
const replacement = `            {sessions.map(s => ({ fullName: "Unknown User", role: "student", ...s, ...(usersData[s.id] || {}) })).sort((a, b) => {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/LiveStudy.tsx', code);
