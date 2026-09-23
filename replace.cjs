const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveStudy.tsx', 'utf8');

const target = `  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "study_sessions"), orderBy('lastUpdated', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const allSessions: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        allSessions.push({ id: doc.id, ...data });
        if (doc.id === user.uid) {
          setMySession({ id: doc.id, ...data });
        }
      });

      setSessions(
        allSessions.sort((a, b) => {
          const getSessionTimeLocal = (s: any) => {
            const todayDate = getLocalDate();
            let total = s.accumulatedTime || 0;
            if (s.dailyDate !== todayDate) return 0;
            if (s.isStudying && s.startTime) {
              let t = Math.floor((Date.now() - s.startTime) / 1000);
              if (t > 3 * 3600) t = 3 * 3600;
              total += t;
            }
            return Math.min(total, 18 * 3600);
          };
          return getSessionTimeLocal(b) - getSessionTimeLocal(a);
        }),
      );
    });

    return () => unsub();
  }, [user]);`;

const replacement = `  useEffect(() => {
    if (!user) return;
    
    // Dedicated listener for the current user's session
    const myRef = doc(db, "study_sessions", user.uid);
    const unsubMy = onSnapshot(myRef, (docSnap) => {
      if (docSnap.exists()) {
        setMySession({ id: docSnap.id, ...docSnap.data() });
      } else {
        setMySession(null);
      }
    });

    // Listener for active students list (limit to 50 most recently updated)
    const q = query(collection(db, "study_sessions"), orderBy('lastUpdated', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const allSessions: any[] = [];
      const todayDate = getLocalDate();
      
      snap.forEach((doc) => {
        const data = doc.data();
        // Include if they are studying now or have studied today
        const hasStudiedToday = data.dailyDate === todayDate && (data.accumulatedTime > 0 || data.isStudying);
        if (data.isStudying || hasStudiedToday) {
          allSessions.push({ id: doc.id, ...data });
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
            return Math.min(total, 18 * 3600);
          };
          return getSessionTimeLocal(b) - getSessionTimeLocal(a);
        })
      );
    });

    return () => {
      unsub();
      unsubMy();
    };
  }, [user]);`;

if (code.includes(target)) {
  fs.writeFileSync('src/pages/LiveStudy.tsx', code.replace(target, replacement));
  console.log('Success');
} else {
  console.log('Target not found in exact string format. Attempting regex replacement...');
  const regex = /  useEffect\(\(\) => \{\s*if \(!user\) return;\s*const q = query\(collection\(db, "study_sessions"\), orderBy\('lastUpdated', 'desc'\), limit\(20\)\);[\s\S]*?return \(\) => unsub\(\);\s*\}, \[user\]\);/;
  if (regex.test(code)) {
    fs.writeFileSync('src/pages/LiveStudy.tsx', code.replace(regex, replacement));
    console.log('Success with regex');
  } else {
    console.log('Failed');
  }
}
