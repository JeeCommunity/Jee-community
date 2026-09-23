const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const handleSearchCode = `
  const handleSearchUsers = async (e: React.FormEvent) => {
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
  };
`;

const insertTarget = `  const handleDeleteFeedback = (feedbackId: string) => {`;
if (code.includes(insertTarget) && !code.includes("handleSearchUsers = async")) {
  code = code.replace(insertTarget, handleSearchCode + '\n' + insertTarget);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
} else {
  console.log("Could not find insertTarget or already inserted.");
}
