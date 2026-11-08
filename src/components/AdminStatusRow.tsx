import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  X,
  Trash2,
  Eye,
  ExternalLink,
  Link as LinkIcon,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { normalizeUrl, renderTextWithLinks } from '../lib/linkify';
import {
  DEFAULT_DIWALI_STATUS_ID,
  getInstantAdminStatuses,
  fetchSupabaseAdminStatuses,
  saveSupabaseAdminStatus,
  deleteSupabaseAdminStatus,
  restoreDefaultDiwaliStatus,
  recordSupabaseStatusInteraction,
  createSupabaseNotification,
} from '../lib/supabaseHub';

interface FireworkRocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  hue: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
}

interface SkyLantern {
  x: number;
  y: number;
  vy: number;
  swayOffset: number;
  swaySpeed: number;
  scale: number;
  alpha: number;
}

// ============================================================================
// REALISTIC DIWALI CRACKER (PATAKHA) SOUND & VOICE ENGINE (Web Audio + Speech)
// ============================================================================
let sharedAudioCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;

function getUnlockedAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
      cachedNoiseBuffer = null;
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const bufferSize = ctx.sampleRate * 1.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

/**
 * Plays a rising Diwali Rocket Whistle ("shhhhh-wheeee!")
 */
function playRocketWhistleSound(muted: boolean) {
  if (muted) return;
  const ctx = getUnlockedAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Rising whistle tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380 + Math.random() * 120, now);
    osc.frequency.exponentialRampToValueAtTime(1650 + Math.random() * 400, now + 0.38);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);

    // Air whoosh noise
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(2400, now + 0.35);
    filter.Q.value = 3;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.01, now);
    nGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  } catch {
    // ignore
  }
}

/**
 * Plays a realistic Diwali Sky-Shot Bomb Explosion ("DHADAAM!") + Ladi Cracker Crackle ("pat-pat-pat!")
 */
function playCrackerExplosionSound(muted: boolean, isGrand = false) {
  if (muted) return;
  const ctx = getUnlockedAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const noiseBuffer = getNoiseBuffer(ctx);

    // 1. Deep Sky-Shot Bass Thud ("DHADAAM!")
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(isGrand ? 160 : 135, now);
    bassOsc.frequency.exponentialRampToValueAtTime(28, now + (isGrand ? 0.55 : 0.4));

    bassGain.gain.setValueAtTime(isGrand ? 0.65 : 0.45, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + (isGrand ? 0.58 : 0.42));

    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + (isGrand ? 0.6 : 0.45));

    // 2. Explosive Noise Blast (Real Cracker Burst)
    const blast = ctx.createBufferSource();
    blast.buffer = noiseBuffer;
    const blastFilter = ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(isGrand ? 1800 : 1400, now);
    blastFilter.frequency.exponentialRampToValueAtTime(180, now + 0.45);

    const blastGain = ctx.createGain();
    blastGain.gain.setValueAtTime(isGrand ? 0.6 : 0.4, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    blast.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(ctx.destination);
    blast.start(now);
    blast.stop(now + 0.5);

    // 3. Multi-Pop Cracker Ladi & Phuljhari Sparkle Crackle ("pat-pat-pat-crackle!")
    const popCount = isGrand ? 11 : 6;
    for (let i = 0; i < popCount; i++) {
      const delay = 0.08 + Math.random() * (isGrand ? 0.65 : 0.42);
      const pop = ctx.createBufferSource();
      pop.buffer = noiseBuffer;

      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.setValueAtTime(1800 + Math.random() * 2800, now + delay);
      hp.Q.value = 2.2;

      const popGain = ctx.createGain();
      const peak = (isGrand ? 0.28 : 0.18) * (0.6 + Math.random() * 0.5);
      popGain.gain.setValueAtTime(peak, now + delay);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.065);

      pop.connect(hp);
      hp.connect(popGain);
      popGain.connect(ctx.destination);
      pop.start(now + delay);
      pop.stop(now + delay + 0.07);
    }

    // 4. Optional Festive Bell Shimmer on Grand Burst
    if (isGrand) {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq, now + idx * 0.07);

        bGain.gain.setValueAtTime(0.001, now + idx * 0.07);
        bGain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.75);

        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start(now + idx * 0.07);
        bell.stop(now + idx * 0.07 + 0.8);
      });
    }
  } catch {
    // ignore
  }
}

/**
 * Speaks a warm Happy Diwali voice wish for all JEE Community users & their families
 */
