const fs = require('fs');
let code = fs.readFileSync('src/pages/NotesHub.tsx', 'utf8');

code = code.replace(`import { BookOpen, FileText, Upload, ThumbsUp, ThumbsDown, TrendingUp, Search, Plus, X, ExternalLink, Filter, Clock, Maximize2, Trash2 } from 'lucide-react';`, `import { BookOpen, FileText, Upload, ThumbsUp, ThumbsDown, TrendingUp, Search, Plus, X, ExternalLink, Filter, Clock, Maximize2, Trash2, RefreshCw } from 'lucide-react';`);

code = code.replace(`import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDoc, serverTimestamp, addDoc, limit, where } from 'firebase/firestore';`, `import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, getDoc, serverTimestamp, addDoc, limit, where } from 'firebase/firestore';`);

const useEffectTarget = `  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'study_notes'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const allNotes: Note[] = [];
      snap.forEach(doc => {
        allNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(allNotes);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'note_upvotes'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const myUpvotes = new Set<string>();
      const myDownvotes = new Set<string>();
      snap.forEach(doc => {
        const data = doc.data();
        if (data.type === 'downvote') {
          myDownvotes.add(data.noteId);
        } else {
          myUpvotes.add(data.noteId);
        }
      });
      setUpvotedNotes(myUpvotes);
      setDownvotedNotes(myDownvotes);
    });
    return () => unsub();
  }, [user]);`;

const useEffectReplacement = `  const fetchNotesAndVotes = async () => {
    if (!user) return;
    try {
      const qNotes = query(collection(db, 'study_notes'), orderBy('createdAt', 'desc'), limit(50));
      const snapNotes = await getDocs(qNotes);
      const allNotes: Note[] = [];
      snapNotes.forEach(doc => {
        allNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(allNotes);

      const qVotes = query(collection(db, 'note_upvotes'), where('userId', '==', user.uid));
      const snapVotes = await getDocs(qVotes);
      const myUpvotes = new Set<string>();
      const myDownvotes = new Set<string>();
      snapVotes.forEach(doc => {
        const data = doc.data();
        if (data.type === 'downvote') {
          myDownvotes.add(data.noteId);
        } else {
          myUpvotes.add(data.noteId);
        }
      });
      setUpvotedNotes(myUpvotes);
      setDownvotedNotes(myDownvotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  useEffect(() => {
    fetchNotesAndVotes();
  }, [user]);`;

code = code.replace(useEffectTarget, useEffectReplacement);


const buttonTarget = `          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-white dark:bg-slate-900 text-indigo-900 hover:bg-indigo-50 font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center active:scale-95"
          >`;

const buttonReplacement = `          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotesAndVotes}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 shadow-lg transition-all active:scale-95"
              title="Refresh Notes"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white dark:bg-slate-900 text-indigo-900 hover:bg-indigo-50 font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center active:scale-95"
            >
`;

code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/pages/NotesHub.tsx', code);
console.log("NotesHub fixed!");
