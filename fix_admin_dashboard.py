import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target1 = """import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter, or } from 'firebase/firestore';"""
replacement1 = """import { collection, query, orderBy, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter, or } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """    // Fetch Posts
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });

    // Fetch Total Posts Count
    const fetchTotalPosts = async () => {
      try {
        const coll = collection(db, 'posts');
        const snapshot = await getCountFromServer(coll);
        setTotalPostsCount(snapshot.data().count);
      } catch (err) {
        console.error("Error fetching total posts count", err);
      }
    };
    fetchTotalPosts();

    // Fetch Users
    const fetchInitialUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsersList(usersData);
        if (snapshot.docs.length > 0) {
          setLastUserDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching initial users", err);
      }
    };
    fetchInitialUsers();

    // Fetch Feedback
    const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbackList(feedbackData);
    });

    // Fetch Pending Beats
    const beatsQuery = query(collection(db, 'beats'), where('status', '==', 'pending'), limit(50));
    const unsubscribeBeats = onSnapshot(beatsQuery, (snapshot) => {
      const beatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingBeats(beatsData);
    });

    return () => {
      unsubscribePosts();
      unsubscribeFeedback();
      unsubscribeBeats();
    };"""
replacement2 = """    const fetchAdminData = async () => {
      // Fetch Posts
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      const postsSnap = await getDocs(postsQuery);
      setPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Total Posts Count
      try {
        const coll = collection(db, 'posts');
        const countSnap = await getCountFromServer(coll);
        setTotalPostsCount(countSnap.data().count);
      } catch (err) {
        console.error("Error fetching total posts count", err);
      }

      // Fetch Users
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const usersSnap = await getDocs(usersQuery);
        setUsersList(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (usersSnap.docs.length > 0) {
          setLastUserDoc(usersSnap.docs[usersSnap.docs.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching initial users", err);
      }

      // Fetch Feedback
      const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50));
      const feedbackSnap = await getDocs(feedbackQuery);
      setFeedbackList(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Pending Beats
      const beatsQuery = query(collection(db, 'beats'), where('status', '==', 'pending'), limit(50));
      const beatsSnap = await getDocs(beatsQuery);
      setPendingBeats(beatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    
    fetchAdminData();"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)
