import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import EduTubeVastAdPlayer from './EduTubeVastAdPlayer';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(Boolean(isMutedExternal));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState(true);
  const [showMidRollAd, setShowMidRollAd] = useState(false);
  const midRollTriggeredRef = useRef<boolean>(false);
  const hideControlsTimerRef = useRef<any>(null);

  const posterImage =
    thumbnailUrl && !thumbnailUrl.startsWith('data:image/svg+xml')
      ? thumbnailUrl
      : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

  // Direct YouTube embed URL with enablejsapi=1 so React owns the <iframe> 100%
  const embedSrc = useMemo(() => {
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: '1',
      controls: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      disablekb: '1',
      fs: '0',
      playsinline: '1',
    });
    if (isShort) {
      params.set('loop', '1');
      params.set('playlist', youtubeId);
    }
    return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  }, [youtubeId, isShort]);

  const sendPlayerCommand = (func: string, args: any[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    } catch {
      // ignore postMessage errors
    }
  };

  const registerIframeListener = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        JSON.stringify({
          event: 'listening',
          id: 1,
          channel: 'widget',
        }),
        '*'
      );
      sendPlayerCommand('addEventListener', ['onReady']);
      sendPlayerCommand('addEventListener', ['onStateChange']);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setIsReady(false);
    setIsPlaying(false);
    setIsEnded(false);
    setCurrentTime(0);
    setDuration(0);
    setShowMidRollAd(false);
    midRollTriggeredRef.current = false;

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }
      if (typeof event.data !== 'string') return;

      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!data) return;

      if (data.event === 'onReady' || data.event === 'initialDelivery') {
        setIsReady(true);
        if (isMutedExternal) {
          sendPlayerCommand('mute');
          setIsMuted(true);
        }
        sendPlayerCommand('playVideo');
      }

      if (data.event === 'infoDelivery' && data.info) {
        setIsReady(true);
        const info = data.info;

        if (typeof info.duration === 'number' && info.duration > 0) {
          setDuration(info.duration);
        }
        if (typeof info.currentTime === 'number') {
          setCurrentTime(info.currentTime);
        }
        if (typeof info.muted === 'boolean') {
          setIsMuted(info.muted);
        }

        if (typeof info.playerState === 'number') {
          // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
          if (info.playerState === 1 || info.playerState === 3) {
            setIsPlaying(true);
            setIsEnded(false);
          } else if (info.playerState === 2) {
            setIsPlaying(false);
          } else if (info.playerState === 0) {
            if (isShort) {
              sendPlayerCommand('seekTo', [0, true]);
              sendPlayerCommand('playVideo');
            } else {
              setIsPlaying(false);
              setIsEnded(true);
            }
          }
        }
      }

      if (data.event === 'onStateChange' && typeof data.info === 'number') {
        const state = data.info;
        if (state === 1 || state === 3) {
          setIsPlaying(true);
          setIsEnded(false);
        } else if (state === 2) {
          setIsPlaying(false);
        } else if (state === 0) {
          if (isShort) {
            sendPlayerCommand('seekTo', [0, true]);
            sendPlayerCommand('playVideo');
          } else {
            setIsPlaying(false);
            setIsEnded(true);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Periodically send listening handshake until ready
    const handshakeInterval = setInterval(() => {
      registerIframeListener();
    }, 600);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(handshakeInterval);
    };
  }, [youtubeId, isShort]);

  // Intercept the final 0.7s of the video so YouTube's end-screen related videos never show
  useEffect(() => {
    if (duration > 2 && currentTime >= duration - 0.75) {
      if (isShort) {
        sendPlayerCommand('seekTo', [0, true]);
        sendPlayerCommand('playVideo');
      } else if (!isEnded) {
        sendPlayerCommand('pauseVideo');
        sendPlayerCommand('seekTo', [0, true]);
        setIsPlaying(false);
        setIsEnded(true);
      }
    }

    // Automatic Mid-Roll Video Ad (Video ke beech me ad) for videos >= 2 mins at the 50% / 3-min mark
    const midRollPoint = Math.min(180, duration * 0.5);
    if (
      !isShort &&
      duration >= 120 &&
      !midRollTriggeredRef.current &&
      currentTime >= midRollPoint &&
      currentTime < midRollPoint + 4
    ) {
      midRollTriggeredRef.current = true;
      sendPlayerCommand('pauseVideo');
      setIsPlaying(false);
      setShowMidRollAd(true);
    }
  }, [currentTime, duration, isShort, isEnded]);

  // Sync external mute prop (for Shorts header mute toggle)
  useEffect(() => {
    if (typeof isMutedExternal !== 'boolean') return;
    if (isMutedExternal) {
      sendPlayerCommand('mute');
      setIsMuted(true);
    } else {
      sendPlayerCommand('unMute');
      setIsMuted(false);
    }
  }, [isMutedExternal]);

  const triggerShowControls = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3200);
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    registerIframeListener();
    if (isEnded) {
      sendPlayerCommand('seekTo', [0, true]);
      sendPlayerCommand('playVideo');
      setIsEnded(false);
      setIsPlaying(true);
    } else if (isPlaying) {
      sendPlayerCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendPlayerCommand('playVideo');
      setIsPlaying(true);
    }
    triggerShowControls();
  };

  const handleSkip = (deltaSeconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const maxDur = duration > 0 ? duration - 1 : currentTime + 60;
    const next = Math.max(0, Math.min(maxDur, currentTime + deltaSeconds));
    sendPlayerCommand('seekTo', [next, true]);
    setCurrentTime(next);
    if (!isPlaying) {
      sendPlayerCommand('playVideo');
      setIsPlaying(true);
      setIsEnded(false);
    }
    triggerShowControls();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    setCurrentTime(next);
    sendPlayerCommand('seekTo', [next, true]);
    if (isEnded || !isPlaying) {
      sendPlayerCommand('playVideo');
      setIsEnded(false);
      setIsPlaying(true);
    }
    triggerShowControls();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleMuteExternal) {
      onToggleMuteExternal();
      return;
    }
    if (isMuted) {
      sendPlayerCommand('unMute');
      setIsMuted(false);
    } else {
      sendPlayerCommand('mute');
      setIsMuted(true);
    }
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    sendPlayerCommand('setPlaybackRate', [next]);
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
      onMouseMove={triggerShowControls}
      onTouchStart={triggerShowControls}
      className="absolute inset-0 w-full h-full bg-black overflow-hidden select-none cursor-pointer group"
    >
      {/* Direct React <iframe> at 100% full container size so Android/iOS Chrome always renders the video track */}
      <iframe
        ref={iframeRef}
        src={embedSrc}
        title={title}
        onLoad={registerIframeListener}
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />

      {/* Transparent Click-Catcher over the video so tapping pauses/plays inside EduTube and never redirects to YouTube */}
      <div
        onClick={(e) => handleTogglePlay(e)}
        className="absolute inset-0 z-10 bg-transparent"
      />

      {/* Top EduTube Header Shield (blocks YouTube top channel/title bar & shows EduTube branding) */}
      {!isShort && (
        <div
          onClick={(e) => handleTogglePlay(e)}
          className={`absolute top-0 inset-x-0 z-20 px-3.5 py-2.5 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex items-center justify-between transition-opacity duration-200 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-extrabold tracking-tight shadow-sm shrink-0">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>EduTube</span>
            </div>
            <span className="text-xs font-semibold text-white/90 truncate">
              {title}
            </span>
          </div>
        </div>
      )}

      {/* Permanent Bottom-Right EduTube Watermark Shield (Covers YouTube's bottom-right watermark even when controls hide) */}
      {!isShort && isPlaying && !showControls && (
        <div
          onClick={(e) => handleTogglePlay(e)}
          className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/75 border border-white/15 text-white text-[10px] font-extrabold tracking-tight shadow-md"
        >
          <Play className="w-2.5 h-2.5 text-red-500 fill-red-500" />
          <span>EduTube</span>
        </div>
      )}

      {/* Mid-Roll Video Ad Overlay (Pauses video in the middle, plays skippable ad, then resumes automatically) */}
      {showMidRollAd && (
        <EduTubeVastAdPlayer
          isShort={false}
          onAdFinished={() => {
            setShowMidRollAd(false);
            sendPlayerCommand('playVideo');
            setIsPlaying(true);
          }}
        />
      )}

      {/* EduTube Branded Pause / End Shield - Completely hides YouTube's "More Videos / Related Videos" popup when paused or ended! */}
      {(!isPlaying || isEnded) && !showMidRollAd && (
        <div
          onClick={(e) => handleTogglePlay(e)}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md transition-opacity duration-150"
        >
          <img
            src={posterImage}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/75" />

          {/* Top EduTube Original Player Badge */}
          <div className="absolute top-3.5 left-4 right-4 flex items-center gap-2 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-extrabold tracking-tight shadow-lg shadow-red-600/30 shrink-0">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>EduTube</span>
            </div>
            <span className="text-xs font-semibold text-white/85 truncate">
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
            <span className="px-3 py-1 rounded-full bg-black/70 border border-white/15 text-white text-xs font-bold tracking-wide">
              {isEnded
                ? 'Replay Video on EduTube'
                : currentTime > 0
                ? 'Paused · Tap to Resume'
                : !isReady
                ? 'Tap to Play on EduTube'
                : 'Tap to Play'}
            </span>
          </div>
        </div>
      )}

      {/* Custom EduTube Control Bar for 16:9 Videos */}
      {!isShort && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-3 px-3 sm:px-4 transition-opacity duration-200 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {/* Interactive Progress / Seek Bar with YouTube-style Yellow Mid-Roll Marker */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[11px] font-mono font-semibold text-white/90 shrink-0">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              {duration >= 120 && !midRollTriggeredRef.current && (
                <span
                  style={{
                    left: `${Math.min(95, (Math.min(180, duration * 0.5) / duration) * 100)}%`,
                  }}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 pointer-events-none shadow"
                  title="Mid-roll Ad Break"
                />
              )}
            </div>
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
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
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
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-600/95 text-white text-[10px] font-extrabold tracking-tight shadow-sm">
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
