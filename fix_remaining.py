import re

def fix_file(filename, replacements):
    with open(filename, 'r') as f:
        content = f.read()
    
    for pat, repl in replacements:
        if isinstance(pat, re.Pattern):
            content = pat.sub(repl, content)
        else:
            content = content.replace(pat, repl)
            
    with open(filename, 'w') as f:
        f.write(content)

# GlobalStudyNotifier
fix_file('src/components/GlobalStudyNotifier.tsx', [
    ("import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';", 
     "import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';"),
    (re.compile(r'const unsubscribe = onSnapshot.*?return \(\) => unsubscribe\(\);', re.DOTALL),
     """const fetchNotifier = async () => {
      const q = query(collection(db, 'study_sessions'), orderBy('joinedAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        if (latest.isStudying && latest.userId !== user.uid) {
          const joinedTime = latest.joinedAt?.toMillis() || 0;
          if (Date.now() - joinedTime < 60000) {
            setLatestSession(latest);
            setTimeout(() => setLatestSession(null), 5000);
          }
        }
      }
    };
    
    fetchNotifier();
    const interval = setInterval(fetchNotifier, 60000);
    return () => clearInterval(interval);""")
])

# NotificationsDropdown
fix_file('src/components/NotificationsDropdown.tsx', [
    (re.compile(r'const unsubscribe = onSnapshot.*?return \(\) => unsubscribe\(\);', re.DOTALL),
     """const fetchNotifications = async () => {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const notifs: any[] = [];
      let unread = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        notifs.push({ id: doc.id, ...data });
        if (!data.isRead) {
          unread++;
        }
      });
      setNotifications(notifs);
      setUnreadCount(unread);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);""")
])

# CommentsModal
fix_file('src/components/CommentsModal.tsx', [
    (re.compile(r'const unsubscribe = onSnapshot.*?return \(\) => unsubscribe\(\);', re.DOTALL),
     """const fetchComments = async () => {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', post.id)
      );
      
      const snapshot = await getDocs(q);
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      // Sort newest first
      fetchedComments.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      setComments(fetchedComments);
    };

    fetchComments();""")
])

# StatusReplies
fix_file('src/pages/StatusReplies.tsx', [
    (re.compile(r'const unsubscribe = onSnapshot.*?return \(\) => unsubscribe\(\);', re.DOTALL),
     """const fetchReplies = async () => {
      const q = query(collection(db, 'status_replies'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setReplies(data);
      
      // Fetch statuses that are referenced
      const statusIds = [...new Set(data.map(r => r.statusId))];
      const statusData: Record<string, any> = {};
      
      for (const id of statusIds) {
        if (!statuses[id]) {
          try {
            const s = await getDoc(doc(db, 'admin_statuses', id));
            if (s.exists()) {
              statusData[id] = s.data();
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      
      if (Object.keys(statusData).length > 0) {
         setStatuses(prev => ({...prev, ...statusData}));
      }
    };
    
    fetchReplies();""")
])

# AdminDashboard
fix_file('src/pages/AdminDashboard.tsx', [
    (re.compile(r'// Fetch Posts.*?unsubscribeBeats\(\);\n    };', re.DOTALL),
     """const fetchAdminData = async () => {
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
    
    fetchAdminData();""")
])

# Campus
fix_file('src/pages/Campus.tsx', [
    (re.compile(r'const unsubSession = onSnapshot.*?return \(\) => \{\n      unsubSession\(\);\n      unsubStats\(\);\n    \};', re.DOTALL),
     """const fetchCampusData = async () => {
      try {
        const sessionSnap = await getDoc(doc(db, "study_sessions", user.uid));
        if (sessionSnap.exists()) {
          setMySession(sessionSnap.data());
        } else {
          setMySession(null);
        }
        
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.campus) {
            setCampusStats({
              totalXP: data.campus.totalXP || 0,
              totalCoins: data.campus.totalCoins || 0
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchCampusData();""")
])