function speakDiwaliVoiceGreeting(muted: boolean) {
  if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      'Happy Diwali! Aap sabhi JEE Community members, aur aapke poore parivaar ko, Diwali ki dher saari shubhkamnayein!'
    );
    const voices = window.speechSynthesis.getVoices();
    const indianVoice =
      voices.find((v) => v.lang.includes('hi-IN')) ||
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.lang.startsWith('hi')) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (indianVoice) {
      msg.voice = indianVoice;
    }
    msg.lang = indianVoice?.lang || 'hi-IN';
    msg.rate = 0.96;
    msg.pitch = 1.05;
    msg.volume = 1.0;
    window.speechSynthesis.speak(msg);
  } catch {
    // ignore speech errors
  }
}

function stopDiwaliVoiceGreeting() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

function FlickeringDiya({
  size = 'md',
  delay = 0,
}: {
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}) {
  const dims =
    size === 'lg'
      ? 'w-16 h-16'
      : size === 'sm'
      ? 'w-9 h-9'
      : 'w-12 h-12';

  return (
    <div className={`relative flex flex-col items-center justify-end ${dims} select-none`}>
      <motion.div
        animate={{
          scale: [1, 1.22, 0.95, 1.15, 1],
          opacity: [0.65, 0.95, 0.7, 0.9, 0.65],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          delay,
          ease: 'easeInOut',
        }}
        className="absolute -top-2 w-8 h-8 rounded-full bg-amber-400/40 blur-md pointer-events-none"
      />

      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]"
      >
        <defs>
          <radialGradient id={`flameGrad_${delay}`} cx="50%" cy="65%" r="55%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="45%" stopColor="#FBBF24" />
            <stop offset="85%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`bowlGrad_${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        <motion.path
          d="M32 8 C25 20, 22 28, 32 34 C42 28, 39 20, 32 8 Z"
          fill={`url(#flameGrad_${delay})`}
          animate={{
            d: [
              'M32 7 C25 19, 22 28, 32 34 C42 28, 39 19, 32 7 Z',
              'M33 5 C24 18, 23 28, 32 34 C41 28, 40 18, 33 5 Z',
              'M31 8 C26 20, 22 29, 32 34 C42 29, 38 20, 31 8 Z',
              'M32 7 C25 19, 22 28, 32 34 C42 28, 39 19, 32 7 Z',
            ],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay,
            ease: 'easeInOut',
          }}
        />
        <motion.ellipse
          cx="32"
          cy="27"
          rx="3.2"
          ry="5.5"
          fill="#FEF3C7"
          animate={{ ry: [5, 6.4, 4.8, 5.5], opacity: [0.85, 1, 0.8, 0.9] }}
          transition={{ duration: 0.9, repeat: Infinity, delay }}
        />

        <path
          d="M12 35 Q32 41 52 35"
          fill="none"
          stroke="#FCD34D"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M10 35 Q32 42 54 35 C51 49, 42 55, 32 55 C22 55, 13 49, 10 35 Z"
          fill={`url(#bowlGrad_${delay})`}
          stroke="#F59E0B"
          strokeWidth="1.2"
        />

        <circle cx="22" cy="44" r="1.6" fill="#FDE68A" />
        <circle cx="32" cy="46" r="2" fill="#FDE68A" />
        <circle cx="42" cy="44" r="1.6" fill="#FDE68A" />
      </svg>
    </div>
  );
}

/**
 * Full-Screen 60fps Animated Happy Diwali Video Status Stage (15-second story duration)
 */
