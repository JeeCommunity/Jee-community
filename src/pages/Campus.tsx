import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import { getLocalDate } from "../lib/utils";
import { getCampusProgress, getDailyCoins, getDailyXP } from "../lib/campusEconomy";
import { COLLEGES, getLevelFromXP, getCumulativeCoinsNeeded, getCollegeLevelRequired, getCollegePrice } from "../lib/campusEconomy";
import { Building2, Trophy, MapPin, ChevronRight, GraduationCap, Lock, Unlock, Star, Zap, Target, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import CampusCityMap from "../components/CampusCityMap";
import { Link } from "react-router-dom";

const CampusTourOverlay = ({ college, onClose }: { college: any, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center animate-in fade-in duration-1000">
      {/* Background Video */}
      <video 
        src="/nit_arunachal_new.mp4"
        autoPlay
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover bg-black"
      />
      
      {/* Sunlight/Atmosphere Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-amber-100/10 to-amber-200/20 mix-blend-overlay"></div>
      
      {/* Butterflies / Fireflies */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute" style={{
            left: `${5 + Math.random() * 90}%`,
            bottom: `${Math.random() * 50}%`,
            animation: `flutter ${10+i*2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}>
            <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[1px] shadow-[0_0_8px_rgba(253,224,71,0.8)] animate-[pulse_2s_infinite]"></div>
          </div>
        ))}
      </div>
      
      
      {/* Cinematic Bars */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/90 to-transparent z-10 flex items-start justify-end p-6">
        <button onClick={onClose} className="w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 to-transparent z-10 flex items-center justify-center">
         <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
            <h2 className="text-3xl md:text-5xl font-serif italic text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{college.name}</h2>
            <p className="text-amber-200 text-sm md:text-base tracking-[0.3em] uppercase mt-3 font-medium opacity-90">Your hard work paid off</p>
         </div>
      </div>
    </div>
  );
};

export default function Campus() {
  const [activeTab, setActiveTab] = useState<'collection' | 'city'>('collection');
  const [selectedCollegeTour, setSelectedCollegeTour] = useState<any | null>(null);

  const { user } = useAuth();
  const [mySession, setMySession] = useState<any>(null);
  const [campusStats, setCampusStats] = useState({ totalXP: 0, totalCoins: 0 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCampusData = async () => {
      try {
        const sessionSnap = await getDoc(doc(db, "study_sessions", user.uid));
        if (sessionSnap.exists()) {
          setMySession(sessionSnap.data());
        } else {
          setMySession(null);
        }
        
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.campus) {
            setCampusStats({
              totalXP: data.campus.totalXP || 0,
              totalCoins: data.campus.totalCoins || 0
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchCampusData();
  }, [user]);

  const getSessionTime = (s: any) => {
    if (!s) return 0;
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const midnight = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        total += Math.floor((Date.now() - Math.max(s.startTime, midnight)) / 1000);
      }
    } else {
      if (s.isStudying && s.startTime) {
        total += Math.floor((Date.now() - s.startTime) / 1000);
      }
    }
    return total;
  };

  const liveCoins = React.useMemo(() => {
    if (!mySession) return campusStats.totalCoins;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
      oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveCoins = getDailyCoins(currentDailyTime / 60) - getDailyCoins(oldDailyTime / 60);
    return campusStats.totalCoins + Math.max(0, addedLiveCoins);
  }, [mySession, campusStats.totalCoins, now]);

  const liveXP = React.useMemo(() => {
    if (!mySession) return campusStats.totalXP;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
      oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveXP = getDailyXP(currentDailyTime / 60) - getDailyXP(oldDailyTime / 60);
    return campusStats.totalXP + Math.max(0, addedLiveXP);
  }, [mySession, campusStats.totalXP, now]);

  const { currentLevel, unlockedRank, nextCollege, requiredLevelForNext, requiredCoinsForNext } = getCampusProgress(liveXP, liveCoins);

  return (
    <div className="min-h-screeneen bg-[#070B14] pb-20 pt-16 md:pt-0 md:pb-0 md:pl-64 text-white font-sans overflow-x-hidden">
      {selectedCollegeTour && (
        <CampusTourOverlay college={selectedCollegeTour} onClose={() => setSelectedCollegeTour(null)} />
      )}
      
      {/* Hero Section */}
      <div className="relative w-full h-[480px] md:h-[550px]">
        {/* Background Image - The Fantasy Castle/Island */}
        <div className="absolute inset-0 z-0">
            {/* Using multiple backgrounds: first is the user image (if available), second is fallback */}
            <div className="w-full h-full bg-[#0B1120]" style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200'), url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000')",
                backgroundSize: "cover",
                backgroundPosition: "center top",
            }} />
            {/* Gradients to blend with background below */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#070B14] via-[#070B14]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/30 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 md:px-10 h-full flex flex-col justify-center max-w-2xl pt-10">
          <h1 className="text-[2.5rem] md:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight leading-[1.1]">
            My Campus <br />
            <span className="text-[#3B82F6]">Collection</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-[340px] leading-relaxed mb-8">
            Earn coins and XP from study sessions to unlock your dream engineering colleges.
          </p>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2.5 px-4 py-2 bg-[#0A101D]/80 border border-white/5 rounded-2xl backdrop-blur-md">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-yellow-400 font-bold text-[15px]">{Math.floor(liveCoins).toLocaleString()}</span>
                  <span className="text-slate-400 text-xs font-medium">Coins</span>
                </div>
             </div>

             <div className="flex items-center gap-2.5 px-4 py-2 bg-[#0A101D]/80 border border-white/5 rounded-2xl backdrop-blur-md">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-blue-400 fill-current" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white font-bold text-[15px]">Level {currentLevel}</span>
                  <span className="text-slate-400 text-xs font-medium">({Math.floor(liveXP).toLocaleString()} XP)</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-10 pb-20 relative z-20 max-w-7xl mx-auto space-y-8 -mt-10">
        
        {/* Next Milestone Card */}
        {nextCollege && (
           <div className="relative overflow-hidden bg-[#10172A] border border-[#1E293B] rounded-[24px] p-6 md:p-8 shadow-2xl">
              <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none p-4">
                 <GraduationCap className="w-64 h-64 md:w-80 md:h-80" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#172554] text-[#60A5FA] rounded-full text-[10px] font-bold tracking-widest mb-4">
                 <Target className="w-3.5 h-3.5" /> NEXT MILESTONE
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-1 text-white">{nextCollege.name}</h2>
              <p className="text-slate-400 font-medium text-sm mb-8">Rank #{nextCollege.rank} • {nextCollege.type}</p>
              
              <div className="max-w-2xl space-y-6">
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                       <span className="text-slate-300">Coins</span>
                       <span><span className="text-yellow-400">{Math.min(Math.floor(liveCoins), requiredCoinsForNext).toLocaleString()}</span> <span className="text-slate-500">/ {requiredCoinsForNext.toLocaleString()}</span></span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }} />
                    </div>
                    <div className="flex justify-end mt-2.5">
                       {liveCoins >= requiredCoinsForNext ? (
                          <span className="text-emerald-500 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>
                       ) : (
                          <span className="text-xs font-medium text-slate-500">{Math.max(0, requiredCoinsForNext - Math.floor(liveCoins)).toLocaleString()} coins left</span>
                       )}
                    </div>
                 </div>
                 
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                       <span className="text-slate-300">Level Requirement</span>
                       <span><span className="text-[#3B82F6]">Level {Math.min(currentLevel, requiredLevelForNext)}</span> <span className="text-slate-500">/ {requiredLevelForNext}</span></span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${Math.min(100, (currentLevel / requiredLevelForNext) * 100)}%` }} />
                    </div>
                    <div className="flex justify-end mt-2.5">
                       {currentLevel >= requiredLevelForNext ? (
                          <span className="text-emerald-500 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>
                       ) : (
                          <span className="text-xs font-medium text-slate-500">{Math.max(0, requiredLevelForNext - currentLevel)} levels left</span>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Tabs and Counter */}
        <div className="flex flex-row items-center justify-between pt-2">
           <div className="flex items-center gap-3">
              <button onClick={() => setActiveTab('collection')} className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2", activeTab === 'collection' ? "bg-[#2563EB] text-white" : "bg-transparent border border-[#1E293B] text-slate-400 hover:text-white hover:bg-white/5")}>
                 <Building2 className="w-4 h-4" /> Collection
              </button>
           </div>
           
           {activeTab === 'collection' && (
              <div className="px-5 py-2.5 rounded-xl bg-[#0A101D]/50 border border-[#1E293B] text-sm font-bold text-slate-400">
                 <span className="text-white">{unlockedRank}</span> / {COLLEGES.length} Collected
              </div>
           )}
        </div>

        {/* Collection Grid */}
        {activeTab === 'collection' && (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {COLLEGES.map((college, idx) => {
                 const isUnlocked = idx < unlockedRank;

                 return (
                    <div 
                      key={college.id} 
                      onClick={() => { if(isUnlocked) setSelectedCollegeTour(college) }}
                      className={cn(
                       "relative rounded-[20px] overflow-hidden flex flex-col border transition-all duration-300", 
                       isUnlocked ? "bg-[#10172A] border-[#2563EB]/50 shadow-[0_0_20px_rgba(37,99,235,0.1)] hover:-translate-y-1 cursor-pointer" : "bg-[#10172A] border-[#1E293B]"
                    )}>
                       
                       {/* Image Area */}
                       <div className="relative h-[160px] w-full bg-[#070B14] overflow-hidden">
                          <img 
                            src={college.id === 1 ? "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600"} 
                            alt="" 
                            className={cn("w-full h-full object-cover", !isUnlocked && "opacity-30 grayscale blur-[1px]")}
                            onError={(e) => {
                                // Fallback if user image URL fails
                                e.currentTarget.src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600";
                            }}
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-[#10172A] via-[#10172A]/20 to-transparent" />

                          {/* Lock Icon */}
                          {!isUnlocked && (
                             <div className="absolute inset-0 flex items-center justify-center pb-4">
                                <div className="w-12 h-14 bg-[#10172A]/90 backdrop-blur-md rounded-xl border border-[#1E293B] flex items-center justify-center shadow-xl">
                                   <Lock className="w-5 h-5 text-slate-500" />
                                </div>
                             </div>
                          )}

                          {/* Rank Badge */}
                          {isUnlocked && (
                              <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider bg-[#070B14]/80 text-white backdrop-blur-md border border-white/10">
                                 RANK #{college.rank}
                              </div>
                          )}

                          {/* Logo (Only if Unlocked) */}
                          {isUnlocked && (
                             <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#1E1B4B]/90 backdrop-blur-md border border-[#6D28D9]/50 flex items-center justify-center text-[#C4B5FD] shadow-[0_0_20px_rgba(109,40,217,0.3)]">
                                   <Building2 className="w-4 h-4" />
                                </div>
                             </div>
                          )}
                       </div>

                       {/* Text Content */}
                       <div className="p-4 flex flex-col flex-1">
                          <h4 className={cn("font-bold text-[15px] line-clamp-1 mb-0.5", isUnlocked ? "text-white" : "text-slate-400")}>{college.name}</h4>
                          <p className="text-[11px] text-slate-500 mb-5 font-medium">Rank #{college.rank} • {college.type}</p>

                          <div className="mt-auto flex items-center justify-between">
                             <div className="flex items-center gap-1.5">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isUnlocked ? "bg-yellow-500/20" : "bg-[#1E293B]")}>
                                  <Star className={cn("w-3 h-3 fill-current", isUnlocked ? "text-yellow-400" : "text-slate-500")} />
                                </div>
                                <span className={cn("text-[13px] font-bold", isUnlocked ? "text-yellow-400" : "text-yellow-600/70")}>{getCumulativeCoinsNeeded(college.id).toLocaleString()}</span>
                             </div>
                             <div className={cn("text-[12px] font-bold", isUnlocked ? "text-[#3B82F6]" : "text-blue-800/70")}>
                                LVL {getCollegeLevelRequired(college.id)}
                             </div>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        )}

        {/* Bottom Banner */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#334155] p-6 md:p-8 flex items-center justify-between mt-8 shadow-2xl">
           <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Collect All. Be The Best.</h3>
              <p className="text-slate-400 text-sm">Unlock all colleges and become the ultimate achiever!</p>
           </div>
           <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 opacity-90">
              <img src="https://img.icons8.com/3d-fluency/188/crown.png" alt="Crown" className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.2)]" />
           </div>
        </div>

      </div>
    </div>
  );
}
