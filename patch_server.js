const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes('import { assistantRouter }')) {
  serverCode = serverCode.replace('import express from "express";', 'import express from "express";\nimport { assistantRouter } from "./assistant-api";');
}

if (!serverCode.includes('app.use("/api/assistant", assistantRouter);')) {
  serverCode = serverCode.replace('app.use(express.json());', 'app.use(express.json());\n\n// API routes for AI Assistant\napp.use("/api/assistant", assistantRouter);');
}

fs.writeFileSync('server.ts', serverCode);