function DiwaliVideoStatusStage({
  onProgressUpdate,
  onComplete,
  isMuted,
  burstTriggerCount,
}: {
  onProgressUpdate: (pct: number) => void;
  onComplete: () => void;
  isMuted: boolean;
  burstTriggerCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spawnBurstRef = useRef<(x?: number, y?: number, grand?: boolean) => void>(() => {});
  const onProgressRef = useRef(onProgressUpdate);
  const onCompleteRef = useRef(onComplete);
  const isMutedRef = useRef(isMuted);
  onProgressRef.current = onProgressUpdate;
  onCompleteRef.current = onComplete;
  isMutedRef.current = isMuted;

  // Speak voice greeting when status opens (and cancel when closed or muted)
  useEffect(() => {
    if (!isMuted) {
      const t = setTimeout(() => {
        speakDiwaliVoiceGreeting(false);
      }, 250);
      return () => {
        clearTimeout(t);
        stopDiwaliVoiceGreeting();
      };
    } else {
      stopDiwaliVoiceGreeting();
    }
  }, [isMuted]);

  // Trigger grand firework volley whenever student clicks "Wish Happy Diwali"
  useEffect(() => {
    if (burstTriggerCount > 0) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          spawnBurstRef.current(undefined, undefined, true);
        }, i * 170);
      }
    }
  }, [burstTriggerCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    const DURATION_MS = 16000; // 16 seconds animated video story
    const startTime = performance.now();
    let completed = false;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      '#FBBF24', // Marigold Gold
      '#F59E0B', // Deep Amber
      '#F97316', // Festive Saffron
      '#FB7185', // Rose Kumkum
      '#34D399', // Royal Emerald
      '#A78BFA', // Festive Violet
      '#FEF08A', // Sparkler White-Gold
    ];

    const rockets: FireworkRocket[] = [];
    const particles: FireworkParticle[] = [];
    const lanterns: SkyLantern[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vy: 0.35 + Math.random() * 0.45,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.015,
      scale: 0.55 + Math.random() * 0.65,
      alpha: 0.35 + Math.random() * 0.45,
    }));

    const explodeAt = (x: number, y: number, count = 48, playSound = true, isGrand = false) => {
      if (playSound) {
        playCrackerExplosionSound(isMutedRef.current, isGrand);
      }
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      const secondaryColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
        const speed = 1.6 + Math.random() * 4.8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.014,
          color: i % 2 === 0 ? baseColor : secondaryColor,
          size: 1.8 + Math.random() * 2.2,
        });
      }
    };

    spawnBurstRef.current = (customX?: number, customY?: number, grand?: boolean) => {
      const w = canvas.width || window.innerWidth;
      const h = canvas.height || window.innerHeight;
      const x = customX ?? w * (0.15 + Math.random() * 0.7);
      const y = customY ?? h * (0.12 + Math.random() * 0.38);
      explodeAt(x, y, grand ? 68 : 44, true, Boolean(grand));
    };

    // Initial opening cracker salute
    setTimeout(() => spawnBurstRef.current(undefined, undefined, true), 120);
    setTimeout(() => spawnBurstRef.current(undefined, undefined, false), 550);

    let lastRocketSpawn = performance.now();

    const render = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      onProgressRef.current(pct);

      if (elapsed >= DURATION_MS && !completed) {
        completed = true;
        onCompleteRef.current();
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Rich night sky trail clear
      ctx.fillStyle = 'rgba(11, 5, 24, 0.24)';
      ctx.fillRect(0, 0, w, h);

      // Draw floating Sky Lanterns (Aakash Kandil)
      lanterns.forEach((l) => {
        l.y -= l.vy;
        l.swayOffset += l.swaySpeed;
        const drawX = l.x + Math.sin(l.swayOffset) * 18;
        if (l.y < -40) {
          l.y = h + 30;
          l.x = Math.random() * w;
        }

        ctx.save();
        ctx.globalAlpha = l.alpha;
        const grad = ctx.createRadialGradient(drawX, l.y, 1, drawX, l.y, 16 * l.scale);
        grad.addColorStop(0, '#FFFBEB');
        grad.addColorStop(0.4, '#F59E0B');
        grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, l.y, 16 * l.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(drawX - 4 * l.scale, l.y - 6 * l.scale, 8 * l.scale, 11 * l.scale);
        ctx.restore();
      });

      // Spawn new firework rocket every ~900ms with real rocket whistle sound
      if (now - lastRocketSpawn > 900) {
        lastRocketSpawn = now;
        const startX = w * (0.15 + Math.random() * 0.7);
        playRocketWhistleSound(isMutedRef.current);
        rockets.push({
          x: startX,
          y: h * 0.85,
          targetY: h * (0.12 + Math.random() * 0.34),
          vx: (Math.random() - 0.5) * 1.4,
          vy: -(6.8 + Math.random() * 3.2),
          hue: 35 + Math.random() * 25,
          trail: [],
        });
      }

      // Update & draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y, alpha: 0.9 });
        if (r.trail.length > 8) r.trail.shift();

        r.x += r.vx;
        r.y += r.vy;

        r.trail.forEach((t, idx) => {
          ctx.save();
          ctx.globalAlpha = (idx / r.trail.length) * 0.75;
          ctx.fillStyle = '#FDE68A';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // When rocket reaches sky target, explode with real Cracker Boom + Crackle!
        if (r.y <= r.targetY) {
          explodeAt(r.x, r.y, 48, true, false);
          rockets.splice(i, 1);
        }
      }

      // Update & draw explosion particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.vx *= 0.985;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      stopDiwaliVoiceGreeting();
    };
  }, []);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        spawnBurstRef.current(e.clientX, e.clientY, true);
      }}
      className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#090414] via-[#1B0B2E] to-[#2A0F1D] select-none cursor-pointer"
    >
      {/* 60fps Fireworks & Sky Lanterns Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Top Festive Kicker */}
      <div className="w-full pt-20 px-4 flex flex-col items-center z-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold tracking-widest text-amber-300/90 uppercase"
        >
          Shubh Deepavali · Festival of Lights
        </motion.div>
      </div>

      {/* Center Stage: Simple & Heartfelt Diwali Wishes for All JEE Community Members & Their Families */}
      <div className="relative z-10 flex flex-col items-center px-5 max-w-md w-full my-auto pointer-events-none">
        {/* Rotating Golden Mandala Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-10 w-64 h-64 rounded-full border border-dashed border-amber-400/25 flex items-center justify-center pointer-events-none"
        >
          <div className="w-48 h-48 rounded-full border border-amber-300/20" />
        </motion.div>

        {/* Central Featured Diya Emblem */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mb-3"
        >
          <FlickeringDiya size="lg" delay={0} />
        </motion.div>

        {/* Shimmering Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ textWrap: 'balance' }}
          className="text-center font-serif text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(251,191,36,0.45)]"
        >
          Happy Diwali
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="mt-1 text-center text-sm sm:text-base font-bold text-amber-100 tracking-wide"
        >
          To All JEE Community Members &amp; Your Family
        </motion.p>

        {/* Simple Heartfelt Family Wishes Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 w-full rounded-2xl bg-black/45 backdrop-blur-md border border-amber-400/30 p-4 sm:p-5 text-center shadow-[0_8px_32px_rgba(245,158,11,0.2)]"
        >
          <p className="text-amber-50/95 text-sm sm:text-[15px] leading-relaxed font-medium">
            Aap sabhi <span className="text-amber-300 font-bold">JEE Community</span> members aur
            aapke <span className="text-amber-300 font-bold">poore parivaar</span> ko Diwali ki dher
            saari shubhkamnayein! Yeh roshni ka tyohaar aapke ghar me hamesha khushiyan,
            sukh-shanti aur samriddhi banaye rakhe.
          </p>
          <div className="mt-3 pt-2.5 border-t border-amber-400/20 flex items-center justify-center gap-2 text-[11px] text-amber-200/80 font-medium">
            <span>With Love from Admin</span>
            <span aria-hidden="true">·</span>
            <span>Tap screen for more crackers</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Stage: Row of 5 Glowing Flickering Diyas */}
      <div className="relative z-10 w-full pb-44 flex flex-col items-center pointer-events-none">
        <div className="flex items-end justify-center gap-3 sm:gap-5 px-4">
          <FlickeringDiya size="sm" delay={0.2} />
          <FlickeringDiya size="md" delay={0.5} />
          <FlickeringDiya size="lg" delay={0.1} />
          <FlickeringDiya size="md" delay={0.7} />
          <FlickeringDiya size="sm" delay={0.35} />
        </div>
        <div className="w-64 h-1.5 rounded-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent blur-[1px] mt-1" />
      </div>
    </div>
  );
}

