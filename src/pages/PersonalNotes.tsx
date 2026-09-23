import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Search, Trash2, FileText, CheckCircle2, Loader2, Menu, X, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: any;
  createdAt: any;
}

export default function PersonalNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'personal_notes'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      data.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return timeB - timeA;
      });
      setNotes(data);
    }, (err: any) => {
      console.error('Notes fetch error:', err);
      if (err.code === 'permission-denied') {
        toast.error("Firebase Rules Error: Please update rules in Firebase Console!");
      }
    });
    return () => unsub();
  }, [user]);

  const handleCreateNote = async () => {
    if (!user) return;
    try {
      const newNote = {
        userId: user.uid,
        title: '',
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'personal_notes'), newNote);
      setActiveNote({ id: docRef.id, ...newNote, title: '', content: '' } as any);
      setIsSidebarOpen(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        toast.error('Permission Denied: Please add the Security Rule in your Firebase Console!');
      } else {
        toast.error('Failed to create note');
      }
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteDoc(doc(db, 'personal_notes', noteId));
      if (activeNote?.id === noteId) {
        setActiveNote(null);
      }
      toast.success('Note deleted');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        toast.error('Permission Denied: Please update Firebase Rules.');
      } else {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleNoteChange = (field: 'title' | 'content', value: string) => {
    if (!activeNote) return;
    
    // Optimistic update locally
    const updatedNote = { ...activeNote, [field]: value };
    setActiveNote(updatedNote);
    
    setSavingStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'personal_notes', activeNote.id), {
          [field]: value,
          updatedAt: serverTimestamp()
        });
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (err: any) {
        console.error("Save error", err);
        if (err.code === 'permission-denied') {
          toast.error('Permission Denied: Please add the Security Rule in your Firebase Console!');
        } else {
          toast.error('Failed to save');
        }
        setSavingStatus('idle');
      }
    }, 1000);
  };

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full">
          <FileText className="w-16 h-16 text-indigo-200 dark:text-indigo-900 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">My Notes</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Please log in to view and create your personal notes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] -mt-4 sm:mt-0 flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 relative">
      
      {/* Mobile Toggle & Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="font-bold text-slate-800 dark:text-white">My Notes</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Note List */}
      <div className={`
        absolute md:static top-0 left-0 h-full w-full md:w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        flex flex-col z-20 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
          <button 
            onClick={handleCreateNote}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" /> New Note
          </button>
          
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 ? (
             <div className="text-center p-8 opacity-50">
               <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
               <p className="text-sm font-medium dark:text-slate-400">No notes yet</p>
             </div>
          ) : filteredNotes.length === 0 ? (
             <div className="text-center p-8 opacity-50">
               <p className="text-sm font-medium dark:text-slate-400">No notes found</p>
             </div>
          ) : (
            filteredNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => { setActiveNote(note); setIsSidebarOpen(false); }}
                className={`
                  p-3 rounded-xl cursor-pointer transition-all border group relative
                  ${activeNote?.id === note.id 
                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' 
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <h3 className={`font-bold text-sm truncate pr-6 ${activeNote?.id === note.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {note.title || 'Untitled Note'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {note.content || 'No content...'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium uppercase tracking-wider">
                  {formatDate(note.updatedAt || note.createdAt)}
                </p>
                
                <button 
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  className="absolute right-2 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area - Editor */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 relative">
        {activeNote ? (
          <div className="flex-1 flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
            {/* Auto-save Status */}
            <div className="flex justify-end mb-2 h-6 items-center">
              {savingStatus === 'saving' && (
                <span className="flex items-center text-xs font-bold text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </span>
              )}
              {savingStatus === 'saved' && (
                <span className="flex items-center text-xs font-bold text-green-500">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Saved
                </span>
              )}
            </div>

            <input 
              type="text" 
              placeholder="Note Title..."
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              className="w-full text-3xl md:text-4xl font-black text-slate-800 dark:text-white bg-transparent border-0 focus:ring-0 px-0 placeholder-slate-300 dark:placeholder-slate-700 mb-6"
            />
            <textarea 
              placeholder="Start typing your notes here..."
              value={activeNote.content}
              onChange={(e) => handleNoteChange('content', e.target.value)}
              className="w-full flex-1 resize-none bg-transparent border-0 focus:ring-0 px-0 text-slate-700 dark:text-slate-300 text-[15px] md:text-base leading-relaxed placeholder-slate-300 dark:placeholder-slate-700"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 hidden md:flex">
             <div className="text-center opacity-40">
               <Edit3 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
               <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">Select a note</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Choose a note from the sidebar or create a new one.</p>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
