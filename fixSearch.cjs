const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const target = `  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        or(
          where('username', '==', searchQuery.trim()),
          where('email', '==', searchQuery.trim())
        ),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(results);
    } catch (err) {
      console.error("Error searching users", err);
    }
    setIsSearching(false);
  };`;

const replacement = `  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const termLower = term.toLowerCase();
      // 1. Prefix search on username
      const q1 = query(collection(db, 'users'), where('username', '>=', termLower), where('username', '<=', termLower + '\\uf8ff'), limit(10));
      // 2. Exact match on email
      const q2 = query(collection(db, 'users'), where('email', '==', termLower), limit(5));
      // 3. Prefix search on fullName (case-sensitive as stored)
      const q3 = query(collection(db, 'users'), where('fullName', '>=', term), where('fullName', '<=', term + '\\uf8ff'), limit(10));
      // 4. Prefix search on fullName (capitalized first letter, common case)
      const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
      const q4 = query(collection(db, 'users'), where('fullName', '>=', termCapitalized), where('fullName', '<=', termCapitalized + '\\uf8ff'), limit(10));

      const [snap1, snap2, snap3, snap4] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);
      const resultsMap = new Map();
      
      snap1.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      snap2.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      snap3.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      snap4.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      
      setSearchResults(Array.from(resultsMap.values()));
    } catch (err) {
      console.error("Error searching users", err);
    }
    setIsSearching(false);
  };`;

code = code.replace(target, replacement);

const placeholderTarget = `placeholder="Search by exact username or email..."`;
const placeholderReplacement = `placeholder="Search by name, username, or email..."`;
code = code.replace(placeholderTarget, placeholderReplacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
