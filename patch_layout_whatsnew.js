import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  "import FeedbackModal from './FeedbackModal';",
  "import FeedbackModal from './FeedbackModal';\nimport WhatsNewModal from './WhatsNewModal';"
);

code = code.replace(
  "<FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen()} />", // check exact syntax
  ""
)

fs.writeFileSync('src/components/Layout.tsx', code);
console.log("Patched Layout imports");
