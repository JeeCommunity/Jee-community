import React, { useEffect, useState } from 'react';
import { X, Flame, Star, Trophy, Target, BookOpen, Clock, Play, Check, Maximize2, Minimize2, Calendar  } from 'lucide-react';
import { getFirstName, getLocalDate } from '../lib/utils';
import { getCampusProgress, getCollegeLevelRequired, getCumulativeCoinsNeeded, getDailyCoins, getDailyXP, COLLEGES } from "../lib/campusEconomy";
import { Building2, Zap } from "lucide-react";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface UserProfileModalProps {
  user: any;
  session?: any;
  onClose: () => void;
}

export default function UserProfileModal({ user, session: initialSession, onClose }: UserProfileModalProps) {
  const [session, setSession] = useState<any>(initialSession);

  useEffect(() => {
    if (session && session.isStudying && session.startTime) {
      const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
      if (elapsedSeconds >= 3 * 3600) {
        setSession((prev: any) => {
          if (!prev) return prev;
          const newSession = { ...prev };
          newSession.isStudying = false;
          newSession.accumulatedTime = Math.min(18 * 3600, (newSession.accumulatedTime || 0) + (3 * 3600));
          if (newSession.goals && newSession.activeGoalId) {
            newSession.goals = newSession.goals.map((g: any) => {
              if (g.id === newSession.activeGoalId) {
                return { ...g, accumulatedTime: (g.accumulatedTime || 0) + (3 * 3600) };
              }
              return g;
            });
          }
          return newSession;
        });
      }
    }
  }, [session?.isStudying, session?.startTime]);
  const [loading, setLoading] = useState(!initialSession);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollegesModalOpen, setIsCollegesModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(getLocalDate());
  const [isLoadingStats, setIsLoadingStats] = useState(!user?.campus);
  const [campusStats, setCampusStats] = useState({ 
    totalCoins: user?.campus?.totalCoins || 0, 
    totalXP: user?.campus?.totalXP || 0 
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(getLocalDate() + "T00:00:00Z");
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
  });

  useEffect(() => {
    if (user && !user.campus) {
      getDoc(doc(db, 'users', user.uid || user.id)).then(snap => {
        if (snap.exists() && snap.data().campus) {
          setCampusStats({ totalCoins: snap.data().campus.totalCoins || 0, totalXP: snap.data().campus.totalXP || 0 });
        }
        setIsLoadingStats(false);
      });
    } else {
      setIsLoadingStats(false);
    }
  }, [user]);
  useEffect(() => {
    if (!initialSession && user) {
      const fetchSession = async () => {
        try {
          const docRef = doc(db, 'study_sessions', user.uid || user.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setSession(snap.data());
          }
          const userRef = doc(db, 'users', user.uid || user.id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.campus) {
              setCampusStats({ totalCoins: data.campus.totalCoins || 0, totalXP: data.campus.totalXP || 0 });
            }
          }
        } catch (e) {
          console.error(e?.message || 'Error');
        } finally {
          setLoading(false);
        }
      };
      fetchSession();
    } else {
      setLoading(false);
    }
  }, [user, initialSession]);

  if (!user) return null;

  const streak = user.streakDays || 0;
  
  const isStudying = session?.isStudying;
  const todayDate = getLocalDate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isStudying) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [isStudying]);

  let currentTotal = session?.accumulatedTime || 0;
  
  if (session?.dailyDate !== todayDate) {
    currentTotal = 0;
    if (session?.isStudying && session?.startTime) {
      const nowDate = new Date();
      const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
      const startForToday = Math.max(session.startTime, midnight);
      currentTotal += Math.floor((now - startForToday) / 1000);
    }
  } else {
    if (session?.isStudying && session?.startTime) {
      currentTotal += Math.floor((now - session.startTime) / 1000);
    }
  }
  
  // Hard cap at 18 hours for display
  if (currentTotal > 18 * 3600) {
    currentTotal = 18 * 3600;
  }

  const liveCoins = React.useMemo(() => {
    if (!session) return campusStats.totalCoins;
    let oldDailyTime = 0;
    if (session.dailyDate === todayDate) {
      oldDailyTime = session.accumulatedTime || 0;
    }
    const addedLiveCoins = getDailyCoins(currentTotal / 60) - getDailyCoins(oldDailyTime / 60);
    return campusStats.totalCoins + Math.max(0, addedLiveCoins);
  }, [session, campusStats.totalCoins, currentTotal, todayDate]);

  const liveXP = React.useMemo(() => {
    if (!session) return campusStats.totalXP;
    let oldDailyTime = 0;
    if (session.dailyDate === todayDate) {
      oldDailyTime = session.accumulatedTime || 0;
    }
    const addedLiveXP = getDailyXP(currentTotal / 60) - getDailyXP(oldDailyTime / 60);
    return campusStats.totalXP + Math.max(0, addedLiveXP);
  }, [session, campusStats.totalXP, currentTotal, todayDate]);

  const { currentLevel, unlockedRank, nextCollege, requiredCoinsForNext } = getCampusProgress(liveXP, liveCoins);


  const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timeStr = formatHMS(currentTotal);

  const weeklyData = session?.weeklyData || {};
  
  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
       days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, dateStr: new Date(Date.UTC(year, month - 1, prevMonthLastDay - i)).toISOString().split('T')[0] });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
       days.push({ day: i, isCurrentMonth: true, dateStr: new Date(Date.UTC(year, month, i)).toISOString().split('T')[0] });
    }
    
    // Next month padding
    const remainingSlots = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= remainingSlots; i++) {
       days.push({ day: i, isCurrentMonth: false, dateStr: new Date(Date.UTC(year, month + 1, i)).toISOString().split('T')[0] });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();
  
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));


  const getDayColor = (time: number) => {
    if (time === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (time < 3600) return 'bg-indigo-200 dark:bg-indigo-900';
    if (time < 3 * 3600) return 'bg-indigo-300 dark:bg-indigo-700';
    if (time < 6 * 3600) return 'bg-indigo-400 dark:bg-indigo-600';
    return 'bg-indigo-600 dark:bg-indigo-500';
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isExpanded ? 'bg-black/60' : 'bg-transparent'} px-4`} onClick={onClose}>
      <div className={`bg-white dark:bg-slate-900 w-full ${isExpanded ? 'max-w-md h-[80vh] rounded-2xl shadow-2xl' : 'max-w-[300px] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700/60'} overflow-hidden relative flex flex-col transition-all duration-300`} onClick={e => e.stopPropagation()}>
        <div className={`shrink-0 ${isExpanded ? 'h-32' : 'h-16'} bg-gradient-to-r from-blue-600 to-indigo-600 relative transition-all duration-300`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        </div>
        
        <button onClick={onClose} className="absolute top-3 right-3 text-white hover:bg-white/20 dark:hover:bg-slate-900/20 p-1 rounded-full transition-colors z-10">
          <X className="w-4 h-4" />
        </button>
        {isExpanded && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="absolute top-3 left-3 text-white hover:bg-white/20 dark:hover:bg-slate-900/20 p-1 rounded-full transition-colors z-10">
             <Minimize2 className="w-4 h-4" />
          </button>
        )}
        
        <div className={`px-5 pb-5 relative flex-1 flex flex-col min-h-0`}>
          <div className={`flex justify-center ${isExpanded ? '-mt-16' : '-mt-10'} mb-3 relative z-10 transition-all duration-300 shrink-0`}>
            <div className="relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt={getFirstName(user.fullName)} className={`${isExpanded ? 'w-32 h-32' : 'w-20 h-20'} rounded-full object-cover border-4 border-white shadow-md bg-white dark:bg-slate-900 transition-all duration-300`} />
              ) : (
                <div className={`${isExpanded ? 'w-32 h-32 text-4xl' : 'w-20 h-20 text-3xl'} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-4 border-white shadow-md transition-all duration-300`}>
                  {getFirstName(user.fullName)?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {isStudying && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 text-white fill-current" />
                </div>
              )}
              {user?.role === "admin" && (
                <div className={`absolute ${isExpanded ? 'top-1 right-1' : '-top-1 -right-1'} flex items-center justify-center z-10 transition-all duration-300`} title="Admin">
                  <span className={`${isExpanded ? 'text-[24px] drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]' : 'text-[18px] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'} leading-none`}>💎</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="shrink-0 mb-3">
            <h3 className={`${isExpanded ? 'text-2xl' : 'text-lg'} font-bold text-slate-900 dark:text-white text-center mb-0.5 transition-all duration-300`}>{getFirstName(user.fullName)}</h3>
            {user?.role === "admin" && (
              <div className="flex justify-center mt-1">
                <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2 py-0.5 rounded shadow-sm border border-cyan-400/50 uppercase tracking-wide">
                  Admin
                </span>
              </div>
            )}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">@{user.username}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
            {/* CURRENT DAY SUMMARY (Always visible) */}
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                {isStudying && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isStudying ? "text-green-700" : "text-slate-500 dark:text-slate-400"}`}>
                  Today's Total Time
                </span>
              </div>
              
              <div className={`${isExpanded ? 'text-2xl' : 'text-xl'} font-mono font-bold text-slate-800 dark:text-slate-200 mb-1 tabular-nums transition-all`}>{timeStr}</div>
              
              {session?.goals && session.goals.filter((g: any) => g.createdAt && new Date(g.createdAt).toDateString() === new Date().toDateString()).length > 0 && (
                <div className="mt-2 text-left border-t border-slate-200 dark:border-slate-700 pt-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 flex items-center">
                    <Target className="w-2.5 h-2.5 mr-1" /> Today's Goals
                  </p>
                  <div className="space-y-1">
                    {session.goals.filter((g: any) => g.createdAt && new Date(g.createdAt).toDateString() === new Date().toDateString()).map((g: any) => {
                      let goalTime = g.accumulatedTime || 0;
                      if (session?.dailyDate !== todayDate) {
                        goalTime = 0;
                        if (isStudying && session.activeGoalId === g.id && session.startTime) {
                          const nowDate = new Date();
                          const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                          const startForToday = Math.max(session.startTime, midnight);
                          goalTime += Math.floor((now - startForToday) / 1000);
                        }
                      } else {
                        if (isStudying && session.activeGoalId === g.id && session.startTime) {
                          goalTime += Math.floor((now - session.startTime) / 1000);
                        }
                      }
                      return (
                      <div key={g.id} className="flex items-center text-[11px] justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-lg">
                        <div className="flex items-center min-w-0 mr-2">
                          {isStudying && session.activeGoalId === g.id ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mr-1.5">
                              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                            </div>
                          ) : g.status === 'completed' ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mr-1.5">
                              <Check className="w-2 h-2" />
                            </div>
                          ) : g.status === 'failed' ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mr-1.5">
                              <X className="w-2 h-2" />
                            </div>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 mr-1.5" />
                          )}
                          <span className={`truncate ${g.status !== 'pending' ? 'line-through text-slate-400' : isStudying && session.activeGoalId === g.id ? 'text-indigo-900 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                            {g.text}
                          </span>
                        </div>
                        {(goalTime > 0 || (isStudying && session.activeGoalId === g.id)) && (
                          <span className="text-[9px] text-slate-400 font-mono font-bold whitespace-nowrap shrink-0">{formatHMS(goalTime)}</span>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </div>

            {/* EXPANDED SECTIONS */}
            {isExpanded && (
              <>
                {isLoadingStats ? (
                  <div className="animate-pulse space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-100 dark:bg-slate-800 h-16 rounded-xl"></div>
                      <div className="bg-slate-100 dark:bg-slate-800 h-16 rounded-xl"></div>
                      <div className="bg-slate-100 dark:bg-slate-800 h-16 rounded-xl"></div>
                      <div className="bg-slate-100 dark:bg-slate-800 h-16 rounded-xl"></div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 h-20 rounded-2xl"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 font-bold text-xs">{currentLevel}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Level {currentLevel}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">Current Level</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{Math.floor(liveXP).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">Total XP</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{Math.floor(liveCoins).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">Total Coins</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{streak} Days</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate">Current Streak</p>
                    </div>
                  </div>
                </div>

                
                {/* DREAM COLLEGE PROGRESS */}
                {nextCollege && (
                  <div 
                    onClick={() => setIsCollegesModalOpen(true)}
                    className="cursor-pointer bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 mb-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-600/70 dark:text-indigo-400/70">Dream College Progress</p>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{nextCollege.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Level {currentLevel}</p>
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold">{Math.floor(liveCoins).toLocaleString()} Coins</p>
                      </div>
                    </div>
                  </div>
                )}
                </>
                )}

                {/* STUDY CALENDAR */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Study Calendar
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[90px] text-center">
                        {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4">
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayInfo, idx) => {
                        const dateStr = dayInfo.dateStr;
                        const dayData = weeklyData[dateStr] || { accumulatedTime: 0 };
                        let displayTime = dayData.accumulatedTime || 0;
                        if (dateStr === todayDate) {
                            displayTime = currentTotal;
                        } else if (session?.isStudying && session?.startTime && session?.dailyDate === dateStr) {
                           const nowDate = new Date();
                           const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                           if (session.startTime < midnight) {
                              displayTime += Math.floor((midnight - session.startTime) / 1000);
                           }
                        }
                        
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === todayDate;
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative border border-transparent
                              ${!dayInfo.isCurrentMonth ? 'opacity-30' : ''}
                              ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm z-10' : 'hover:border-slate-300 dark:hover:border-slate-600'}
                              ${isToday && !isSelected ? 'border-indigo-200 dark:border-indigo-800' : ''}
                              ${displayTime > 0 ? getDayColor(displayTime) : 'bg-white dark:bg-slate-900'}
                            `}
                            title={`${new Date(dateStr + "T00:00:00Z").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${formatHMS(displayTime)}`}
                          >
                            <span className={`text-[10px] font-bold ${displayTime > 3600 ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {dayInfo.day}
                            </span>
                            {isToday && (
                               <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-indigo-500"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-slate-400 font-medium">
                      <span>Less</span>
                      <div className="w-3 h-3 rounded-[3px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-200 dark:bg-indigo-900" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-300 dark:bg-indigo-700" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-400 dark:bg-indigo-600" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-600 dark:bg-indigo-500" />
                      <span>More</span>
                    </div>
                  </div>

                  {/* SELECTED DATE DETAILS */}
                  {selectedDate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 shadow-sm rounded-xl p-3 mb-2">
                      {(() => {
                        const dateObj = new Date(selectedDate + "T00:00:00Z");
                        const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
                        const dayData = weeklyData[selectedDate] || { accumulatedTime: 0, goals: [] };
                        
                        let displayTime = dayData.accumulatedTime || 0;
                        if (selectedDate === todayDate) {
                            displayTime = currentTotal;
                        } else if (session?.isStudying && session?.startTime && session?.dailyDate === selectedDate) {
                           const nowDate = new Date();
                           const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                           if (session.startTime < midnight) {
                              displayTime += Math.floor((midnight - session.startTime) / 1000);
                           }
                        }

                        // Use current goals for today, else historical goals
                        const goalsToDisplay = selectedDate === todayDate && session?.goals ? session.goals : (dayData.goals || []);

                        return (
                          <>
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{dayName}</span>
                              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {formatHMS(displayTime)}
                              </span>
                            </div>
                            
                            {goalsToDisplay.length > 0 ? (
                              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {goalsToDisplay.map((g: any) => (
                                  <div key={g.id} className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center min-w-0 mr-2">
                                      {g.status === 'completed' ? (
                                        <Check className="w-3 h-3 text-green-500 shrink-0 mr-1.5" />
                                      ) : g.status === 'failed' ? (
                                        <X className="w-3 h-3 text-red-500 shrink-0 mr-1.5" />
                                      ) : (
                                        <div className="w-3 h-3 rounded-full border-[1.5px] border-slate-300 dark:border-slate-600 shrink-0 mr-1.5" />
                                      )}
                                      <span className={`truncate font-medium ${g.status !== 'pending' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {g.text}
                                      </span>
                                    </div>
                                    {(() => {
                                      let gTime = g.accumulatedTime || 0;
                                      if (selectedDate === todayDate && session?.isStudying && session?.activeGoalId === g.id && session?.startTime) {
                                         gTime += Math.floor((Date.now() - session.startTime) / 1000);
                                      } else if (session?.isStudying && session?.startTime && session?.dailyDate === selectedDate && session?.activeGoalId === g.id) {
                                          const nowDate = new Date();
                                          const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                                          if (session.startTime < midnight) {
                                              gTime += Math.floor((midnight - session.startTime) / 1000);
                                          }
                                      }
                                      return gTime > 0 ? (
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-semibold shrink-0">{formatHMS(gTime)}</span>
                                      ) : null;
                                    })()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-2 text-center">
                                <p className="text-[10px] text-slate-400 italic">No goals recorded on this day.</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {!isExpanded && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button 
                onClick={() => setIsExpanded(true)}
                className="w-full py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center"
              >
                Expand Profile & History <Maximize2 className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unlocked Colleges Modal */}
      {isCollegesModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Unlocked Colleges
              </h3>
              <button onClick={() => setIsCollegesModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {unlockedRank > 0 ? (
                COLLEGES.slice(0, unlockedRank).map((college, idx) => (
                  <div key={college.id} className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl relative overflow-hidden group">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 font-bold text-indigo-600 dark:text-indigo-400">
                      #{college.rank}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{college.name}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Unlocked at Level {getCollegeLevelRequired(idx + 1)}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                      <Check className="w-8 h-8 text-indigo-500" />
                    </div>
                  </div>
                )).reverse()
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No colleges unlocked yet.</p>
                  <p className="text-sm mt-1">Keep studying to unlock your first NIT!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
