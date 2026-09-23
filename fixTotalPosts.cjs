const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add state
const statesTarget = `const [totalUsersCount, setTotalUsersCount] = useState<number>(0);`;
const statesReplacement = `const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalPostsCount, setTotalPostsCount] = useState<number>(0);`;

code = code.replace(statesTarget, statesReplacement);

// 2. Fetch total posts count
const fetchUsersTarget = `    // Fetch Total Users Count`;
const fetchUsersReplacement = `    // Fetch Total Posts Count
    const fetchTotalPosts = async () => {
      try {
        const coll = collection(db, 'posts');
        const snapshot = await getCountFromServer(coll);
        setTotalPostsCount(snapshot.data().count);
      } catch (err) {
        console.error("Error getting posts count", err);
      }
    };
    fetchTotalPosts();

    // Fetch Total Users Count`;

code = code.replace(fetchUsersTarget, fetchUsersReplacement);

// 3. UI
const postsUITarget = `<h3 className="text-3xl font-black text-slate-900 dark:text-white">{posts.length}</h3>`;
const postsUIReplacement = `<h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalPostsCount || posts.length}</h3>`;

code = code.replace(postsUITarget, postsUIReplacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
