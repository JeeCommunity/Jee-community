import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  RefreshCw,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  StopCircle,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateEduTubeVideoRecord, uploadMediaToEduTubeCloud } from '../lib/edutube';

interface EduTubeLiveRoomPlayerProps {
  videoId: string;
  roomId: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  thumbnailUrl?: string;
  isHost: boolean;
  onEndLiveStream?: (saveReplay: boolean, recordedVideoUrl?: string, durationFormatted?: string) => void;
}

function getCleanPeerId(roomId: string): string {
  const clean = roomId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `edutubelive_${clean.slice(0, 42)}`;
}

export default function EduTubeLiveRoomPlayer({
  videoId,
  roomId,
  title,
  hostName,
  hostAvatar,
  thumbnailUrl,
  isHost,
  onEndLiveStream,
}: EduTubeLiveRoomPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const activeCallsRef = useRef<MediaConnection[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connectedPeersCount, setConnectedPeersCount] = useState(0);
  const [isSavingReplay, setIsSavingReplay] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Viewer states
  const [viewerConnectedStream, setViewerConnectedStream] = useState(false);
  const [isViewerMuted, setIsViewerMuted] = useState(false);
  const [needsUserPlayGesture, setNeedsUserPlayGesture] = useState(false);

  const hostPeerId = getCleanPeerId(roomId || videoId);

  // Format elapsed time MM:SS
  const formatElapsed = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Start or switch camera stream for Host
  const startHostCamera = async (targetFacing: 'user' | 'environment') => {
    setCameraError(null);
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      localStreamRef.current = stream;
      setIsScreenSharing(false);
      setIsCamOn(true);
      setIsMicOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }

      // Replace tracks for any connected viewers
      activeCallsRef.current.forEach((call) => {
        const senders = call.peerConnection?.getSenders() || [];
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        senders.forEach((sender) => {
          if (sender.track?.kind === 'video' && videoTrack) {
            sender.replaceTrack(videoTrack).catch(() => {});
          }
          if (sender.track?.kind === 'audio' && audioTrack) {
            sender.replaceTrack(audioTrack).catch(() => {});
          }
        });
      });

      startRecordingStream(stream);
    } catch (err: any) {
      setCameraError(
        'Camera/Mic permission required. Please allow Camera & Microphone access in your browser.'
      );
    }
  };

  // Record host stream in background so host can save replay to channel when ending live
  const startRecordingStream = (stream: MediaStream) => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(2000);
      mediaRecorderRef.current = recorder;
    } catch {
      // MediaRecorder optional fallback
    }
  };

  // 1. HOST SETUP: Start Camera + PeerJS Broadcast Server + Live Thumbnail Sync
  useEffect(() => {
    if (!isHost) return;

    let mounted = true;
    recordedChunksRef.current = [];

    startHostCamera(facingMode);

    const peer = new Peer(hostPeerId, {
      debug: 0,
    });
    peerRef.current = peer;

    peer.on('connection', (conn) => {
      conn.on('data', (data: any) => {
        if (data && data.type === 'REQUEST_LIVE_STREAM' && data.viewerPeerId && localStreamRef.current) {
          const call = peer.call(data.viewerPeerId, localStreamRef.current);
          if (call) {
            activeCallsRef.current.push(call);
            if (mounted) {
              setConnectedPeersCount(activeCallsRef.current.length);
            }
            call.on('close', () => {
              activeCallsRef.current = activeCallsRef.current.filter((c) => c !== call);
              if (mounted) {
                setConnectedPeersCount(activeCallsRef.current.length);
              }
            });
          }
        }
      });
    });

    peer.on('call', (incomingCall) => {
      if (localStreamRef.current) {
        incomingCall.answer(localStreamRef.current);
        activeCallsRef.current.push(incomingCall);
        if (mounted) {
          setConnectedPeersCount(activeCallsRef.current.length);
        }
      }
    });

    // Live elapsed timer
    const timerInterval = setInterval(() => {
      if (mounted) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    // Every 3.5 seconds, capture a live frame and sync to Supabase `thumbnail_url` so viewers & feed cards see the live camera frame
    const snapshotInterval = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || !vid.videoWidth) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.62);
        if (frameDataUrl && frameDataUrl.startsWith('data:image/jpeg')) {
          updateEduTubeVideoRecord(videoId, {
            thumbnail_url: frameDataUrl,
          } as any).catch(() => {});
        }
      } catch {
        // ignore frame capture errors
      }
    }, 3500);

    return () => {
      mounted = false;
      clearInterval(timerInterval);
      clearInterval(snapshotInterval);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      activeCallsRef.current.forEach((c) => {
        try {
          c.close();
        } catch {}
      });
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {}
      }
    };
  }, [isHost, hostPeerId]);

  // 2. VIEWER SETUP: Connect to Host PeerJS & Receive Real-Time Video + Audio Stream
  useEffect(() => {
    if (isHost) return;

    let mounted = true;
    let retryTimer: any = null;

    const viewerPeer = new Peer({ debug: 0 });
    peerRef.current = viewerPeer;

    const attachRemoteStream = (remoteStream: MediaStream) => {
      if (!mounted) return;
      setViewerConnectedStream(true);
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.muted = isViewerMuted;
        videoRef.current.play().catch(() => {
          setNeedsUserPlayGesture(true);
        });
      }
    };

    const connectToHost = () => {
      if (!viewerPeer || viewerPeer.destroyed || !viewerPeer.id) return;

      // Method A: Ask host to call us with their MediaStream
      const conn = viewerPeer.connect(hostPeerId, { reliable: true });
      conn.on('open', () => {
        conn.send({
          type: 'REQUEST_LIVE_STREAM',
          viewerPeerId: viewerPeer.id,
        });
      });

      // Method B: Also initiate a call with a silent/canvas dummy stream in case host answers directly
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const dummyStream = (canvas as any).captureStream ? (canvas as any).captureStream(1) : null;
        if (dummyStream) {
          const call = viewerPeer.call(hostPeerId, dummyStream);
          if (call) {
            call.on('stream', (remoteStream) => {
              attachRemoteStream(remoteStream);
            });
          }
        }
      } catch {
        // ignore fallback
      }
    };

    viewerPeer.on('open', () => {
      connectToHost();
      retryTimer = setInterval(() => {
        if (mounted && !viewerConnectedStream) {
          connectToHost();
        }
      }, 4000);
    });

    viewerPeer.on('call', (incomingCall) => {
      incomingCall.answer();
      incomingCall.on('stream', (remoteStream) => {
        attachRemoteStream(remoteStream);
      });
    });

    return () => {
      mounted = false;
      if (retryTimer) clearInterval(retryTimer);
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {}
      }
    };
  }, [isHost, hostPeerId]);

  const handleToggleMic = () => {
    if (!localStreamRef.current) return;
    const next = !isMicOn;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setIsMicOn(next);
  };

  const handleToggleCam = () => {
    if (!localStreamRef.current) return;
    const next = !isCamOn;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setIsCamOn(next);
  };

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startHostCamera(nextFacing);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      startHostCamera(facingMode);
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const screenVideoTrack = displayStream.getVideoTracks()[0];
      if (!screenVideoTrack) return;

      screenVideoTrack.onended = () => {
        startHostCamera(facingMode);
      };

      // Keep mic audio from camera stream if available
      const audioTracks = localStreamRef.current ? localStreamRef.current.getAudioTracks() : [];
      const combined = new MediaStream([screenVideoTrack, ...audioTracks]);
      localStreamRef.current = combined;
      setIsScreenSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = combined;
        videoRef.current.play().catch(() => {});
      }

      activeCallsRef.current.forEach((call) => {
        const senders = call.peerConnection?.getSenders() || [];
        senders.forEach((sender) => {
          if (sender.track?.kind === 'video') {
            sender.replaceTrack(screenVideoTrack).catch(() => {});
          }
        });
      });
    } catch {
      toast.error('Screen sharing cancelled or not supported on this device');
    }
  };

  const handleHostFinishAndSaveReplay = async (saveReplay: boolean) => {
    if (!onEndLiveStream) return;

    if (!saveReplay || recordedChunksRef.current.length === 0) {
      onEndLiveStream(false);
      return;
    }

    setIsSavingReplay(true);
    const toastId = toast.loading('Uploading recorded Live Replay to your channel...');
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      await new Promise((r) => setTimeout(r, 400));
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const uploaded = await uploadMediaToEduTubeCloud(
        blob,
        `live_replay_${videoId}.webm`,
        'videos'
      );
      toast.success('Live Replay saved to your channel!', { id: toastId });
      onEndLiveStream(true, uploaded.url, formatElapsed(elapsedSeconds || 60));
    } catch {
      toast.dismiss(toastId);
      onEndLiveStream(false);
    } finally {
      setIsSavingReplay(false);
    }
  };

  const handleToggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-slate-950 overflow-hidden select-none flex flex-col justify-between"
    >
      {/* Main Video Surface */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isHost ? true : isViewerMuted}
        poster={thumbnailUrl}
        className={`absolute inset-0 w-full h-full object-contain bg-black ${
          isHost && facingMode === 'user' && !isScreenSharing ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Fallback Live Frame Image for Viewers while WebRTC connects */}
      {!isHost && !viewerConnectedStream && thumbnailUrl && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-white p-4 text-center">
            <div className="px-3.5 py-2 rounded-full bg-black/75 backdrop-blur-md border border-red-500/40 flex items-center gap-2 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold">
                Connected to {hostName}&apos;s Live Stream
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Tap-to-Unmute / Play Overlay if browser blocked autoplay with sound */}
      {!isHost && needsUserPlayGesture && (
        <div
          onClick={() => {
            setNeedsUserPlayGesture(false);
            if (videoRef.current) {
              videoRef.current.muted = false;
              setIsViewerMuted(false);
              videoRef.current.play().catch(() => {});
            }
          }}
          className="absolute inset-0 z-30 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer text-white"
        >
          <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-2xl mb-2">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/70">
            Tap to Watch Live with Audio
          </span>
        </div>
      )}

      {/* Host Camera Permission Error Overlay */}
      {isHost && cameraError && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white">
          <VideoOff className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-sm font-bold max-w-md">{cameraError}</p>
          <button
            type="button"
            onClick={() => startHostCamera(facingMode)}
            className="mt-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold"
          >
            Retry Camera &amp; Mic
          </button>
        </div>
      )}

      {/* Top Live Overlay Bar */}
      <div className="relative z-20 p-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{isHost ? 'LIVE STUDIO (YOU ARE LIVE)' : 'LIVE'}</span>
          </span>

          {isHost && (
            <span className="px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-md border border-white/15 text-white text-[11px] font-mono tabular-nums">
              {formatElapsed(elapsedSeconds)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-bold tracking-wide shadow">
            ▶ EduTube Live
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-wrap items-center justify-between gap-2">
        {isHost ? (
          <>
            {/* Host Camera / Mic / Flip / Screen Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isMicOn
                    ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                    : 'bg-red-600 text-white border-red-500'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isMicOn ? 'Mic On' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleCam}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isCamOn
                    ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                    : 'bg-red-600 text-white border-red-500'
                }`}
                title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isCamOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Switch Front / Back Camera"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Flip Cam</span>
              </button>

              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isScreenSharing
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                }`}
                title="Share Screen"
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isScreenSharing ? 'Stop Screen' : 'Share Screen'}
                </span>
              </button>
            </div>

            {/* Host End & Save Replay Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSavingReplay}
                onClick={() => handleHostFinishAndSaveReplay(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                title="End Live & Upload Recording to Channel"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>{isSavingReplay ? 'Saving...' : 'End & Save Video'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </>
        ) : (
          /* Viewer Controls */
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isViewerMuted;
                  setIsViewerMuted(nextMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = nextMuted;
                  }
                }}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center gap-1.5 text-xs font-semibold"
              >
                {isViewerMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>{isViewerMuted ? 'Unmute' : 'Live Audio'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
