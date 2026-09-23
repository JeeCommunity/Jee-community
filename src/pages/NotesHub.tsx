import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Edit3, Target, FileText, ChevronRight, ArrowLeft,
  Upload, Search, Star, MessageSquare, Download, CheckCircle, ExternalLink, Library, Trash2, X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, getDoc, query, where, orderBy, serverTimestamp, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'books', title: 'Books PDF', icon: BookOpen, desc: 'Textbooks, Reference Books' },
  { id: 'notes', title: 'Handwritten Notes', icon: Edit3, desc: 'Topper notes, class notes' },
  { id: 'mocks', title: 'Mock Tests', icon: Target, desc: 'Full syllabus, part tests' },
  { id: 'pyqs', title: 'PYQs', icon: FileText, desc: 'Previous year papers' }
];

const SUBJECTS = [
  { id: 'physics', title: 'Physics', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'chemistry', title: 'Chemistry', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'maths', title: 'Mathematics', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
];

export default function NotesHub() {
  const { user, profile } = useAuth();
  
  // Navigation State
  // level 1: Categories
  // level 2: Subjects
  // level 3: List of notes
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', linkUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkError, setLinkError] = useState(false);

  // Ad/Viewer State
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [adTimer, setAdTimer] = useState(0);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchNotes = async () => {
    if (!selectedCategory || !selectedSubject) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'notes_hub'),
        where('category', '==', selectedCategory),
        where('subject', '==', selectedSubject)
      );
      const snap = await getDocs(q);
      const fetched: any[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      try {
        const userIds = [...new Set(fetched.map((n: any) => n.uploadedBy?.uid).filter(Boolean))];
        const userProfiles: any = {};
        await Promise.all(userIds.map(async (uid) => {
           const uSnap = await getDoc(doc(db, 'users', uid));
           if (uSnap.exists()) {
               userProfiles[uid] = uSnap.data();
           }
        }));
        fetched.forEach((note) => {
           if (note.uploadedBy?.uid && userProfiles[note.uploadedBy.uid]) {
               const u = userProfiles[note.uploadedBy.uid];
               note.uploadedBy.name = u.fullName || u.username || note.uploadedBy.name;
               note.uploadedBy.avatar = u.photoURL || note.uploadedBy.avatar;
           }
        });
      } catch (profileErr) {
        console.error("Error fetching profiles", profileErr);
      }

      // Client-side sort by createdAt descending to avoid composite index error
      fetched.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setNotes(fetched);
    } catch (err) {
      console.error("Error fetching notes", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentLevel === 3) {
      fetchNotes();
    }
  }, [currentLevel, selectedCategory, selectedSubject]);

  useEffect(() => {
    let interval: any;
    if (adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adTimer]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !selectedCategory || !selectedSubject || !user) return;
    
    if (uploadMode === 'file' && !selectedFile) return;
    if (uploadMode === 'link' && !uploadForm.linkUrl) return;
        
    setLinkError(false); setIsUploading(true);
    try {
      let fileUrl = '';
      
      if (uploadMode === 'file') {
         if (selectedFile!.size > 10 * 1024 * 1024) {
            toast.error("This file is too large (over 10MB). Please switch to 'Paste Link' mode and use a Google Drive link.");
            setIsUploading(false);
            return;
         }
         // 1. Upload file securely (Uses configured limits to save storage)
         fileUrl = await uploadFileToCloudinary(selectedFile!);
      } else {
         if (uploadForm.linkUrl.includes('drive.google.com')) {
           try {
             const res = await fetch('/api/check-drive-link', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ url: uploadForm.linkUrl })
             });
             if (res.ok) {
               const data = await res.json();
               if (typeof data.error === 'string') {
                 alert(data.error);
                 setIsUploading(false);
                 return;
               }
               if (data.isPublic === false) {
                 setLinkError(true);
                 setIsUploading(false);
                 return;
               }
             }
           } catch (e) {
             console.error("Link check failed", e);
           }
         }
         fileUrl = uploadForm.linkUrl;
      }
      
      if (!fileUrl || !fileUrl.startsWith('http')) {
         throw new Error("Upload failed or invalid link provided");
      }

      // 2. Save metadata to Firebase
      await addDoc(collection(db, 'notes_hub'), {
        title: uploadForm.title,
        description: uploadForm.description,
        category: selectedCategory,
        subject: selectedSubject,
        fileUrl: fileUrl,
        uploadedBy: {
          uid: user.uid,
          name: profile?.fullName || profile?.username || user.displayName || 'User',
          avatar: profile?.photoURL || user.photoURL || null
        },
        createdAt: serverTimestamp(),
        downloads: 0,
        views: 0
      });
      
      setIsUploadModalOpen(false);
      setUploadForm({ title: '', description: '', linkUrl: '' });
      setSelectedFile(null);
      fetchNotes();
      
      toast.success(uploadMode === 'link' ? 'Link added successfully!' : 'File uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error uploading file. Please try a smaller file or try again later.");
    }
    setIsUploading(false);
  };

  const handleNoteClick = async (note: any) => {
    // Increment views
    try {
      await updateDoc(doc(db, 'notes_hub', note.id), { views: increment(1) });
    } catch (e) {}
    
    setViewingNote(note);
    setAdTimer(5);
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'notes_hub', noteToDelete));
      setNotes(notes.filter(n => n.id !== noteToDelete));
      toast.success('Resource deleted successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete. You may not have permission.');
    }
    setNoteToDelete(null);
  };

  const currentCat = CATEGORIES.find(c => c.id === selectedCategory);
  const currentSub = SUBJECTS.find(s => s.id === selectedSubject);

  const filteredNotes = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    return (n.title?.toLowerCase() || '').includes(q) || (n.description?.toLowerCase() || '').includes(q);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header & Breadcrumbs */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
          <Library className="w-8 h-8 text-indigo-600" />
          Notes Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Free library of books, notes, and previous year papers.</p>
        
        {currentLevel > 1 && (
          <div className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button onClick={() => { setCurrentLevel(1); setSelectedCategory(null); setSelectedSubject(null); }} className="hover:text-indigo-600">Categories</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => { setCurrentLevel(2); setSelectedSubject(null); }} className={`hover:text-indigo-600 ${currentLevel === 2 ? 'text-indigo-600' : ''}`}>
              {currentCat?.title}
            </button>
            {currentLevel === 3 && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-indigo-600">{currentSub?.title}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* LEVEL 1: Categories */}
      {currentLevel === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setCurrentLevel(2); }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-md group flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <cat.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{cat.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* LEVEL 2: Subjects */}
      {currentLevel === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBJECTS.map(sub => (
            <button
              key={sub.id}
              onClick={() => { setSelectedSubject(sub.id); setCurrentLevel(3); }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all group flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 ${sub.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{sub.title}</h3>
            </button>
          ))}
        </div>
      )}

      {/* LEVEL 3: Notes List */}
      {currentLevel === 3 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {currentCat?.title} - {currentSub?.title}
            </h2>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
          
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search by title, description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading resources...</div>
          ) : notes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No resources found</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">Be the first one to upload a useful PDF for {currentSub?.title} {currentCat?.title}!</p>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-6 text-indigo-600 font-bold hover:underline"
              >
                Upload now
              </button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No matching results</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">We couldn't find anything matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(note => (
                <div key={note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{note.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{note.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {note.uploadedBy.avatar ? (
                        <img src={note.uploadedBy.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {note.uploadedBy.name ? note.uploadedBy.name[0]?.toUpperCase() : 'U'}
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-slate-500">by {note.uploadedBy.name || 'User'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(user?.uid === note.uploadedBy.uid || user?.email === 'aistoryimage1999@gmail.com') && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleNoteClick(note)}
                        className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Get PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Resource?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to permanently delete this file? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setNoteToDelete(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteNote}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload to {currentSub?.title}
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 m-4 rounded-lg p-1">
               <button 
                 type="button"
                 onClick={() => setUploadMode('file')}
                 className={`flex-1 text-sm py-1.5 font-semibold rounded-md transition-colors ${uploadMode === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 Upload File (&lt;10MB)
               </button>
               <button 
                 type="button"
                 onClick={() => setUploadMode('link')}
                 className={`flex-1 text-sm py-1.5 font-semibold rounded-md transition-colors ${uploadMode === 'link' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 Paste Link (&gt;10MB)
               </button>
            </div>
            
            <form onSubmit={handleUpload} className="px-4 pb-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name of PDF</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. RD Sharma Vol 1 Solutions"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
                  value={uploadForm.title || ''}
                  onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Short Description</label>
                <textarea 
                  required
                  placeholder="Chapter details, quality, etc."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none dark:text-white"
                  value={uploadForm.description || ''}
                  onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                />
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select PDF File</label>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    required
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 10 * 1024 * 1024) {
                        toast.error("File is over 10MB! Please use the 'Paste Link' tab for heavy books.");
                        e.target.value = ''; // Reset input
                        setSelectedFile(null);
                        setUploadMode('link');
                        return;
                      }
                      setSelectedFile(file || null);
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Files are uploaded securely. Max 10MB.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paste Google Drive Link</label>
                  <input 
                    type="url" 
                    required
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 dark:text-white mb-2"
                    value={uploadForm.linkUrl || ''}
                    onChange={e => { setUploadForm({...uploadForm, linkUrl: e.target.value}); setLinkError(false); }}
                  />
                  {linkError ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800/50 mb-2">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                        <X className="w-4 h-4" /> Upload Failed: Your Google Drive Link is Private!
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-300 mb-2">
                        Doosre students is PDF ko nahi dekh payenge. Please isko public banayein:
                      </p>
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2 mb-1">Easy Steps to Publish:</p>
                      <ol className="text-[11px] text-red-600 dark:text-red-400 list-decimal ml-4 space-y-0.5">
                        <li>Apne Google Drive mein file ke aage <b>3 dots (⋮)</b> par click karein.</li>
                        <li><b>Share</b> button par click karein.</li>
                        <li>Niche 'General Access' mein "Restricted" ko change karke <b>"Anyone with the link"</b> select karein.</li>
                        <li>Ab naya link copy karke yahan paste karein!</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">How to get a public Drive link?</p>
                      <ol className="text-[11px] text-blue-700 dark:text-blue-400 list-decimal ml-4 space-y-0.5">
                        <li>Upload your heavy PDF to Google Drive</li>
                        <li>Click the 3 dots (⋮) on the file -&gt; <b>Share</b></li>
                        <li>Under General Access, change "Restricted" to <b>"Anyone with the link"</b></li>
                        <li>Click <b>Copy link</b> and paste it above.</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold flex items-center justify-center disabled:opacity-50"
                >
                  {isUploading ? 'Uploading (Please wait)...' : uploadMode === 'file' ? 'Upload PDF' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AD / VIEWER SCREEN OVERLAY */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
            <h3 className="font-bold truncate pr-4">{viewingNote.title}</h3>
            <button onClick={() => setViewingNote(null)} className="p-1 hover:bg-slate-700 rounded-full shrink-0">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden relative bg-slate-100">
            {adTimer > 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Library className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Preparing your PDF...</h2>
                  <p className="text-slate-500 text-sm mb-6">Your file will be ready in a moment. Supporting free education!</p>
                  
                  {/* Fake Ad Placeholder - In reality, AdSense script goes here */}
                  <div className="w-full h-[250px] bg-slate-100 border border-slate-200 border-dashed rounded-xl flex items-center justify-center mb-6">
                    <span className="text-slate-400 font-medium">Advertisement</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 font-bold text-indigo-600">
                    <span className="w-6 h-6 rounded-full border-2 border-indigo-600 flex items-center justify-center text-xs animate-pulse">
                      {adTimer}
                    </span>
                    seconds remaining
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="bg-white border-b border-slate-200 p-2 flex justify-between items-center px-4">
                  <span className="text-sm font-medium text-slate-600">Document Viewer</span>
                  <a 
                    href={viewingNote.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    download
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {viewingNote.fileUrl.includes('drive.google.com') ? 'Open Drive Link' : 'Download File'}
                  </a>
                </div>
                <iframe 
                  src={viewingNote.fileUrl.includes('drive.google.com') ? viewingNote.fileUrl.replace(/\/view.*/, '/preview') : `https://docs.google.com/gview?url=${encodeURIComponent(viewingNote.fileUrl)}&embedded=true`} 
                  className="w-full flex-1 border-0"
                  title="PDF Viewer"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

