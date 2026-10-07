import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  BookOpen, Users, Clock, Play, Pause, RotateCcw, 
  Volume2, VolumeX, Sparkles, Pencil, Eraser, Trash2, Shield, Radio, CheckCircle, MessageSquare, LogOut, PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DigitalLibrary() {
  const { user, profile } = useAuth();
  const [isInRoom, setIsInRoom] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  
  // Media states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'pomodoro'>('video');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Pomodoro states
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Ambient music states
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Whiteboard states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const strokesRef = useRef<any[]>([]);

  // Sync presence in Firestore when in room using metadata collection
  useEffect(() => {
    if (!user || !profile || !isInRoom) return;
    const roomRef = doc(db, 'metadata', 'digital_library_participants_' + user.uid);

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
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Error updating presence:", e);
      }
    };

    updatePresence();

    const heartbeat = setInterval(updatePresence, 10000);

    const participantsRef = collection(db, 'metadata');
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id.startsWith('digital_library_participants_')) {
          list.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
      setParticipants(list);
    });

    return () => {
      clearInterval(heartbeat);
      unsubscribe();
      deleteDoc(roomRef).catch(() => {});
    };
  }, [user, isInRoom, isCameraOn, isMicOn, isScreenSharing]);

  // Real-time Collaborative Whiteboard Sync via Firestore
  useEffect(() => {
    if (!isInRoom) return;
    const wbRef = doc(db, 'metadata', 'digital_library_shared_whiteboard');

    const unsubscribe = onSnapshot(wbRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.strokes)) {
          strokesRef.current = data.strokes;
          redrawCanvas(data.strokes);
        }
      }
    });

    return () => unsubscribe();
  }, [isInRoom]);

  const redrawCanvas = (strokes: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(s => {
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x1, s.y1);
      ctx.stroke();
    });
  };

  const publishStroke = async (stroke: { x0: number; y0: number; x1: number; y1: number; color: string; size: number }) => {
    try {
      const wbRef = doc(db, 'metadata', 'digital_library_shared_whiteboard');
      const updatedStrokes = [...strokesRef.current, stroke].slice(-500); // keep last 500 strokes
      await setDoc(wbRef, { strokes: updatedStrokes, lastUpdated: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error("Error syncing stroke:", e);
    }
  };

  const clearCanvasRemote = async () => {
    try {
      const wbRef = doc(db, 'metadata', 'digital_library_shared_whiteboard');
      await setDoc(wbRef, { strokes: [], lastUpdated: serverTimestamp() }, { merge: true });
      toast.success("Whiteboard cleared for everyone");
    } catch (e) {
      toast.error("Failed to clear whiteboard");
    }
  };

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
      toast("You can turn on your camera and mic anytime using the button inside the video box.", { icon: '💡' });
    }
  };

  const handleLeaveMeet = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (user) {
      const roomRef = doc(db, 'metadata', 'digital_library_participants_' + user.uid);
      deleteDoc(roomRef).catch(() => {});
    }
    setIsInRoom(false);
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
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
          toast.error("Screen sharing is not supported on this browser or mobile device. Please use Desktop Chrome/Edge/Firefox.");
          return;
        }
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          toast.success("Screen sharing stopped");
        };
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        setIsScreenSharing(false);
      }
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.message?.includes('Permission denied')) {
        toast.error("Screen sharing was cancelled or permission denied.");
      } else {
        toast.error("Screen sharing is not supported or cancelled on this device/browser.");
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

  // Whiteboard drawing functions
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 500;
      redrawCanvas(strokesRef.current);
    }
  }, [activeTab]);

  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastPosRef.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const stroke = {
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: x,
      y1: y,
      color: tool === 'eraser' ? '#ffffff' : brushColor,
      size: tool === 'eraser' ? brushSize * 4 : brushSize
    };

    lastPosRef.current = { x, y };
    publishStroke(stroke);
  };

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
              Connect with fellow JEE aspirants in real-time. Share your camera, collaborate on the shared whiteboard with live sync, share your screen, and study together.
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
              onClick={() => setActiveTab('whiteboard')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'whiteboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>Shared Whiteboard (Live Sync)</span>
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

        {/* Tab 1: Video & Participants */}
        {activeTab === 'video' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center border border-slate-800">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraOn || isScreenSharing ? 'block' : 'hidden'}`}
                />
                {!isCameraOn && !isScreenSharing && (
                  <div className="text-center p-6 text-slate-400 space-y-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800 text-blue-500 shadow-md">
                      <VideoOff className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Camera & Mic are Off</h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mb-3">
                        Click below to allow browser permissions and start video.
                      </p>
                      <button
                        onClick={toggleCamera}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg transition-all"
                      >
                        Allow Camera & Mic
                      </button>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{profile?.fullName || user?.email || 'You'} (You)</span>
                </div>
              </div>

              {/* Media Controls */}
              <div className="flex items-center justify-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={toggleCamera}
                  className={`p-4 rounded-2xl transition-all shadow-sm flex items-center space-x-2 ${
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
                  className={`p-4 rounded-2xl transition-all shadow-sm flex items-center space-x-2 ${
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
                  className={`p-4 rounded-2xl transition-all shadow-sm flex items-center space-x-2 ${
                    isScreenSharing 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                >
                  {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
                  <span className="text-sm font-semibold hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
                </button>
              </div>
            </div>

            {/* Participants Sidebar */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Joined Participants ({participants.length})</span>
              </h3>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden border border-blue-400">
                        {p.photoURL ? (
                          <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(p.fullName || 'S')[0]}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.fullName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">@{p.username || 'aspirant'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {p.isCameraOn && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Camera On"></span>}
                      {p.isMicOn && <span className="w-2 h-2 rounded-full bg-blue-500" title="Mic On"></span>}
                      {p.isScreenSharing && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-semibold">Screen</span>}
                    </div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No active aspirants in the meet currently.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Shared Whiteboard (Live Sync) */}
        {activeTab === 'whiteboard' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setTool('pen')}
                  className={`p-2.5 rounded-xl transition-all ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}
                  title="Pen Tool"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`p-2.5 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}
                  title="Eraser"
                >
                  <Eraser className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

                <div className="flex items-center space-x-2">
                  {['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#000000'].map(c => (
                    <button
                      key={c}
                      onClick={() => { setBrushColor(c); setTool('pen'); }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${brushColor === c && tool === 'pen' ? 'scale-110 border-white shadow-md' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

                <select
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value={2}>Fine (2px)</option>
                  <option value={4}>Medium (4px)</option>
                  <option value={8}>Bold (8px)</option>
                </select>
              </div>

              <button
                onClick={clearCanvasRemote}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 font-semibold text-sm flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear for Everyone</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-white cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full touch-none"
              />
            </div>
            <p className="text-xs text-center text-slate-400">
              ⚡ All strokes drawn here are synchronized in real time across all connected study table members.
            </p>
          </div>
        )}

        {/* Tab 3: Pomodoro & Focus */}
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