export default function AdminStatusRow() {
  const { user, profile } = useAuth();
  const [statuses, setStatuses] = useState<any[]>(() => getInstantAdminStatuses());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [wishCount, setWishCount] = useState<number>(32);
  const [hasWishedDiwali, setHasWishedDiwali] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jee_wished_diwali_2026') === 'true';
    } catch {
      return false;
    }
  });
  const [burstTriggerCount, setBurstTriggerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Upload Preview Modal State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [statusCaption, setStatusCaption] = useState('');
  const [statusLinkUrl, setStatusLinkUrl] = useState('');
  const [statusLinkLabel, setStatusLinkLabel] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSuperAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';
  const isAdmin =
    isSuperAdmin ||
    (profile?.role === 'community_manager' && !!profile?.managerPermissions?.canPostStatus);

  const fetchStatuses = useCallback(async (force = false) => {
    const list = await fetchSupabaseAdminStatuses(force);
    setStatuses(list);
  }, []);

  useEffect(() => {
    fetchStatuses(false);
  }, [fetchStatuses]);

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject('Invalid video file');
      video.src = window.URL.createObjectURL(file);
    });
  };

  const uploadFileToCloudinaryWithProgress = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setUploadProgress(50);
      const fallbackUrl = await uploadFileToCloudinary(file);
      setUploadProgress(100);
      return fallbackUrl;
    }

    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100.0) / e.total);
          setUploadProgress(progress);
        }
      });

      xhr.onreadystatechange = async () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else if (xhr.readyState === 4) {
          try {
            const fallbackUrl = await uploadFileToCloudinary(file);
            resolve(fallbackUrl);
          } catch (err) {
            reject(err);
          }
        }
      };

      fd.append('upload_preset', uploadPreset);
      fd.append('file', file);
      xhr.send(fd);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (statuses.length >= 10) {
      toast.error('Maximum 10 statuses allowed. Please delete older ones.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.type.startsWith('video/')) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 61) {
          toast.error('Video length must be 1 minute or less.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      } catch {
        toast.error('Invalid video file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File is too large (max 50MB)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setStatusCaption('');
    setStatusLinkUrl('');
    setStatusLinkLabel('');
    setIsUploadModalOpen(true);
  };

  const handleCancelUpload = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setStatusCaption('');
    setStatusLinkUrl('');
    setStatusLinkLabel('');
    setIsUploadModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingFile || !user || !isAdmin) return;

    setIsUploadModalOpen(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadFileToCloudinaryWithProgress(pendingFile);
      const normalizedLink = statusLinkUrl.trim() ? normalizeUrl(statusLinkUrl.trim()) : null;

      await saveSupabaseAdminStatus({
        imageUrl: url,
        type: pendingFile.type.startsWith('video/') ? 'video' : 'image',
        caption: statusCaption.trim() || null,
        linkUrl: normalizedLink,
        linkLabel: statusLinkLabel.trim() || 'Open Link ↗',
        createdAtMs: Date.now(),
        authorId: user.uid,
        viewsCount: 1,
        wishesCount: 0,
      });
      toast.success('Status posted!');
      await fetchStatuses(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload status');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
      setPendingFile(null);
      setPendingPreviewUrl(null);
      setStatusCaption('');
      setStatusLinkUrl('');
      setStatusLinkLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleWishHappyDiwali = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const activeStatus = activeStatusIndex !== null ? statuses[activeStatusIndex] : null;
    if (!activeStatus) return;

    getUnlockedAudioCtx();
    setBurstTriggerCount((c) => c + 1);

    if (!hasWishedDiwali) {
      setHasWishedDiwali(true);
      try {
        localStorage.setItem('jee_wished_diwali_2026', 'true');
      } catch {
        // ignore
      }
      setWishCount((prev) => prev + 1);
      toast.success('Happy Diwali to you and your family!');

      const updated = await recordSupabaseStatusInteraction(activeStatus, 'wish');
      setWishCount(updated.wishesCount);
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === activeStatus.id ? { ...s, wishesCount: updated.wishesCount } : s
        )
      );
    } else {
      toast.success('Shubh Deepavali to you and your family!');
    }
  };

  const handleReply = async (type: 'text' | 'reaction', contentStr: string) => {
    if (!user || activeStatusIndex === null) return;
    const activeStatus = statuses[activeStatusIndex];
    try {
      getUnlockedAudioCtx();
      setBurstTriggerCount((c) => c + 1);
      if (type === 'text') {
        setReplyText('');
        toast.success('Diwali wish sent to Admin!');
      } else {
        toast.success(`Sent ${contentStr} to Admin!`);
      }
      await createSupabaseNotification({
        recipientId: activeStatus?.authorId || 'admin',
        senderId: user.uid,
        senderName: profile?.fullName || 'Student',
        senderAvatar: profile?.photoURL || '',
        type: 'status_reply',
        commentContent: `${type === 'reaction' ? 'Reacted' : 'Replied'} on Status: ${contentStr}`,
        targetUrl: '/community',
      });
    } catch (e: any) {
      console.error('Reply error:', e);
    }
  };

  useEffect(() => {
    if (activeStatusIndex !== null && statuses[activeStatusIndex] && user) {
      const currentStatus = statuses[activeStatusIndex];
      setViewCount(Number(currentStatus.viewsCount) || 48);
      setWishCount(Number(currentStatus.wishesCount) || 32);

      const viewedKey = `jee_status_viewed_${currentStatus.id}`;
      let alreadyViewed = false;
      try {
        alreadyViewed = sessionStorage.getItem(viewedKey) === '1';
      } catch {
        // ignore
      }

      if (!alreadyViewed) {
        try {
          sessionStorage.setItem(viewedKey, '1');
        } catch {
          // ignore
        }
        recordSupabaseStatusInteraction(currentStatus, 'view')
          .then((res) => {
            setViewCount(res.viewsCount);
            setWishCount(res.wishesCount);
            setStatuses((prev) =>
              prev.map((s) =>
                s.id === currentStatus.id
                  ? { ...s, viewsCount: res.viewsCount, wishesCount: res.wishesCount }
                  : s
              )
            );
          })
          .catch(() => {});
      }
    }
  }, [activeStatusIndex, user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      if (statuses.length <= 1) {
        setActiveStatusIndex(null);
      } else if (activeStatusIndex !== null && activeStatusIndex >= statuses.length - 1) {
        setActiveStatusIndex(activeStatusIndex - 1);
        setVideoProgress(0);
      }

      await deleteSupabaseAdminStatus(id);
      const updated = await fetchSupabaseAdminStatuses(true);
      setStatuses(updated);
      toast.success('Status removed');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete status');
    }
  };

  const handleRestoreDiwaliStatus = async () => {
    try {
      await restoreDefaultDiwaliStatus();
      const updated = await fetchSupabaseAdminStatuses(true);
      setStatuses(updated);
      toast.success('Happy Diwali Video Status restored!');
    } catch {
      toast.error('Could not restore Diwali status');
    }
  };

  const openStatusAtIndex = (idx: number) => {
    // Unlock Web Audio Context immediately inside user click event so mobile speakers play loudly
    getUnlockedAudioCtx();
    setVideoProgress(0);
    setActiveStatusIndex(idx);
    playCrackerExplosionSound(isMuted, true);
  };

  if (!isAdmin && statuses.length === 0) return null;

  const hasDiwaliStatus = statuses.some((s) => s.id === DEFAULT_DIWALI_STATUS_ID);
  const currentActiveStatus = activeStatusIndex !== null ? statuses[activeStatusIndex] : null;
  const isCurrentDiwaliVideo = currentActiveStatus?.type === 'diwali_video';

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-50/95 via-orange-50/80 to-amber-50/95 dark:from-[#160D24] dark:via-[#23111E] dark:to-[#160D24] border-b border-amber-200/70 dark:border-amber-500/25 py-3 px-4 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
      {/* Subtle Festive Diwali Header Glow Overlay */}
      <div className="pointer-events-none absolute -top-10 left-1/4 w-44 h-24 rounded-full bg-amber-400/20 dark:bg-amber-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 right-1/4 w-44 h-24 rounded-full bg-orange-500/15 dark:bg-orange-500/15 blur-2xl" />

      {isAdmin && (
        <div className="flex flex-col items-center gap-1 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full border-2 border-dashed border-amber-400 dark:border-amber-500/60 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-800 hover:border-amber-500 transition-all relative"
            title="Upload Admin Status"
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-full z-10">
                <div className="text-[10px] font-bold text-amber-600 tabular-nums">
                  {Math.round(uploadProgress)}%
                </div>
                <div className="w-8 h-1 bg-amber-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <Plus className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            )}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </button>
          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap">
            Add Status
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>
      )}

      {/* Admin Status Circles */}
      {statuses.map((statusItem, idx) => {
        const isDiwali = statusItem.type === 'diwali_video';
        return (
          <button
            key={statusItem.id}
            type="button"
            onClick={() => openStatusAtIndex(idx)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group relative z-10 focus:outline-none"
          >
            <div
              className={
                isDiwali
                  ? 'w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 shadow-[0_0_16px_rgba(245,158,11,0.55)] group-hover:scale-105 transition-transform relative'
                  : 'w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 group-hover:scale-105 transition-transform relative'
              }
            >
              {isDiwali ? (
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#130726] via-[#2A0E24] to-[#451A03] border-2 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden relative">
                  <div className="scale-75 mt-1">
                    <FlickeringDiya size="sm" delay={0} />
                  </div>
                  <div className="absolute -bottom-0.5 inset-x-0 bg-gradient-to-r from-amber-500 to-orange-600 text-[7px] font-extrabold text-white text-center uppercase tracking-wider py-[1px]">
                    VIDEO
                  </div>
                </div>
              ) : statusItem.type === 'video' ? (
                <video
                  src={statusItem.imageUrl}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={statusItem.imageUrl}
                  alt="Status"
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                />
              )}
            </div>
            <span
              className={
                isDiwali
                  ? 'text-[10px] font-extrabold text-amber-800 dark:text-amber-300 whitespace-nowrap'
                  : 'text-[10px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap'
              }
            >
              {isDiwali ? 'Happy Diwali' : 'Admin'}
            </span>
          </button>
        );
      })}

      {isAdmin && !hasDiwaliStatus && (
        <button
          type="button"
          onClick={handleRestoreDiwaliStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold hover:bg-amber-500/25 transition-colors shrink-0 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Diwali Status</span>
        </button>
      )}

      {/* Festive Diwali Header Banner Strip on the Right Side of Status Row */}
      {hasDiwaliStatus && (
        <div
          onClick={() => {
            const dIdx = statuses.findIndex((s) => s.id === DEFAULT_DIWALI_STATUS_ID);
            openStatusAtIndex(dIdx >= 0 ? dIdx : 0);
          }}
          className="ml-auto shrink-0 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/20 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-amber-500/20 border border-amber-400/35 cursor-pointer hover:border-amber-400/60 transition-all group relative z-10"
        >
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 whitespace-nowrap">
                Happy Diwali to You &amp; Your Family
              </span>
            </div>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 whitespace-nowrap">
              Tap to watch Diwali video status ({wishCount} wishes)
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Upload Preview & Link/Caption Modal */}
      <AnimatePresence>
        {isUploadModalOpen && pendingFile && pendingPreviewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[320] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCancelUpload}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Post Admin Status
                </h3>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmUpload} className="p-4 space-y-4 overflow-y-auto">
                <div className="w-full h-52 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  {pendingFile.type.startsWith('video/') ? (
                    <video
                      src={pendingPreviewUrl}
                      controls
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <img
                      src={pendingPreviewUrl}
                      alt="Status preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Caption / Text (Optional - Links will be clickable)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write a caption or paste a link..."
                    value={statusCaption}
                    onChange={(e) => setStatusCaption(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Add Clickable Link Button on Status (Optional)</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Paste URL (e.g. https://jee-community.netlify.app/community)"
                      value={statusLinkUrl}
                      onChange={(e) => setStatusLinkUrl(e.target.value)}
                      className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  {statusLinkUrl.trim() && (
                    <div>
                      <input
                        type="text"
                        placeholder="Button Text (Default: Open Link ↗)"
                        value={statusLinkLabel}
                        onChange={(e) => setStatusLinkLabel(e.target.value)}
                        className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                  >
                    Post Status
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Status Viewer */}
      <AnimatePresence>
        {activeStatusIndex !== null && statuses[activeStatusIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
          >
            {/* Story Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-40">
              {statuses.map((status, idx) => {
                const isActive = idx === activeStatusIndex;
                const isPast = idx < activeStatusIndex;
                const isTimedVideo = status.type === 'video' || status.type === 'diwali_video';
                const hasExtraContent = !!(status.linkUrl || status.caption);

                return (
                  <div
                    key={status.id}
                    className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
                  >
                    {isTimedVideo && isActive ? (
                      <div
                        className="h-full bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 transition-all duration-100 ease-linear"
                        style={{ width: `${videoProgress}%` }}
                      />
                    ) : (
                      <motion.div
                        key={`${activeStatusIndex}_${idx}`}
                        initial={{ width: isPast ? '100%' : '0%' }}
                        animate={{ width: isPast ? '100%' : isActive ? '100%' : '0%' }}
                        transition={
                          isActive
                            ? { duration: hasExtraContent ? 8 : 5, ease: 'linear' }
                            : { duration: 0 }
                        }
                        onAnimationComplete={() => {
                          if (isActive && !isTimedVideo) {
                            if (activeStatusIndex < statuses.length - 1) {
                              setActiveStatusIndex(activeStatusIndex + 1);
                              setVideoProgress(0);
                            } else {
                              setActiveStatusIndex(null);
                            }
                          }
                        }}
                        className="h-full bg-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Viewer Top Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50 pointer-events-none">
              <div className="flex items-center gap-3">
                <div
                  className={
                    isCurrentDiwaliVideo
                      ? 'w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center border-2 border-amber-200 text-white font-extrabold shadow-[0_0_14px_rgba(245,158,11,0.6)]'
                      : 'w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 text-blue-700 font-bold shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  }
                >
                  {isCurrentDiwaliVideo ? <Flame className="w-5 h-5 fill-current" /> : 'A'}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm drop-shadow">
                    {isCurrentDiwaliVideo ? 'Admin · Happy Diwali' : 'Admin'}
                  </h3>
                  <p className="text-white/75 text-[11px] font-medium drop-shadow">
                    {isCurrentDiwaliVideo
                      ? 'Voice & Cracker Sound Active'
                      : statuses[activeStatusIndex]?.createdAt
                          ?.toDate?.()
                          ?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {isCurrentDiwaliVideo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      getUnlockedAudioCtx();
                      const nextMuted = !isMuted;
                      setIsMuted(nextMuted);
                      if (!nextMuted) {
                        playCrackerExplosionSound(false, true);
                        speakDiwaliVoiceGreeting(false);
                      } else {
                        stopDiwaliVoiceGreeting();
                      }
                    }}
                    className="min-w-[44px] min-h-[44px] rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-amber-300 border border-amber-400/30 backdrop-blur-md pointer-events-auto transition-colors"
                    title={isMuted ? 'Unmute voice & crackers' : 'Mute voice & crackers'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}

                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/45 text-white font-semibold text-xs backdrop-blur-md pointer-events-auto shadow-lg border border-white/15 tabular-nums">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>{viewCount !== null ? viewCount : '-'}</span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(statuses[activeStatusIndex].id, e)}
                    className="min-w-[44px] min-h-[44px] rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white transition-colors pointer-events-auto"
                    title="Remove status"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    stopDiwaliVoiceGreeting();
                    setActiveStatusIndex(null);
                  }}
                  className="min-w-[44px] min-h-[44px] rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white transition-colors pointer-events-auto"
                  title="Close status"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content & Navigation Areas */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {activeStatusIndex > 0 && (
                <div
                  className="absolute inset-y-24 left-0 w-1/5 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStatusIndex(activeStatusIndex - 1);
                    setVideoProgress(0);
                  }}
                />
              )}

              {isCurrentDiwaliVideo ? (
                <DiwaliVideoStatusStage
                  isMuted={isMuted}
                  burstTriggerCount={burstTriggerCount}
                  onProgressUpdate={(pct) => setVideoProgress(pct)}
                  onComplete={() => {
                    stopDiwaliVoiceGreeting();
                    if (activeStatusIndex < statuses.length - 1) {
                      setActiveStatusIndex(activeStatusIndex + 1);
                      setVideoProgress(0);
                    } else {
                      setActiveStatusIndex(null);
                    }
                  }}
                />
              ) : statuses[activeStatusIndex].type === 'video' ? (
                <video
                  src={statuses[activeStatusIndex].imageUrl}
                  autoPlay
                  playsInline
                  controls
                  muted={false}
                  onTimeUpdate={(e) => {
                    const progress =
                      (e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100;
                    setVideoProgress(progress);
                  }}
                  onEnded={() => {
                    if (activeStatusIndex < statuses.length - 1) {
                      setActiveStatusIndex(activeStatusIndex + 1);
                      setVideoProgress(0);
                    } else {
                      setActiveStatusIndex(null);
                    }
                  }}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={statuses[activeStatusIndex].imageUrl}
                  alt="Status"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              )}

              <div
                className="absolute inset-y-24 right-0 w-1/5 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  stopDiwaliVoiceGreeting();
                  if (activeStatusIndex < statuses.length - 1) {
                    setActiveStatusIndex(activeStatusIndex + 1);
                    setVideoProgress(0);
                  } else {
                    setActiveStatusIndex(null);
                  }
                }}
              />
            </div>

            {/* Bottom Interactive Bar */}
            <div
              className="absolute bottom-4 left-4 right-4 z-40 flex flex-col gap-2.5 max-w-xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {isCurrentDiwaliVideo && (
                <div className="flex justify-center">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={handleWishHappyDiwali}
                    className="min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-[0_8px_28px_rgba(245,158,11,0.55)] border-2 border-amber-200 flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 fill-current shrink-0" />
                    <span>
                      {hasWishedDiwali ? 'Wished Happy Diwali' : 'Wish Happy Diwali'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/20 text-amber-950 font-black text-xs tabular-nums">
                      {wishCount}
                    </span>
                  </motion.button>
                </div>
              )}

              {statuses[activeStatusIndex].linkUrl && (
                <div className="flex justify-center">
                  <a
                    href={normalizeUrl(statuses[activeStatusIndex].linkUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-[0_8px_25px_rgba(59,130,246,0.5)] border-2 border-white/30 active:scale-95 transition-all"
                  >
                    <span>{statuses[activeStatusIndex].linkLabel || 'Open Link ↗'}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              )}

              {!isCurrentDiwaliVideo && statuses[activeStatusIndex].caption && (
                <div className="bg-black/65 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center shadow-lg max-h-28 overflow-y-auto">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {renderTextWithLinks(statuses[activeStatusIndex].caption, {
                      linkClassName:
                        'text-sky-300 hover:text-sky-200 underline font-extrabold break-all cursor-pointer',
                    })}
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-3 sm:gap-4 mb-0.5">
                {['🪔', '🎆', '❤️', '🔥', '🙏', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReply('reaction', emoji);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-2xl sm:text-3xl hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-amber-400/25">
                <input
                  type="text"
                  placeholder={
                    isCurrentDiwaliVideo
                      ? 'Send Happy Diwali wishes to Admin...'
                      : 'Reply to admin...'
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && replyText.trim()) {
                      e.stopPropagation();
                      handleReply('text', replyText);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (replyText.trim()) handleReply('text', replyText);
                  }}
                  className="text-slate-950 font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
