import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Gauge,
  FastForward,
  Rewind,
} from 'lucide-react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<any> | null = null;

function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve(window.YT);
    };

    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    } else {
      const checkTimer = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkTimer);
          resolve(window.YT);
        }
      }, 150);
    }
  });

  return ytApiPromise;
}

interface EduTubeYouTubePlayerProps {
  youtubeId: string;
  title: string;
  thumbnailUrl?: string;
  isShort?: boolean;
  isMutedExternal?: boolean;
  onToggleMuteExternal?: () => void;
}

export default function EduTubeYouTubePlayer({
  youtubeId,
  title,
  thumbnailUrl,
  isShort = false,
  isMutedExternal,
  onToggleMuteExternal,
}: EduTubeYouTubePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mountNodeRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(Boolean(isMutedExternal));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);

  const posterImage =
    thumbnailUrl && !thumbnailUrl.startsWith('data:image/svg+xml')
      ? thumbnailUrl
      : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

  useEffect(() => {
    let destroyed = false;
    setIsReady(false);
    setIsPlaying(false);
    setIsEnded(false);
    setCurrentTime(0);
    setDuration(0);

    loadYouTubeIframeApi().then((YT) => {
      if (destroyed || !YT || !mountNodeRef.current) return;

      // Clear mount node and create a fresh child div for YT.Player
      mountNodeRef.current.innerHTML = '';
      const playerDiv = document.createElement('div');
      mountNodeRef.current.appendChild(playerDiv);

      try {
        playerRef.current = new YT.Player(playerDiv, {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              setIsReady(true);
              const totalDur = Number(event.target?.getDuration?.() || 0);
              if (totalDur > 0) setDuration(totalDur);
              if (isMutedExternal) {
                event.target?.mute?.();
                setIsMuted(true);
              } else {
                event.target?.unMute?.();
                setIsMuted(false);
              }
              event.target?.playVideo?.();
            },
            onStateChange: (event: any) => {
              if (destroyed || !window.YT) return;
              const state = event.data;
              const totalDur = Number(event.target?.getDuration?.() || 0);
              if (totalDur > 0) setDuration(totalDur);

              if (state === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsEnded(false);
              } else if (state === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (state === window.YT.PlayerState.ENDED) {
                if (isShort) {
                  event.target?.seekTo?.(0, true);
                  event.target?.playVideo?.();
                } else {
                  setIsPlaying(false);
                  setIsEnded(true);
                }
              }
            },
          },
        });
      } catch (e) {
        console.warn('YT.Player init error:', e);
      }
    });

    return () => {
      destroyed = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
      playerRef.current = null;
    };
  }, [youtubeId, isShort]);

  // Sync external mute prop (for Shorts header mute toggle)
  useEffect(() => {
    if (typeof isMutedExternal !== 'boolean' || !playerRef.current || !isReady) return;
    try {
      if (isMutedExternal) {
        playerRef.current.mute?.();
        setIsMuted(true);
      } else {
        playerRef.current.unMute?.();
        setIsMuted(false);
      }
    } catch {
      // ignore
    }
  }, [isMutedExternal, isReady]);

  // Poll progress every 250ms and intercept last 0.6s so YouTube's end-screen related videos NEVER appear
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;
      try {
        const cur = Number(p.getCurrentTime() || 0);
        const dur = Number(p.getDuration() || 0);
        setCurrentTime(cur);
        if (dur > 0) {
          setDuration(dur);
          if (cur >= dur - 0.65 && dur > 2) {
            if (isShort) {
              p.seekTo(0, true);
              p.playVideo();
            } else {
              p.pauseVideo();
              p.seekTo(0, true);
              setIsPlaying(false);
              setIsEnded(true);
            }
          }
        }
      } catch {
        // ignore
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isReady, isShort]);

  const triggerShowControls = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3200);
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const p = playerRef.current;
    if (!p) return;
    try {
      if (isEnded) {
        p.seekTo(0, true);
        p.playVideo();
        setIsEnded(false);
        setIsPlaying(true);
      } else if (isPlaying) {
        p.pauseVideo();
        setIsPlaying(false);
      } else {
        p.playVideo();
        setIsPlaying(true);
      }
      triggerShowControls();
    } catch {
      // ignore
    }
  };

  const handleSkip = (deltaSeconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = playerRef.current;
    if (!p || !duration) return;
    const next = Math.max(0, Math.min(duration - 1, currentTime + deltaSeconds));
    p.seekTo(next, true);
    setCurrentTime(next);
    if (!isPlaying) {
      p.playVideo();
      setIsPlaying(true);
      setIsEnded(false);
    }
    triggerShowControls();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    setCurrentTime(next);
    const p = playerRef.current;
    if (p && typeof p.seekTo === 'function') {
      p.seekTo(next, true);
      if (isEnded) {
        p.playVideo();
        setIsEnded(false);
        setIsPlaying(true);
      }
    }
    triggerShowControls();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleMuteExternal) {
      onToggleMuteExternal();
      return;
    }
    const p = playerRef.current;
    if (!p) return;
    try {
      if (isMuted) {
        p.unMute();
        setIsMuted(false);
      } else {
        p.mute();
        setIsMuted(true);
      }
    } catch {
      // ignore
    }
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    try {
      playerRef.current?.setPlaybackRate?.(next);
    } catch {
      // ignore
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={wrapperRef}
      onClick={() => handleTogglePlay()}
      onMouseMove={triggerShowControls}
      onTouchStart={triggerShowControls}
      className="relative w-full h-full bg-black overflow-hidden select-none cursor-pointer group"
    >
      {/* YouTube IFrame with Vertical Overscan & pointer-events-none so YouTube UI/Logo/Links are 100% hidden & unclickable */}
      <div
        ref={mountNodeRef}
        className="absolute inset-x-0 -top-[22%] h-[144%] w-full pointer-events-none"
      />

      {/* EduTube Branded Pause / End / Loading Shield - Completely hides YouTube's "More Videos" popup when paused or ended! */}
      {(!isPlaying || isEnded || !isReady) && (
        <div
          onClick={(e) => handleTogglePlay(e)}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-200"
        >
          <img
            src={posterImage}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/70" />

          {/* Top EduTube Original Player Badge */}
          <div className="absolute top-3.5 left-4 flex items-center gap-2 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-extrabold tracking-tight shadow-lg shadow-red-600/30">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>EduTube</span>
            </div>
            <span className="text-xs font-semibold text-white/80 line-clamp-1 max-w-[240px] sm:max-w-md">
              {title}
            </span>
          </div>

          {/* Center Play / Resume / Replay Button */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleTogglePlay(e)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 border-2 border-white/25 transition-transform active:scale-95 hover:scale-105"
            >
              {isEnded ? (
                <RotateCcw className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white fill-current ml-1" />
              )}
            </button>
            <span className="px-3 py-1 rounded-full bg-black/65 border border-white/15 text-white text-xs font-bold tracking-wide">
              {!isReady
                ? 'Loading EduTube Stream...'
                : isEnded
                ? 'Replay Video on EduTube'
                : 'Paused · Tap to Resume'}
            </span>
          </div>
        </div>
      )}

      {/* Custom EduTube Control Bar for 16:9 Videos */}
      {!isShort && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-8 pb-3 px-3 sm:px-4 transition-opacity duration-200 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {/* Interactive Progress / Seek Bar */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[11px] font-mono font-semibold text-white/90 shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-[11px] font-mono font-semibold text-white/75 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Bottom Controls Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleSkip(-10, e)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/85 hover:text-white transition-colors flex items-center gap-0.5 text-[11px] font-bold"
                title="Rewind 10s"
              >
                <Rewind className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">10s</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleSkip(10, e)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/85 hover:text-white transition-colors flex items-center gap-0.5 text-[11px] font-bold"
                title="Forward 10s"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">10s</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
                title="Playback Speed"
              >
                <Gauge className="w-3 h-3 text-red-400" />
                {playbackRate}x
              </button>

              {/* EduTube Official Brand Badge in place of YouTube Icon */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-extrabold tracking-tight shadow-sm">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>EduTube</span>
              </div>

              <button
                type="button"
                onClick={handleFullscreen}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
