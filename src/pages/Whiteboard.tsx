import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Whiteboard() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [groupName, setGroupName] = useState("Loading...");
  const editorRef = useRef<any>(null);

  React.useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      const docRef = doc(db, 'study_groups', groupId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGroupName(docSnap.data().name);
      }
    };
    fetchGroup();
  }, [groupId]);

  const handleShareToGroup = async () => {
    if (!editorRef.current || !groupId || !user) return;
    try {
      toast.loading("Sharing whiteboard to group...", { id: 'share-wb' });
      
      const editor = editorRef.current;
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) {
        toast.error("Whiteboard is empty", { id: 'share-wb' });
        return;
      }
      
      const image = await editor.toImage(shapeIds, { format: 'png' });
      const blob = image.blob;
      
      const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });
      const storageRef = ref(storage, `chat_images/${groupId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'study_groups', groupId, 'messages'), {
        text: "Shared a whiteboard drawing 🎨",
        userId: user.uid,
        userName: profile?.fullName || profile?.username || "Unknown",
        userPhoto: profile?.photoURL || null,
        createdAt: serverTimestamp(),
        type: 'image',
        fileUrl: downloadUrl,
        isToxic: false,
        toxicWords: []
      });

      toast.success("Shared to group!", { id: 'share-wb' });
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to share: " + (e.message || "Unknown error"), { id: 'share-wb' });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 shrink-0 bg-slate-50">
         <div className="flex items-center gap-3">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
             <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="font-bold text-slate-800 hidden sm:block">Whiteboard: {groupName}</h1>
         </div>
         
         <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden md:inline">Share your screen on Meet, then draw!</span>
            <button onClick={handleShareToGroup} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
               <Share2 className="w-4 h-4" /> Share to Chat
            </button>
         </div>
      </div>
      
      <div className="flex-1 relative w-full h-full">
        <Tldraw onMount={(editor) => editorRef.current = editor} />
      </div>
    </div>
  );
}
