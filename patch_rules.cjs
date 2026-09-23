const fs = require('fs');

let file = 'firestore.rules';
let code = fs.readFileSync(file, 'utf8');

const newRule = `
    match /personal_notes/{noteId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
`;

if (!code.includes('match /personal_notes')) {
  // Replace the last two closing braces with the new rule + braces
  code = code.replace(/}\s*}\s*$/, newRule);
  fs.writeFileSync(file, code);
  console.log("Patched firestore.rules");
}
