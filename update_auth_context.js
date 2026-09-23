const fs = require('fs');
let content = fs.readFileSync('src/AuthContext.tsx', 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\n\s+const unsubscribe = onAuthStateChanged\(auth, async \(currentUser\) => \{/,
  `useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {`
);

fs.writeFileSync('src/AuthContext.tsx', content);
