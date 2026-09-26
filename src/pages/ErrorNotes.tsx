import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Plus, Search, Trash2, FileText, CheckCircle2, Loader2, Menu, X, Edit3, Pin, Download, Copy, BookOpen, AlertCircle, Star, Filter, RefreshCw, Eye, Check, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import toast from 'react-hot-toast';

interface ErrorNote {
  id: string;
  userId: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  topic?: string;
  title: string;
  imagePath?: string | null;
  mistake: string;
  correctConcept: string;
  takeaway: string;
  errorType: string;
  importance: 'normal' | 'important' | 'must-revise';
  createdAt: any;
  updatedAt: any;
  lastReviewedAt?: any | null;
  isRevised?: boolean;
}

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'] as const;
const ERROR_TYPES = [
  'Conceptual Mistake',
  'Formula Mistake',
  'Calculation Mistake',
  'Silly Mistake',
  'Question Misread',
  'Wrong Approach',
  'Time Management',
  'Other'
];

export default function ErrorNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ErrorNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<ErrorNote | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'revision'>('all');

  // Form states
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Physics');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [mistake, setMistake] = useState('');
  const [correctConcept, setCorrectConcept] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [errorType, setErrorType] = useState('Conceptual Mistake');
  const [importance, setImportance] = useState<'normal' | 'important' | 'must-revise'>('normal');
  const [submitting, setSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterImportance, setFilterImportance] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'reviewed' | 'must-revise'>('newest');

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, 'error_notes'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorNote));
      setNotes(data);
      setLoading(false);
    }, (err: any) => {
      console.error('Error notes fetch error:', err);
      setLoading(false);
      if (err.code === 'permission-denied') {
        toast.error("Firebase Rules Error: Please ensure Firestore security rules allow reading your error notes.");
      }
    });
    return () => unsub();
  }, [user]);

  const resetForm = () => {
    setSubject('Physics');
    setChapter('');
    setTopic('');
    setTitle('');
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setMistake('');
    setCorrectConcept('');
    setTakeaway('');
    setErrorType('Conceptual Mistake');
    setImportance('normal');
    setEditingNoteId(null);
    setIsFormOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (note: ErrorNote) => {
    setEditingNoteId(note.id);
    setSubject(note.subject);
    setChapter(note.chapter);
    setTopic(note.topic || '');
    setTitle(note.title);
    setExistingImageUrl(note.imagePath || null);
    setImagePreview(note.imagePath || null);
    setMistake(note.mistake);
    setCorrectConcept(note.correctConcept);
    setTakeaway(note.takeaway);
    setErrorType(note.errorType);
    setImportance(note.importance);
    setViewingNote(null);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!chapter.trim() || !title.trim() || !mistake.trim() || !correctConcept.trim()) {
      toast.error("Please fill in all required fields (Chapter, Title, Mistake, Correct Concept).");
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = existingImageUrl;
      if (imageFile) {
        finalImageUrl = await uploadFileToCloudinary(imageFile);
      }

      const noteData: any = {
        userId: user.uid,
        subject,
        chapter: chapter.trim(),
        topic: topic.trim() || null,
        title: title.trim(),
        imagePath: finalImageUrl || null,
        mistake: mistake.trim(),
        correctConcept: correctConcept.trim(),
        takeaway: takeaway.trim(),
        errorType,
        importance,
        updatedAt: serverTimestamp(),
      };

      if (editingNoteId) {
        await updateDoc(doc(db, 'error_notes', editingNoteId), noteData);
        toast.success("Error note updated successfully!");
      } else {
        noteData.createdAt = serverTimestamp();
        noteData.isRevised = false;
        noteData.lastReviewedAt = null;
        await addDoc(collection(db, 'error_notes'), noteData);
        toast.success("Error saved successfully!");
      }

      resetForm();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save error note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Delete this error note?\n\n\"This error and its attached image will be permanently deleted.\"")) return;
    try {
      await deleteDoc(doc(db, 'error_notes', noteId));
      if (viewingNote?.id === noteId) setViewingNote(null);
      toast.success("Error note deleted");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete error note");
    }
  };

  const handleMarkRevised = async (note: ErrorNote) => {
    try {
      await updateDoc(doc(db, 'error_notes', note.id), {
        isRevised: true,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Marked as reviewed! Keep revising.");
      if (viewingNote && viewingNote.id === note.id) {
        setViewingNote({ ...viewingNote, isRevised: true, lastReviewedAt: new Date() });
      }
    } catch (e) {
      toast.error("Failed to update revision status");
    }
  };

  // Stats calculations
  const totalErrors = notes.length;
  const physicsCount = notes.filter(n => n.subject === 'Physics').length;
  const chemistryCount = notes.filter(n => n.subject === 'Chemistry').length;
  const mathsCount = notes.filter(n => n.subject === 'Mathematics').length;
  const importantCount = notes.filter(n => n.importance === 'important' || n.importance === 'must-revise').length;
  const toReviseCount = notes.filter(n => !n.isRevised || n.importance === 'must-revise').length;

  // Filtered & Sorted notes
  const filteredNotes = notes.filter(n => {
    if (activeTab === 'revision') {
      if (n.importance !== 'must-revise' && n.isRevised) return false;
    }
    const queryStr = searchQuery.toLowerCase();
    const matchesSearch = !queryStr || 
      n.title?.toLowerCase().includes(queryStr) ||
      n.chapter?.toLowerCase().includes(queryStr) ||
      n.topic?.toLowerCase().includes(queryStr) ||
      n.mistake?.toLowerCase().includes(queryStr) ||
      n.correctConcept?.toLowerCase().includes(queryStr) ||
      n.takeaway?.toLowerCase().includes(queryStr);

    const matchesSubject = filterSubject === 'All' || n.subject === filterSubject;
    const matchesType = filterType === 'All' || n.errorType === filterType;
    const matchesImportance = filterImportance === 'All' || n.importance === filterImportance;

    return matchesSearch && matchesSubject && matchesType && matchesImportance;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    } else if (sortBy === 'oldest') {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeA - timeB;
    } else if (sortBy === 'reviewed') {
      const timeA = a.lastReviewedAt?.toMillis ? a.lastReviewedAt.toMillis() : 0;
      const timeB = b.lastReviewedAt?.toMillis ? b.lastReviewedAt.toMillis() : 0;
      return timeB - timeA;
    } else if (sortBy === 'must-revise') {
      if (a.importance === 'must-revise' && b.importance !== 'must-revise') return -1;
      if (a.importance !== 'must-revise' && b.importance === 'must-revise') return 1;
      return 0;
    }
    return 0;
  });

  const formatDate = (date: any) => {
    if (!date) return 'Not yet';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full">
          <BookOpen className="w-16 h-16 text-red-200 dark:text-red-900 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Error Notes Book</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Please log in to track and revise your JEE mistakes securely.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> Personal Study Vault
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">My Error Notes</h1>
          <p className="text-red-100 text-sm md:text-base leading-relaxed max-w-lg">
            Save your mistakes, understand them, and revise them before your next JEE attempt.
          </p>
        </div>
        <div className="z-10 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="bg-white text-red-600 hover:bg-red-50 font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm md:text-base"
          >
            <Plus className="w-5 h-5" /> + Add New Error
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Errors</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{totalErrors}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Physics</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{physicsCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-purple-500 uppercase tracking-wider">Chemistry</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{chemistryCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Maths</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{mathsCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Important</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{importantCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">To Revise</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">{toReviseCount}</div>
        </div>
      </div>

      {/* Navigation Tabs (All Errors vs Revision Queue) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            📕 All Error Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'revision'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> 🔄 Revision Queue ({toReviseCount})
          </button>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your errors by title, chapter, topic, mistake or concept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="All">Subject: All</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="All">Error Type: All</option>
            {ERROR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="All">Importance: All</option>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="must-revise">Must Revise</option>
          </select>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="reviewed">Recently Revised</option>
            <option value="must-revise">Must Revise First</option>
          </select>
        </div>
      </div>

      {/* Notes Grid / List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            📕
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Your Error Notes Book is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Save the mistakes you make while practicing JEE questions. Reviewing your own mistakes can help you avoid repeating them.
          </p>
          <button
            onClick={handleOpenCreate}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> + Add Your First Error
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const subjectColor = 
              note.subject === 'Physics' ? 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900' :
              note.subject === 'Chemistry' ? 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900' :
              'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900';

            const importanceBadge = 
              note.importance === 'must-revise' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 font-black' :
              note.importance === 'important' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 font-bold' :
              'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

            return (
              <div 
                key={note.id}
                className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${subjectColor}`}>
                      🔴 {note.subject}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${importanceBadge}`}>
                      {note.importance === 'must-revise' ? '⭐ Must Revise' : note.importance === 'important' ? '⚠️ Important' : 'Normal'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {note.chapter} {note.topic ? `• ${note.topic}` : ''}
                  </div>

                  <h3 className="font-black text-slate-900 dark:text-white text-base mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                    {note.title}
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Mistake:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                      "{note.mistake}"
                    </p>
                  </div>

                  {note.imagePath && (
                    <div className="mb-3 w-full h-28 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={note.imagePath} alt="Error problem preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
                    <span>Type: <strong className="text-slate-600 dark:text-slate-300">{note.errorType}</strong></span>
                    <span>Added: {formatDate(note.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <button
                    onClick={() => setViewingNote(note)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>

                  {!note.isRevised ? (
                    <button
                      onClick={() => handleMarkRevised(note)}
                      className="flex-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Revised
                    </button>
                  ) : (
                    <span className="flex-1 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 py-2 rounded-xl border border-emerald-200/50">
                      ✓ Revised ({formatDate(note.lastReviewedAt)})
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Edit Note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODAL (Error Details Page) */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📕</span>
                <h3 className="font-black text-slate-900 dark:text-white text-lg">Error Note Details</h3>
              </div>
              <button onClick={() => setViewingNote(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Meta information */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject & Chapter</div>
                  <div className="font-black text-slate-800 dark:text-white text-base mt-0.5">
                    {viewingNote.subject} • {viewingNote.chapter} {viewingNote.topic ? `> ${viewingNote.topic}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Importance</div>
                  <div className="font-bold text-sm text-red-600 dark:text-red-400 mt-0.5">
                    {viewingNote.importance === 'must-revise' ? '⭐ Must Revise' : viewingNote.importance === 'important' ? '⚠️ Important' : 'Normal'}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Question / Error Title</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {viewingNote.title}
                </h2>
              </div>

              {/* Image if available */}
              {viewingNote.imagePath && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Error Image / Problem Snapshot</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img src={viewingNote.imagePath} alt="Error snapshot" className="max-h-80 w-auto object-contain" />
                  </div>
                </div>
              )}

              {/* My Mistake */}
              <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4 rounded-2xl">
                <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">❌ What mistake did I make?</span>
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {viewingNote.mistake}
                </p>
              </div>

              {/* Correct Concept */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">✅ Correct Concept / Solution</span>
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {viewingNote.correctConcept}
                </p>
              </div>

              {/* Takeaway */}
              {viewingNote.takeaway && (
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-2xl">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">💡 What should I remember?</span>
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingNote.takeaway}
                  </p>
                </div>
              )}

              {/* Additional Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>Error Type: <strong className="text-slate-700 dark:text-slate-300">{viewingNote.errorType}</strong></div>
                <div>Created: <strong className="text-slate-700 dark:text-slate-300">{formatDate(viewingNote.createdAt)}</strong></div>
                <div>Last Reviewed: <strong className="text-slate-700 dark:text-slate-300">{formatDate(viewingNote.lastReviewedAt)}</strong></div>
                <div>Status: <strong className={viewingNote.isRevised ? "text-emerald-600" : "text-amber-600"}>{viewingNote.isRevised ? "Revised" : "Pending Revision"}</strong></div>
              </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteNote(viewingNote.id)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-colors"
              >
                Delete
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(viewingNote)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                {!viewingNote.isRevised ? (
                  <button
                    onClick={() => handleMarkRevised(viewingNote)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Mark as Revised
                  </button>
                ) : (
                  <span className="px-4 py-2.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-sm rounded-xl">
                    ✓ Revised
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT ERROR MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📕</span>
                <h3 className="font-black text-slate-900 dark:text-white text-lg">
                  {editingNoteId ? 'Edit Error Note' : 'Add New JEE Error'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveError} className="p-6 overflow-y-auto space-y-5">
              
              {/* Subject & Error Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subject}
                    onChange={(e: any) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Error Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                  >
                    {ERROR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Chapter & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Chapter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electrostatics"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Electric Potential"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Importance */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Importance Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportance('normal')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      importance === 'normal' 
                        ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-900 dark:text-white' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportance('important')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      importance === 'important' 
                        ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ⚠️ Important
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportance('must-revise')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      importance === 'must-revise' 
                        ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-950/60 dark:text-red-300' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ⭐ Must Revise
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Question / Error Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. I confused electric field with electric potential"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                />
              </div>

              {/* Upload Error Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Upload Error Image (Optional - Private Storage)
                </label>
                <div 
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex flex-col items-center justify-center text-sm text-slate-500 dark:text-slate-400 text-center"
                >
                  <ImageIcon className="w-6 h-6 mb-1 text-red-500" />
                  <span>Click to upload question snapshot, test problem or solution (Max 5MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="relative mt-3 w-32 h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); setExistingImageUrl(null); }}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* My Mistake */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  What mistake did I make? <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what you did wrong..."
                  value={mistake}
                  onChange={(e) => setMistake(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white resize-none"
                />
              </div>

              {/* Correct Concept / Solution */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Correct Concept / Solution <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write the correct method, formula, or concept..."
                  value={correctConcept}
                  onChange={(e) => setCorrectConcept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white resize-none"
                />
              </div>

              {/* What should I remember? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  💡 What should I remember? (Takeaway)
                </label>
                <input
                  type="text"
                  placeholder="Short takeaway for quick JEE revision..."
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingNoteId ? 'Update Error' : 'Save Error'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
