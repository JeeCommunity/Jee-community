import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, SkipForward, Volume2, VolumeX, Play } from 'lucide-react';

export const DEFAULT_EDUTUBE_VAST_URL =
  'https://crookedagreement.com/d/mwFvzEd.GVN/vVZnGXUm/AeGmI9_uoZWUylckVPXTzcH1lOgTCQzyWMxzLMrtONSzcUA5hN-DxIXzFNfwf';

interface ParsedVastAd {
  mediaUrl: string;
  clickThroughUrl: string;
  impressionUrls: string[];
  startTrackingUrls: string[];
  completeTrackingUrls: string[];
  skipSeconds: number;
}

interface EduTubeVastAdPlayerProps {
  vastTagUrl?: string;
  onAdFinished: () => void;
  isShort?: boolean;
}

function fireTrackingPixel(url: string) {
  if (!url) return;
  try {
    fetch(url, { mode: 'no-cors', credentials: 'include' }).catch(() => {});
  } catch {
    try {
      const img = new Image();
      img.src = url;
    } catch {}
  }
}

function parseVastXml(xmlText: string): ParsedVastAd | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const adNodes = Array.from(xmlDoc.getElementsByTagName('Ad'));
    if (adNodes.length === 0) return null;

    // Pick a random Ad node if multiple are returned in the VAST pod
    const chosenAd = adNodes[Math.floor(Math.random() * adNodes.length)] || adNodes[0];

    const mediaNodes = Array.from(chosenAd.getElementsByTagName('MediaFile'));
    if (mediaNodes.length === 0) return null;

    // Prefer MP4 (720p or 480p) for universal mobile + PC playback
    const mp4Nodes = mediaNodes.filter(
      (n) => (n.getAttribute('type') || '').toLowerCase() === 'video/mp4'
    );
    const candidateNodes = mp4Nodes.length > 0 ? mp4Nodes : mediaNodes;

    // Pick 720p or 480p MP4
    const preferredNode =
      candidateNodes.find((n) => n.getAttribute('height') === '480') ||
      candidateNodes.find((n) => n.getAttribute('height') === '720') ||
      candidateNodes[0];

    const mediaUrl = (preferredNode?.textContent || '').trim();
    if (!mediaUrl || !mediaUrl.startsWith('http')) return null;

    const clickNode = chosenAd.getElementsByTagName('ClickThrough')[0];
    const clickThroughUrl = (clickNode?.textContent || '').trim();

    const impressionUrls = Array.from(chosenAd.getElementsByTagName('Impression'))
      .map((n) => (n.textContent || '').trim())
      .filter((u) => u.startsWith('http'));

    const trackingNodes = Array.from(chosenAd.getElementsByTagName('Tracking'));
    const startTrackingUrls = trackingNodes
      .filter((n) => n.getAttribute('event') === 'start')
      .map((n) => (n.textContent || '').trim())
      .filter((u) => u.startsWith('http'));

    const completeTrackingUrls = trackingNodes
      .filter((n) => n.getAttribute('event') === 'complete')
      .map((n) => (n.textContent || '').trim())
      .filter((u) => u.startsWith('http'));

    // Standard YouTube-style 5-second skip countdown
    return {
      mediaUrl,
      clickThroughUrl,
      impressionUrls,
      startTrackingUrls,
      completeTrackingUrls,
      skipSeconds: 5,
    };
  } catch {
    return null;
  }
}

