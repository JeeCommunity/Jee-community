import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Flame, Target } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Official expected NTA windows for JEE Main 2028 (Session 1: Jan 22, 2028 | Session 2: Apr 04, 2028)
const JEE_2028_FIRST_ATTEMPT = new Date('2028-01-22T09:00:00+05:30').getTime();
const JEE_2028_SECOND_ATTEMPT = new Date('2028-04-04T09:00:00+05:30').getTime();

function calculateTimeLeft(targetMs: number, nowMs: number): TimeLeft {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function JeeCountdownBanner({ compact = false }: { compact?: boolean }) {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const attempt1 = calculateTimeLeft(JEE_2028_FIRST_ATTEMPT, nowMs);
  const attempt2 = calculateTimeLeft(JEE_2028_SECOND_ATTEMPT, nowMs);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={`${
        compact ? 'mb-4' : 'mx-3 sm:mx-4 mt-3 mb-2'
      } rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md overflow-hidden`}
    >
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2.5">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>JEE Main 2028 Live Countdown</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
                  Target 2028
                </span>
              </h3>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-indigo-200/80 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Har Ek Din Important Hai!</span>
          </div>
        </div>

        {/* Two Attempt Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 1st Attempt (January 2028) */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-wide truncate">
                  1st Attempt (Jan 2028)
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-300">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Session 1 · Jan 2028</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-center">
                <div className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-300 leading-none">
                  {attempt1.days}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-amber-200/90 mt-0.5">
                  Days Left
                </div>
              </div>
              <div className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-center font-mono tabular-nums">
                <div className="text-xs sm:text-sm font-bold text-white leading-none">
                  {pad(attempt1.hours)}:{pad(attempt1.minutes)}:{pad(attempt1.seconds)}
                </div>
                <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                  Hrs : Min : Sec
                </div>
              </div>
            </div>
          </div>

          {/* 2nd Attempt (April 2028) */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wide truncate">
                  2nd Attempt (Apr 2028)
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-300">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Session 2 · April 2028</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-center">
                <div className="text-base sm:text-lg font-black font-mono tabular-nums text-cyan-300 leading-none">
                  {attempt2.days}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-200/90 mt-0.5">
                  Days Left
                </div>
              </div>
              <div className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-center font-mono tabular-nums">
                <div className="text-xs sm:text-sm font-bold text-white leading-none">
                  {pad(attempt2.hours)}:{pad(attempt2.minutes)}:{pad(attempt2.seconds)}
                </div>
                <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                  Hrs : Min : Sec
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
