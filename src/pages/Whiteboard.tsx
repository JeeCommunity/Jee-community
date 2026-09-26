import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Share2, Eraser, RotateCcw, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Whiteboard() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [groupName, setGroupName] = useState("Study Whiteboard");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      try {
        const docRef = doc(db, 'study_groups', groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGroupName(docSnap.data().name);
        }
      } catch (e) {}
    };
    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to parent container
    const rect = canvas.getBoundingClientRect();
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || (window.innerHeight - 100);

    // Fill white background initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast.success("Whiteboard cleared");
  };

  const handleShareToGroup = async () => {
    if (!canvasRef.current || !groupId || !user) return;
    setIsSharing(true);
    const toastId = toast.loading("Sharing whiteboard to group...");
    
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      // Convert dataURL to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });

      const downloadUrl = await uploadFileToCloudinary(file);

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

      toast.success("Shared to group successfully!", { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to share: " + (e.message || "Unknown error"), { id: toastId });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-sm">
         <div className="flex items-center gap-3">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
             <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
             <Palette className="w-5 h-5 text-indigo-600" />
             <span>Whiteboard: {groupName}</span>
           </h1>
         </div>
         
         <div className="flex items-center gap-2">
            <button 
              onClick={handleShareToGroup} 
              disabled={isSharing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
               <Share2 className="w-4 h-4" /> Share to Chat
            </button>
         </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          {['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed', '#000000'].map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'scale-110 border-slate-900 shadow-md' : 'border-white'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tool === 'pen' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
            >
              Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${tool === 'eraser' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
            >
              <Eraser className="w-3.5 h-3.5" /> Eraser
            </button>
          </div>

          <div className="flex items-center gap-1">
            {[2, 4, 8, 14].map((w) => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${lineWidth === w ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {w}
              </button>
            ))}
          </div>

          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-red-100"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 relative w-full h-full bg-white cursor-crosshair overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block bg-white"
        />
      </div>
    </div>
  );
}
