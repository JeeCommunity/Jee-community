const fs = require('fs');
let code = fs.readFileSync('src/pages/RelaxHub.tsx', 'utf8');

code = code.replace(`import { Headphones, Upload, ThumbsUp, ThumbsDown, Play, Pause, X, Loader2, Music, TrendingUp, Clock } from 'lucide-react';`, `import { Headphones, Upload, ThumbsUp, ThumbsDown, Play, Pause, X, Loader2, Music, TrendingUp, Clock, RefreshCw } from 'lucide-react';`);

code = code.replace(`import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, limit } from 'firebase/firestore';`, `import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, limit } from 'firebase/firestore';`);


const useEffectTarget = `  useEffect(() => {
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

const useEffectReplacement = `  const fetchBeats = async () => {
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

code = code.replace(useEffectTarget, useEffectReplacement);


const buttonTarget = `          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2 font-medium shrink-0"
          >`;

const buttonReplacement = `          <button
            onClick={fetchBeats}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh Beats"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2 font-medium shrink-0"
          >`;

code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/pages/RelaxHub.tsx', code);
console.log("RelaxHub fixed!");
