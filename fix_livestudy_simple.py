import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Replace onSnapshot import
content = content.replace("  onSnapshot,\n", "  getDocs,\n")
content = content.replace("import {\n  doc,\n  getDoc,\n  setDoc,\n  updateDoc,\n  collection,\n  getDocs,\n  query,\n  where,\n  limit,\n  orderBy,\n  serverTimestamp,\n} from \"firebase/firestore\";", "import {\n  doc,\n  getDoc,\n  setDoc,\n  updateDoc,\n  collection,\n  getDocs,\n  query,\n  where,\n  limit,\n  orderBy,\n  serverTimestamp,\n} from \"firebase/firestore\";") # ensure getDocs is there

match = re.search(r'  useEffect\(\(\) => \{\n    if \(\!user\) return;\n    const unsub = onSnapshot\(doc\(db, "users", user\.uid\), \(docSnap\) => \{.*?return \(\) => unsub\(\);\n  \}, \[user\]\);', content, re.DOTALL)
if match:
    repl = """  useEffect(() => {
    if (!user) return;
    const fetchUserStats = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.campus) {
            setCampusStats({
              totalCoins: data.campus.totalCoins || 0,
              totalXP: data.campus.totalXP || 0
            });
          }
        }
      } catch (err) {}
    };
    
    fetchUserStats();
    const interval = setInterval(fetchUserStats, 60000); // Poll every 1 minute
    return () => clearInterval(interval);
  }, [user]);"""
    content = content[:match.start()] + repl + content[match.end():]


match2 = re.search(r'  useEffect\(\(\) => \{\n    if \(\!user\) return;\n    \n    // Dedicated listener for the current user\'s session.*?unsub\(\);\n    \};\n  \}, \[user\]\);', content, re.DOTALL)
if match2:
    repl2 = """  useEffect(() => {
    if (!user) return;
    
    const myRef = doc(db, "study_sessions", user.uid);
    const fetchSessions = async () => {
      try {
        const myDocSnap = await getDoc(myRef);
        if (myDocSnap.exists()) {
          setMySession({ id: myDocSnap.id, ...myDocSnap.data() });
        } else {
          setMySession(null);
        }

        const q = query(collection(db, "study_sessions"));
        const snap = await getDocs(q);
        const allSessions: any[] = [];
        const todayDate = getLocalDate();
        
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          // Include if they are studying now or have studied today
          const hasStudiedToday = data.dailyDate === todayDate && (data.accumulatedTime > 0 || data.isStudying);
          if (data.isStudying || hasStudiedToday) {
            allSessions.push({ id: docSnap.id, ...data });
          }
        });

        setSessions(
          allSessions.sort((a, b) => {
            const getSessionTimeLocal = (s: any) => {
              let total = s.accumulatedTime || 0;
              if (s.dailyDate !== todayDate) return 0;
              if (s.isStudying && s.startTime) {
                let t = Math.floor((Date.now() - s.startTime) / 1000);
                if (t > 3 * 3600) t = 3 * 3600;
                total += t;
              }
              return total;
            };
            return getSessionTimeLocal(b) - getSessionTimeLocal(a);
          })
        );
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };

    fetchSessions();
    const sessionsInterval = setInterval(fetchSessions, 10000); // Poll every 10s
    return () => clearInterval(sessionsInterval);
  }, [user]);"""
    content = content[:match2.start()] + repl2 + content[match2.end():]

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
