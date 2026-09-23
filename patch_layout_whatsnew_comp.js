import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  "<FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />",
  "<WhatsNewModal />\n      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />"
);

fs.writeFileSync('src/components/Layout.tsx', code);
console.log("Patched Layout comp");
