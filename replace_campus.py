import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

parts = content.split("  return (\n    <div className=\"min-h-screen")
if len(parts) != 2:
    print("Error splitting on main return")
    sys.exit(1)

new_jsx = """    <div className="min-h-screen bg-[#020617] pb-20 pt-16 md:pt-0 md:pb-0 md:pl-64 text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      {/* Header section with exact layout */}
      <div className="relative w-full overflow-hidden min-h-[450px]">
        {/* Background elements */}
        <div className="absolute inset-0 bg-[#020617] z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=2000')] opacity-30 mix-blend-screen z-0" />
        
        {/* The island graphic */}
        <div className="absolute top-0 right-0 w-full md:w-[70%] h-full z-10" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1614729939124-03290b56c9ce?auto=format&fit=crop&q=80&w=1200')", 
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to right, transparent 0%, black 50%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 50%)"
        }} />
        <div className="absolute top-0 right-0 w-full md:w-[70%] h-[120%] z-10 -translate-y-[10%]" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000')", 
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center right",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 70%)"
        }} />

        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />

        <div className="relative z-20 px-6 md:px-10 py-12 md:py-20 flex flex-col justify-center h-full max-w-5xl">
          <h1 className="text-[2.75rem] md:text-6xl font-black text-white mb-2 leading-[1.1] tracking-tight">
            My Campus <br className="hidden md:block" />
            <span className="text-[#3B82F6]">Collection</span>
          </h1>
          <p className="text-slate-300 text-[15px] md:text-lg max-w-[320px] md:max-w-md mb-8 leading-relaxed">
            Earn coins and XP from study sessions to unlock your dream engineering colleges.
          </p>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2 bg-[#0B1221]/80 border border-slate-700/50 rounded-xl shadow-lg backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-yellow-400 font-bold text-[15px] leading-tight">{liveCoins.toLocaleString()}</span>
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider leading-tight">Coins</span>
                </div>
             </div>

             <div className="flex items-center gap-3 px-4 py-2 bg-[#0B1221]/80 border border-slate-700/50 rounded-xl shadow-lg backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Zap className="w-4 h-4 text-blue-400 fill-current" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-white font-bold text-[15px] leading-tight">Level {currentLevel}</span>
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider leading-tight">({Math.floor(liveXP).toLocaleString()} XP)</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-10 pb-20 -mt-6 relative z-30 max-w-7xl mx-auto space-y-8">
        
        {/* Next Milestone */}
        {nextCollege && (
           <div className="relative overflow-hidden bg-[#0A101E] border border-[#1A2642] rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
                 <GraduationCap className="w-64 h-64" />
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141E33] text-[#60A5FA] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#1E2E4F]">
                 <Target className="w-3 h-3" /> NEXT MILESTONE
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-1 text-white tracking-tight">{nextCollege.name}</h2>
              <p className="text-slate-400 font-medium text-sm mb-10">Rank #{nextCollege.id} &bull; {nextCollege.type}</p>
              
              <div className="max-w-2xl space-y-6 relative z-10">
                 <div>
                    <div className="flex justify-between text-[13px] font-bold mb-2">
                       <span className="text-slate-300">Coins</span>
                       <span className="text-yellow-400">{liveCoins.toLocaleString()} <span className="text-slate-500">/ {requiredCoinsForNext.toLocaleString()}</span></span>
                    </div>
                    <div className="h-[6px] w-full bg-[#162035] rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }} />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 text-right mt-2">{Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} coins left</p>
                 </div>
                 
                 <div>
                    <div className="flex justify-between text-[13px] font-bold mb-2">
                       <span className="text-slate-300">Level Requirement</span>
                       <span className="text-[#3B82F6]">Level {currentLevel} <span className="text-slate-500">/ {requiredLevelForNext}</span></span>
                    </div>
                    <div className="h-[6px] w-full bg-[#162035] rounded-full overflow-hidden">
                       <div className="h-full bg-[#3B82F6] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, (currentLevel / requiredLevelForNext) * 100)}%` }} />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 text-right mt-2">{Math.max(0, requiredLevelForNext - currentLevel)} levels left</p>
                 </div>
              </div>
           </div>
        )}

        {/* Tabs */}
        <div className="flex flex-row items-center justify-between pt-2">
           <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab('collection')} className={cn("px-5 py-2.5 rounded-[10px] font-semibold text-[13px] transition-all flex items-center gap-2", activeTab === 'collection' ? "bg-[#2563EB] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-transparent border border-[#1A2642] text-slate-400 hover:text-white hover:bg-white/5")}>
                 <Building2 className="w-4 h-4" /> Collection
              </button>
              <button onClick={() => setActiveTab('city')} className={cn("px-5 py-2.5 rounded-[10px] font-semibold text-[13px] transition-all flex items-center gap-2", activeTab === 'city' ? "bg-[#2563EB] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-transparent border border-[#1A2642] text-slate-400 hover:text-white hover:bg-white/5")}>
                 <MapPin className="w-4 h-4" /> City View
              </button>
           </div>
           
           {activeTab === 'collection' && (
              <div className="px-4 py-2 rounded-[10px] bg-transparent border border-[#1A2642] text-[13px] font-semibold text-slate-400 hidden sm:block">
                 <span className="text-white">{unlockedRank}</span> / {COLLEGES.length} Collected
              </div>
           )}
        </div>

        {activeTab === 'city' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#0A101E] p-2 rounded-2xl border border-[#1A2642]">
              <CampusCityMap colleges={COLLEGES} unlockedRank={unlockedRank} />
           </div>
        )}

        {activeTab === 'collection' && (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {COLLEGES.map((college, idx) => {
                 const isUnlocked = idx < unlockedRank;

                 return (
                    <div key={college.id} className={cn(
                       "relative rounded-[16px] overflow-hidden flex flex-col transition-all duration-300", 
                       isUnlocked ? "bg-[#0A101E] border-2 border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:-translate-y-1" : "bg-[#0A101E] border border-[#1A2642]"
                    )}>
                       
                       {/* Image Section */}
                       <div className="relative h-[160px] w-full overflow-hidden bg-[#020617]">
                          <img 
                            src={isUnlocked ? "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400"} 
                            alt="" 
                            className={cn("w-full h-full object-cover transition-transform duration-700", !isUnlocked ? "opacity-40 saturate-0 contrast-125 brightness-[0.6]" : "opacity-90")} 
                          />
                          
                          <div className={cn("absolute inset-0", isUnlocked ? "bg-gradient-to-t from-[#0A101E] via-[#0A101E]/40 to-transparent" : "bg-gradient-to-t from-[#0A101E] via-[#0A101E]/60 to-[#0A101E]/20")} />

                          {/* Lock Icon Overlay for Locked Cards */}
                          {!isUnlocked && (
                             <div className="absolute inset-0 flex items-center justify-center pb-4">
                                <div className="w-12 h-14 bg-[#0A101E]/80 backdrop-blur-md rounded-[12px] border border-[#1A2642] flex items-center justify-center shadow-xl relative overflow-hidden">
                                   <Lock className="w-5 h-5 text-slate-400 z-10" />
                                </div>
                             </div>
                          )}

                          {/* Rank Badge */}
                          <div className={cn(
                              "absolute top-2 right-2 px-2 py-0.5 backdrop-blur-md rounded text-[10px] font-bold tracking-wider",
                              isUnlocked ? "bg-black/60 text-white border border-white/20" : "bg-black/80 text-slate-400 border border-slate-700"
                          )}>
                             RANK #{college.id}
                          </div>

                          {/* College Icon / Logo for Unlocked */}
                          {isUnlocked && (
                             <div className="absolute bottom-2 left-3 w-10 h-10 rounded-xl bg-[#2D1B69]/90 backdrop-blur-sm border border-[#6D28D9]/50 flex items-center justify-center text-[#C4B5FD] shadow-[0_0_15px_rgba(109,40,217,0.4)]">
                                <Building2 className="w-5 h-5" />
                             </div>
                          )}
                       </div>

                       {/* Content Section */}
                       <div className="p-3.5 pt-1 flex flex-col flex-1">
                          <h4 className={cn("font-bold text-[15px] line-clamp-2 leading-tight mb-0.5", isUnlocked ? "text-white" : "text-slate-400")}>{college.name}</h4>
                          <p className="text-[11px] text-slate-500 mb-4">Rank #{college.id} &bull; {college.type}</p>

                          <div className="mt-auto flex items-center justify-between">
                             <div className="flex items-center gap-1.5">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isUnlocked ? "bg-yellow-500/20" : "bg-yellow-500/5")}>
                                   <Star className={cn("w-3 h-3 fill-current", isUnlocked ? "text-yellow-400" : "text-yellow-600/50")} />
                                </div>
                                <span className={cn("text-[13px] font-bold", isUnlocked ? "text-yellow-400" : "text-yellow-600/70")}>{getCumulativeCoinsNeeded(college.id).toLocaleString()}</span>
                             </div>
                             <div className={cn("text-[13px] font-bold tracking-wide", isUnlocked ? "text-[#3B82F6]" : "text-blue-800/70")}>
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F1527] via-[#1A223D] to-[#0F1527] border border-[#1E2E4F] p-6 md:p-8 flex items-center justify-between mt-8 shadow-2xl">
           <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">Collect All. Be The Best.</h3>
              <p className="text-slate-400 text-sm font-medium">Unlock all colleges and become the ultimate achiever!</p>
           </div>
           <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-100 flex items-center justify-end pointer-events-none">
              <img src="https://img.icons8.com/3d-fluency/188/crown.png" alt="Crown" className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_0_30px_rgba(250,204,21,0.3)] transform translate-x-4 md:-translate-x-4" />
           </div>
        </div>

      </div>
    </div>
  );
}
"""

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(parts[0] + "  return (\n    <div className=\"min-h-screen" + new_jsx[29:])

