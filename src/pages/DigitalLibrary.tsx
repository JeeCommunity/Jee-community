import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  BookOpen, Users, Clock, Play, Pause, RotateCcw, 
  Volume2, VolumeX, Sparkles, Pencil, Eraser, Trash2, Shield, Radio, CheckCircle, MessageSquare, LogOut, PhoneCall, Maximize2, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DigitalLibrary() {
  const { user, profile } = useAuth();
  const [isInRoom, setIsInRoom] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [whiteboards, setWhiteboards] = useState<Record<string, { strokes: any[]; isWhiteboardActive: boolean }>>({});
  
  // Media states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'pomodoro'>('video');

  // Spotlight view state
  const [spotlightParticipant, setSpotlightParticipant] = useState<any | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // My Whiteboard states (Professional 1200x675 HD resolution for smooth teacher-like writing)
  const [isMyWhiteboardActive, setIsMyWhiteboardActive] = useState(false);
  const myCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const myStrokesRef = useRef<any[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Pomodoro states
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Ambient music states
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync presence in Firestore once when joining/leaving or changing media state (NO continuous heartbeat interval)
  useEffect(() => {
    if (!user || !profile || !isInRoom) return;
    const roomRef = doc(db, 'metadata', 'digital_library_participants_' + user.uid);
    const wbRef = doc(db, 'metadata', 'digital_library_wb_' + user.uid);

    const updatePresence = async () => {
      try {
        await setDoc(roomRef, {
          uid: user.uid,
          fullName: profile.fullName || 'Student',
          username: profile.username || 'aspirant',
          photoURL: profile.photoURL || '',
          isCameraOn,
          isMicOn,
          isScreenSharing,
          isWhiteboardActive: isMyWhiteboardActive,
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Error updating presence:", e);
      }
    };

    updatePresence();

    const metadataRef = collection(db, 'metadata');
    const unsubscribe = onSnapshot(metadataRef, (snapshot) => {
      const partList: any[] = [];
      const wbMap: Record<string, { strokes: any[]; isWhiteboardActive: boolean }> = {};

      snapshot.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id.startsWith('digital_library_participants_')) {
          partList.push({ id, ...data });
        } else if (id.startsWith('digital_library_wb_')) {
          const uid = id.replace('digital_library_wb_', '');
          wbMap[uid] = {
            strokes: data.strokes || [],
            isWhiteboardActive: !!data.isWhiteboardActive
          };
        }
      });
      setParticipants(partList);
      setWhiteboards(wbMap);
    });

    return () => {
      unsubscribe();
      deleteDoc(roomRef).catch(() => {});
      deleteDoc(wbRef).catch(() => {});
    };
  }, [user, isInRoom, isCameraOn, isMicOn, isScreenSharing, isMyWhiteboardActive]);

  // Keep whiteboard strokes locally in memory without high-frequency Firestore writes per stroke
  const publishMyStroke = (stroke: { x0: number; y0: number; x1: number; y1: number; color: string; size: number }) => {
    myStrokesRef.current = [...myStrokesRef.current, stroke].slice(-500);
  };

  const clearMyWhiteboard = async () => {
    if (!user) return;
    try {
      myStrokesRef.current = [];
      const wbRef = doc(db, 'metadata', 'digital_library_wb_' + user.uid);
      await setDoc(wbRef, {
        strokes: [],
        isWhiteboardActive: isMyWhiteboardActive,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      toast.success("Your whiteboard was cleared");
    } catch (e) {
      toast.error("Failed to clear whiteboard");
    }
  };

  const toggleMyWhiteboard = async () => {
    const newState = !isMyWhiteboardActive;
    setIsMyWhiteboardActive(newState);
    if (user) {
      const wbRef = doc(db, 'metadata', 'digital_library_wb_' + user.uid);
      await setDoc(wbRef, {
        isWhiteboardActive: newState,
        strokes: newState ? myStrokesRef.current : [],
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
    toast.success(newState ? "Your whiteboard is now OPEN on your tile ✏️" : "Your whiteboard is closed");
  };

  // Render remote or local whiteboards on HD 1200x675 canvas elements
  useEffect(() => {
    if (!isInRoom) return;
    Object.keys(whiteboards).forEach(uid => {
      const wbData = whiteboards[uid];
      const canvasEl = document.getElementById(`wb-canvas-${uid}`) as HTMLCanvasElement;
      if (canvasEl) {
        if (!canvasEl.width || canvasEl.width !== 1200) {
          canvasEl.width = 1200;
          canvasEl.height = 675;
        }
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
          (wbData.strokes || []).forEach(s => {
            ctx.lineWidth = s.size;
            ctx.lineCap = 'round';
            ctx.strokeStyle = s.color;
            ctx.beginPath();
            ctx.moveTo(s.x0, s.y0);
            ctx.lineTo(s.x1, s.y1);
            ctx.stroke();
          });
        }
      }
    });
  }, [whiteboards, isInRoom]);

  // Handle join/leave room
  const handleJoinMeet = async () => {
    if (!user) {
      toast.error("Please login to join the digital library meet");
      return;
    }
    setIsInRoom(true);
    toast.success("Joined Digital Library Study Hall! 🎉");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setIsMicOn(true);
      toast.success("Camera & Microphone connected successfully!");
    } catch (e) {
      console.log("Permission notice:", e);
      toast("You can turn on your camera and mic anytime using the controls.", { icon: '💡' });
    }
  };

  const handleLeaveMeet = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (user) {
      const roomRef = doc(db, 'metadata', 'digital_library_participants_' + user.uid);
      const wbRef = doc(db, 'metadata', 'digital_library_wb_' + user.uid);
      deleteDoc(roomRef).catch(() => {});
      deleteDoc(wbRef).catch(() => {});
    }
    setIsInRoom(false);
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
    setIsMyWhiteboardActive(false);
    setSpotlightParticipant(null);
    toast.success("Left the meet");
  };

  // Handle camera & mic toggle
  const toggleCamera = async () => {
    try {
      if (!isCameraOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsCameraOn(true);
        setIsMicOn(true);
        toast.success("Camera & Mic enabled");
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => t.stop());
        }
        setIsCameraOn(false);
        toast.success("Camera disabled");
      }
    } catch (e) {
      toast.error("Could not access camera/microphone. Check permissions.");
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
    toast.success(isMicOn ? "Microphone muted" : "Microphone unmuted");
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
          toast.error("Screen sharing requires Desktop Chrome, Edge, or Firefox.");
          return;
        }
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        toast.success("Screen sharing started successfully!");
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          toast.success("Screen sharing stopped");
        };
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
      }
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.message?.includes('Permission denied')) {
        toast("Screen sharing permission was cancelled.", { icon: 'ℹ️' });
      } else {
        toast.error("Screen sharing failed. Please ensure you are using Desktop Chrome/Firefox/Edge on HTTPS.");
      }
    }
  };

  // Pomodoro timer effect
  useEffect(() => {
    let interval: any = null;
    if (isPomodoroActive) {
      interval = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds(s => s - 1);
        } else if (pomodoroMinutes > 0) {
          setPomodoroMinutes(m => m - 1);
          setPomodoroSeconds(59);
        } else {
          setIsPomodoroActive(false);
          if (!isBreak) {
            toast.success("Pomodoro session completed! Take a 5 min break.");
            setPomodoroMinutes(5);
            setPomodoroSeconds(0);
            setIsBreak(true);
          } else {
            toast.success("Break over! Back to studying.");
            setPomodoroMinutes(25);
            setPomodoroSeconds(0);
            setIsBreak(false);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroMinutes, pomodoroSeconds, isBreak]);

  // Ambient lo-fi audio toggle
  const toggleAmbientMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-chill-bro-495.mp3');
      audioRef.current.loop = true;
    }
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
      toast.success("Ambient music paused");
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingMusic(true);
      toast.success("Playing ambient focus music 🎶");
    }
  };

  // High-Resolution Professional Drawing Handlers with Precise Scaling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = myCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastPosRef.current = { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !myCanvasRef.current || !lastPosRef.current) return;
    const canvas = myCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const stroke = {
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: x,
      y1: y,
      color: tool === 'eraser' ? '#ffffff' : brushColor,
      size: tool === 'eraser' ? brushSize * 4 : brushSize
    };

    // Draw locally immediately on HD control panel canvas
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    ctx.moveTo(stroke.x0, stroke.y0);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.stroke();

    lastPosRef.current = { x, y };
    publishMyStroke(stroke);
  };

  useEffect(() => {
    if (isMyWhiteboardActive && myCanvasRef.current) {
      const canvas = myCanvasRef.current;
      if (!canvas.width) {
        canvas.width = 1200;
        canvas.height = 675;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        myStrokesRef.current.forEach(s => {
          ctx.lineWidth = s.size;
          ctx.lineCap = 'round';
          ctx.strokeStyle = s.color;
          ctx.beginPath();
          ctx.moveTo(s.x0, s.y0);
          ctx.lineTo(s.x1, s.y1);
          ctx.stroke();
        });
      }
    }
  }, [isMyWhiteboardActive]);

  // If not yet joined, show the landing card with the big "Join Meet" button
  if (!isInRoom) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12">
            <BookOpen className="w-96 h-96" />
          </div>
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Live Collaborative Study Hall</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Digital Library Live Meet
            </h1>
            <p className="text-indigo-100 text-lg">
              Connect with fellow JEE aspirants in real-time. Share your camera, open your independent personal whiteboard on your video tile, and study together.
            </p>
            <div className="pt-4">
              <button
                onClick={handleJoinMeet}
                className="px-10 py-5 bg-white text-blue-600 hover:bg-blue-50 font-extrabold rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-3 mx-auto text-xl"
              >
                <PhoneCall className="w-7 h-7 text-blue-600 animate-bounce" />
                <span>Join Meet Now 🚀</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Connected to Live Study Hall</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Digital Library Meet Room</h1>
        </div>
        <button
          onClick={handleLeaveMeet}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center space-x-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Leave Meet</span>
        </button>
      </div>

      {/* Workspace Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'video'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video & Participants ({participants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'pomodoro'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pomodoro & Focus</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Video & Independent Whiteboard Grid with Spotlight View */}
        {activeTab === 'video' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Live Group Meet Grid ({participants.length} Aspirants Online) - Tap any tile to Spotlight 🔍</span>
              </h3>
            </div>

            {/* Grid of participant tiles with independent whiteboards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {participants.map((p) => {
                const isMe = p.uid === user?.uid || p.id === 'digital_library_participants_' + user?.uid;
                const uid = isMe ? user?.uid : p.uid;
                const wbData = uid ? whiteboards[uid] : null;
                const showWhiteboard = wbData?.isWhiteboardActive;

                return (
                  <div 
                    key={p.id} 
                    onClick={() => setSpotlightParticipant(p)}
                    className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative shadow-md flex items-center justify-center border border-slate-800 cursor-pointer hover:border-blue-500 transition-all group"
                    title="Tap to view in Spotlight / Fullscreen"
                  >
                    {/* If this participant has their whiteboard active */}
                    {showWhiteboard ? (
                      <div className="w-full h-full bg-white relative flex flex-col">
                        <canvas
                          id={`wb-canvas-${uid}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                          ✏️ Whiteboard Active
                        </div>
                      </div>
                    ) : isMe && (isCameraOn || isScreenSharing) ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : p.isCameraOn || p.isScreenSharing ? (
                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-4">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold mb-2 shadow-inner border border-blue-400">
                          {p.photoURL ? (
                            <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span>{(p.fullName || 'S')[0]}</span>
                          )}
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold animate-pulse">● Camera Active</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-900/90 flex flex-col items-center justify-center text-white p-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold mb-2 shadow-inner border border-slate-700 text-slate-300">
                          {p.photoURL ? (
                            <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span>{(p.fullName || 'S')[0]}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">Camera Off</span>
                      </div>
                    )}

                    {/* Expand icon on hover */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </div>

                    {/* Name & status badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-semibold z-10">
                      <span className="truncate max-w-[120px]">
                        {p.fullName} {isMe && '(You)'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${p.isMicOn ? 'bg-blue-500' : 'bg-red-500'}`} title={p.isMicOn ? "Mic On" : "Muted"}></span>
                        <span className={`w-2 h-2 rounded-full ${p.isCameraOn ? 'bg-emerald-500' : 'bg-slate-500'}`} title={p.isCameraOn ? "Camera On" : "Camera Off"}></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spotlight Fullscreen Modal */}
            {spotlightParticipant && (() => {
              const p = spotlightParticipant;
              const isMe = p.uid === user?.uid || p.id === 'digital_library_participants_' + user?.uid;
              const uid = isMe ? user?.uid : p.uid;
              const wbData = uid ? whiteboards[uid] : null;
              const showWhiteboard = wbData?.isWhiteboardActive;

              return (
                <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold overflow-hidden">
                          {p.photoURL ? <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" /> : <span>{(p.fullName || 'S')[0]}</span>}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{p.fullName} {isMe && '(You)'} - Spotlight View</h3>
                          <p className="text-xs text-slate-400">@{p.username || 'aspirant'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSpotlightParticipant(null)}
                        className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-6 flex-1 flex items-center justify-center bg-black overflow-hidden">
                      {showWhiteboard ? (
                        <div className="w-full h-[65vh] bg-white rounded-2xl overflow-hidden relative flex flex-col">
                          <canvas
                            id={`wb-canvas-spotlight-${uid}`}
                            ref={(el) => {
                              if (el && wbData?.strokes) {
                                el.width = 1200;
                                el.height = 675;
                                const ctx = el.getContext('2d');
                                if (ctx) {
                                  ctx.fillStyle = '#ffffff';
                                  ctx.fillRect(0, 0, el.width, el.height);
                                  wbData.strokes.forEach((s: any) => {
                                    ctx.lineWidth = s.size;
                                    ctx.lineCap = 'round';
                                    ctx.strokeStyle = s.color;
                                    ctx.beginPath();
                                    ctx.moveTo(s.x0, s.y0);
                                    ctx.lineTo(s.x1, s.y1);
                                    ctx.stroke();
                                  });
                                }
                              }
                            }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : isMe && (isCameraOn || isScreenSharing) ? (
                        <video
                          ref={(el) => {
                            if (el && localVideoRef.current?.srcObject) {
                              el.srcObject = localVideoRef.current.srcObject;
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-[65vh] object-contain rounded-2xl"
                        />
                      ) : (
                        <div className="text-center py-20 text-slate-400 space-y-4">
                          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold mx-auto border border-slate-700 text-slate-200">
                            {p.photoURL ? <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover rounded-full" /> : <span>{(p.fullName || 'S')[0]}</span>}
                          </div>
                          <h4 className="text-xl font-bold text-white">{p.fullName}'s Camera is Off</h4>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* My Whiteboard Drawing Canvas Section if Open */}
            {isMyWhiteboardActive && (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-3xl border border-blue-500 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Professional HD Whiteboard Controls:</span>
                    <button
                      onClick={() => setTool('pen')}
                      className={`p-2 rounded-xl transition-all ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}
                      title="Pen Tool"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTool('eraser')}
                      className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}
                      title="Eraser"
                    >
                      <Eraser className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-1.5 ml-2">
                      {['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#000000'].map(c => (
                        <button
                          key={c}
                          onClick={() => { setBrushColor(c); setTool('pen'); }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${brushColor === c && tool === 'pen' ? 'scale-110 border-white shadow' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <select
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <option value={2}>Fine</option>
                      <option value={4}>Medium</option>
                      <option value={8}>Bold</option>
                    </select>
                  </div>

                  <button
                    onClick={clearMyWhiteboard}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear My Board</span>
                  </button>
                </div>

                <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner bg-white cursor-crosshair">
                  <canvas
                    ref={myCanvasRef}
                    width={1200}
                    height={675}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="w-full h-[380px] object-contain touch-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* Media & Whiteboard Controls Bar */}
            <div className="flex items-center justify-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto flex-wrap gap-3">
              <button
                onClick={toggleCamera}
                className={`p-3.5 rounded-2xl transition-all shadow-sm flex items-center space-x-2 ${
                  isCameraOn 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                <span className="text-sm font-semibold hidden sm:inline">{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-2xl transition-all shadow-sm flex items-center space-x-2 ${
                  isMicOn 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                title={isMicOn ? "Mute Mic" : "Unmute Mic"}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                <span className="text-sm font-semibold hidden sm:inline">{isMicOn ? 'Mic On' : 'Muted'}</span>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3.5 rounded-2xl transition-all shadow-sm flex items-center space-x-2 ${
                  isScreenSharing 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
              >
                {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
                <span className="text-sm font-semibold hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
              </button>

              <button
                onClick={toggleMyWhiteboard}
                className={`p-3.5 rounded-2xl transition-all shadow-sm flex items-center space-x-2 font-bold ${
                  isMyWhiteboardActive 
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/30' 
                    : 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-700 border border-purple-300 dark:border-purple-800'
                }`}
                title={isMyWhiteboardActive ? "Close My Whiteboard" : "Open My Whiteboard"}
              >
                <Pencil className="w-5 h-5" />
                <span className="text-sm font-semibold">{isMyWhiteboardActive ? 'Close Whiteboard' : 'Open Whiteboard'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Pomodoro & Focus */}
        {activeTab === 'pomodoro' && (
          <div className="p-12 text-center max-w-xl mx-auto space-y-8">
            <div className="inline-block p-4 bg-blue-50 dark:bg-blue-950/30 rounded-full text-blue-600 dark:text-blue-400 mb-2">
              <Sparkles className="w-10 h-10 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {isBreak ? "Break Time ☕" : "Focus Session 🎯"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {isBreak ? "Relax, stretch your legs, and hydrate before the next session." : "Deep work mode. Stay consistent and crush your JEE targets."}
              </p>
            </div>

            <div className="w-64 h-64 rounded-full border-8 border-blue-600/20 flex flex-col items-center justify-center mx-auto shadow-2xl relative bg-gradient-to-br from-blue-500/5 to-indigo-500/10">
              <div className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white font-mono tracking-wider">
                {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-2">
                {isBreak ? "Resting" : "Studying"}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setIsPomodoroActive(!isPomodoroActive)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center space-x-2 text-lg"
              >
                {isPomodoroActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                <span>{isPomodoroActive ? "Pause Timer" : "Start Focus"}</span>
              </button>
              <button
                onClick={() => {
                  setIsPomodoroActive(false);
                  setPomodoroMinutes(25);
                  setPomodoroSeconds(0);
                  setIsBreak(false);
                }}
                className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                title="Reset Timer"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-left">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Lo-Fi Ambient Focus Beats</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Calming background audio for deep concentration</p>
                </div>
              </div>
              <button
                onClick={toggleAmbientMusic}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  isPlayingMusic ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPlayingMusic ? 'Pause Music' : 'Play Music'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
