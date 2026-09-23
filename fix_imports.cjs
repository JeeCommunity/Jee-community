const fs = require('fs');

let file = 'src/components/CreatePostModal.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(`import { collection, addDoc } from 'firebase/firestore';`, `import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';`);

fs.writeFileSync(file, code);
