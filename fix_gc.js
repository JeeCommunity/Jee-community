import fs from 'fs';
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

code = code.replace(
  "if (msg.isDeleted && isMe) return null;\n                             const isMe = msg.userId === user?.uid;",
  "const isMe = msg.userId === user?.uid;\n                             if (msg.isDeleted && isMe) return null;"
);

// Also check CommentsModal just in case.
fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Fixed PrivateStudyGroups");
