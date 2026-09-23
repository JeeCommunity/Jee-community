const fs = require('fs');

let file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('StickyNote')) {
  code = code.replace(
    `import { Trophy, MonitorPlay, FileText, Building2, MessageSquareQuote, Share2, Download } from 'lucide-react';`,
    `import { Trophy, MonitorPlay, FileText, Building2, MessageSquareQuote, Share2, Download, StickyNote } from 'lucide-react';`
  );
}

fs.writeFileSync(file, code);
console.log("Fixed Layout.tsx import");
