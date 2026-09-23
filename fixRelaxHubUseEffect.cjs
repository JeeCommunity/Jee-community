const fs = require('fs');
let code = fs.readFileSync('src/pages/RelaxHub.tsx', 'utf8');

const target = `  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'beats'),
      where('status', '==', 'approved'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const beatsData: Beat[] = [];
      snapshot.forEach((doc) => {
        beatsData.push({ id: doc.id, ...doc.data() } as Beat);
      });
      setBeats(beatsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);`;

const replacement = `  const fetchBeats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'beats'),
        where('status', '==', 'approved'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const beatsData: Beat[] = [];
      snapshot.forEach((doc) => {
        beatsData.push({ id: doc.id, ...doc.data() } as Beat);
      });
      setBeats(beatsData);
    } catch (err) {
      console.error("Error fetching beats:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeats();
  }, [user]);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/RelaxHub.tsx', code);
    console.log("Success");
} else {
    console.log("Target not found!");
}
