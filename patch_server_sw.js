import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const route = `  app.get('/firebase-messaging-sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(process.cwd(), 'public', 'firebase-messaging-sw.js'));
  });
`;

code = code.replace("  // Vite middleware for development", route + "\n  // Vite middleware for development");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
