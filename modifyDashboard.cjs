const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add states
const statesTarget = `const [replyContent, setReplyContent] = useState('');`;
const statesReplacement = `const [replyContent, setReplyContent] = useState('');
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [usersLastDoc, setUsersLastDoc] = useState<any>(null);
  const [usersHasMore, setUsersHasMore] = useState<boolean>(true);
  const [usersLoadingMore, setUsersLoadingMore] = useState<boolean>(false);`;

code = code.replace(statesTarget, statesReplacement);

// 2. Add Load More function
const loadMoreTarget = `const handleDeletePost = (postId: string) => {`;
const loadMoreReplacement = `const handleLoadMoreUsers = async () => {
    if (!usersLastDoc || !usersHasMore) return;
    setUsersLoadingMore(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(usersLastDoc), limit(50));
      const snapshot = await getDocs(q);
      const newUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(prev => [...prev, ...newUsers]);
      setUsersLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < 50) {
        setUsersHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more users:", err);
    }
    setUsersLoadingMore(false);
  };

  const handleDeletePost = (postId: string) => {`;

code = code.replace(loadMoreTarget, loadMoreReplacement);

// 3. Update useEffect
const fetchUsersTarget = `    // Fetch Users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    });`;

const fetchUsersReplacement = `    // Fetch Total Users Count
    const fetchTotalUsers = async () => {
      try {
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        setTotalUsersCount(snapshot.data().count);
      } catch (err) {
        console.error("Error getting user count", err);
      }
    };
    fetchTotalUsers();

    // Fetch initial Users
    const fetchInitialUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setUsersLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setUsersHasMore(snapshot.docs.length === 50);
        setLoading(false);
      } catch (err) {
        console.error("Error getting users", err);
        setLoading(false);
      }
    };
    fetchInitialUsers();`;

code = code.replace(fetchUsersTarget, fetchUsersReplacement);

// 4. Remove unsubscribeUsers from cleanup
const cleanupTarget = `      unsubscribePosts();
      unsubscribeUsers();
      unsubscribeFeedback();
      unsubscribeBeats();`;
const cleanupReplacement = `      unsubscribePosts();
      unsubscribeFeedback();
      unsubscribeBeats();`;
code = code.replace(cleanupTarget, cleanupReplacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
