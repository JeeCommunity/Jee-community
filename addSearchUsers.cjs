const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. imports
const importTarget = `import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter } from 'firebase/firestore';`;
const importReplacement = `import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter, or } from 'firebase/firestore';`;
code = code.replace(importTarget, importReplacement);

// 2. States
const statesTarget = `const [usersLoadingMore, setUsersLoadingMore] = useState<boolean>(false);`;
const statesReplacement = `const [usersLoadingMore, setUsersLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);`;
code = code.replace(statesTarget, statesReplacement);

// 3. handleSearch logic
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

const insertAfterTarget = `const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };`;

code = code.replace(insertAfterTarget, insertAfterTarget + handleSearchCode);

// 4. UI
const searchUITarget = `            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white">Registered Users</h3>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Total Users: {totalUsersCount.toLocaleString()}</span>
              </div>
            </div>`;

const searchUIReplacement = `            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:justify-between items-start md:items-center bg-white dark:bg-slate-900 gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white">Registered Users</h3>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center space-x-2 w-fit">
                  <Users className="w-4 h-4" />
                  <span>Total Users: {totalUsersCount.toLocaleString()}</span>
                </div>
              </div>
              <form onSubmit={handleSearchUsers} className="w-full md:w-72 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search by exact username or email..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) setSearchResults([]);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" disabled={isSearching} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  {isSearching ? '...' : 'Search'}
                </button>
              </form>
            </div>`;

code = code.replace(searchUITarget, searchUIReplacement);

// 5. Render users logic
const renderUsersTarget = `              <tbody className="divide-y divide-slate-100">
                {users.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400">No users found.</td></tr>
                )}
                {users.map(u => (`;

const renderUsersReplacement = `              <tbody className="divide-y divide-slate-100">
                {(searchQuery ? searchResults : users).length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400">No users found.</td></tr>
                )}
                {(searchQuery ? searchResults : users).map(u => (`;

code = code.replace(renderUsersTarget, renderUsersReplacement);

// 6. Hide Load More if searching
const loadMoreBtnTarget = `            {usersHasMore && (
              <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">`;

const loadMoreBtnReplacement = `            {!searchQuery && usersHasMore && (
              <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">`;

code = code.replace(loadMoreBtnTarget, loadMoreBtnReplacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