export default function EduTubeVastAdPlayer({
  vastTagUrl = DEFAULT_EDUTUBE_VAST_URL,
  onAdFinished,
  isShort = false,
}: EduTubeVastAdPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const impressionFiredRef = useRef(false);
  const startFiredRef = useRef(false);

  const [adData, setAdData] = useState<ParsedVastAd | null>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [skipRemaining, setSkipRemaining] = useState(5);

  useEffect(() => {
    let cancelled = false;
    impressionFiredRef.current = false;
    startFiredRef.current = false;

    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !adData) {
        onAdFinished();
      }
    }, 4000);

    async function loadVastAd() {
      try {
        let xmlText = '';

        // 1. Direct browser fetch (works natively on https://jee-community.netlify.app)
        try {
          const directRes = await fetch(vastTagUrl, {
            method: 'GET',
            credentials: 'include',
          });
          if (directRes.ok) {
            xmlText = await directRes.text();
          }
        } catch {
          // fallback to proxy if on preview domain
        }

        // 2. Fallback proxy for AI Studio preview domain
        if (!xmlText || !xmlText.includes('<VAST')) {
          const proxyRes = await fetch(
            `/api/vast-proxy?url=${encodeURIComponent(vastTagUrl)}`
          );
          if (proxyRes.ok) {
            xmlText = await proxyRes.text();
          }
        }

        if (cancelled) return;

        const parsed = parseVastXml(xmlText);
        if (!parsed) {
          clearTimeout(safetyTimeout);
          onAdFinished();
          return;
        }

        clearTimeout(safetyTimeout);
        setAdData(parsed);
        setSkipRemaining(parsed.skipSeconds);
        setLoadingAd(false);
      } catch {
        clearTimeout(safetyTimeout);
        if (!cancelled) onAdFinished();
      }
    }

    loadVastAd();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [vastTagUrl]);

  // Play the VAST video once adData is ready
  useEffect(() => {
    if (!adData || !videoRef.current) return;
    const vid = videoRef.current;
    vid.muted = false;
    setIsMuted(false);

    vid.play().catch(() => {
      // If browser blocks unmuted autoplay, play muted immediately so ad never stalls
      vid.muted = true;
      setIsMuted(true);
      vid.play().catch(() => {
        setNeedsTapToPlay(true);
      });
    });
  }, [adData]);

  const handleVideoPlay = () => {
    if (!adData) return;
    if (!impressionFiredRef.current) {
      impressionFiredRef.current = true;
      adData.impressionUrls.forEach(fireTrackingPixel);
    }
    if (!startFiredRef.current) {
      startFiredRef.current = true;
      adData.startTrackingUrls.forEach(fireTrackingPixel);
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const cur = vid.currentTime || 0;
    const dur = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 15;
    setCurrentTime(cur);
    setDuration(dur);

    const remSkip = Math.max(0, Math.ceil((adData?.skipSeconds || 5) - cur));
    setSkipRemaining(remSkip);
  };

  const handleAdComplete = () => {
    if (adData) {
      adData.completeTrackingUrls.forEach(fireTrackingPixel);
    }
    onAdFinished();
  };

  const handleVisitAdvertiser = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adData?.clickThroughUrl) return;
    const a = document.createElement('a');
    a.href = adData.clickThroughUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loadingAd || !adData) {
    return (
      <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center text-white">
        <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-[11px] font-semibold text-white/80 tracking-wide">
          Loading Video...
        </span>
      </div>
    );
  }

  const remainingTotal = Math.max(0, Math.ceil(duration - currentTime));
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="absolute inset-0 z-40 bg-black select-none overflow-hidden flex flex-col justify-between">
      {/* VAST Ad Video Element */}
      <video
        ref={videoRef}
        src={adData.mediaUrl}
        playsInline
        autoPlay
        muted={isMuted}
        onPlay={handleVideoPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAdComplete}
        onError={() => onAdFinished()}
        onClick={handleVisitAdvertiser}
        className={`absolute inset-0 w-full h-full cursor-pointer ${
          isShort ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Tap to Play fallback if browser blocked even muted autoplay */}
      {needsTapToPlay && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setNeedsTapToPlay(false);
            videoRef.current?.play().catch(() => onAdFinished());
          }}
          className="absolute inset-0 z-30 bg-black/60 flex flex-col items-center justify-center cursor-pointer text-white"
        >
          <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl">
            <Play className="w-7 h-7 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Top Bar: Ad Badge + Countdown + Mute Toggle */}
      <div className="relative z-20 p-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider shadow">
            Ad
          </span>
          <span className="text-xs font-semibold text-white drop-shadow font-mono tabular-nums">
            0:{remainingTotal < 10 ? `0${remainingTotal}` : remainingTotal}
          </span>
          <span className="text-[11px] text-white/75 hidden sm:inline">· Sponsored</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const next = !isMuted;
            setIsMuted(next);
            if (videoRef.current) {
              videoRef.current.muted = next;
            }
          }}
          className="p-2 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/15 transition-colors"
          title={isMuted ? 'Unmute Ad' : 'Mute Ad'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-amber-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Bottom Bar: Visit Advertiser Button + Skip Ad Button + Yellow Progress Bar */}
      <div className="relative z-20">
        <div className="p-3 pb-4 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          {adData.clickThroughUrl ? (
            <button
              type="button"
              onClick={handleVisitAdvertiser}
              className="px-3.5 py-2 rounded-lg bg-blue-600/95 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg border border-white/15 transition-transform active:scale-95"
            >
              <span>Visit Advertiser</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          {skipRemaining > 0 ? (
            <div className="px-4 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold font-mono tabular-nums shadow-lg">
              You can skip in {skipRemaining}s
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdFinished();
              }}
              className="px-4 py-2 rounded-lg bg-black/85 hover:bg-white hover:text-slate-950 text-white border border-white/30 text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all active:scale-95"
            >
              <span>Skip Ad</span>
              <SkipForward className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* YouTube-style Yellow Ad Progress Bar */}
        <div className="w-full h-1 bg-white/25">
          <div
            className="h-full bg-amber-400 transition-all duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
