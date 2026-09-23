import re

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

target1 = """import { doc, onSnapshot } from "firebase/firestore";"""
replacement1 = """import { doc, getDoc } from "firebase/firestore";"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """  useEffect(() => {
    if (!user) return;
    const unsubSession = onSnapshot(doc(db, "study_sessions", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMySession(docSnap.data());
      } else {
        setMySession(null);
      }
    });

    const unsubStats = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.campus) {
          setCampusStats({
            totalXP: data.campus.totalXP || 0,
            totalCoins: data.campus.totalCoins || 0
          });
        }
      }
    });
    
    return () => {
      unsubSession();
      unsubStats();
    };
  }, [user]);"""
replacement2 = """  useEffect(() => {
    if (!user) return;
    
    const fetchCampusData = async () => {
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
    
    fetchCampusData();
  }, [user]);"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)
