import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

parts = content.split("  return (\n    <div className=\"min-h-screen")
if len(parts) != 2:
    print("Error splitting on main return")
    sys.exit(1)

new_jsx = """    <div className="min-h-screen bg-[#030712] pb-20 pt-16 md:pt-0 md:pb-0 md:pl-64 text-white font-sans overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative w-full h-[400px] md:h-[450px] overflow-hidden">
        {/* Background Base */}
        <div className="absolute inset-0 bg-[#030712]" />
        
        {/* Stars/Space background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000')] opacity-50 mix-blend-screen" />
        
        {/* Floating Island Image (Placeholder) */}
        {/* TODO: Replace this URL with the uploaded image URL once the user uploads it */}
        <div className="absolute right-0 top-0 w-full md:w-[65%] h-full" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1614729939124-03290b56c9ce?q=80&w=1200')", 
            backgroundSize: "cover",
            backgroundPosition: "center right",
            maskImage: "linear-gradient(to right, transparent, black 30%)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 30%)"
        }} />
        
        {/* Gradients for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#030712]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 px-6 md:px-10 h-full flex flex-col justify-center max-w-4xl pt-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-tight">
            My Campus <br />
            <span className="text-[#3B82F6]">Collection</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-[280px] md:max-w-md mb-8 leading-relaxed">
            Earn coins and XP from study sessions to unlock your dream engineering colleges.
          </p>

          <div className="flex items-center gap-4">
             {/* Coins Pill */}
             <div className="flex items-center gap-3 px-4 py-2 bg-[#0F172A]/80 border border-slate-700/50 rounded-2xl backdrop-blur-md shadow-lg">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-yellow-400 font-bold text-lg leading-none">{liveCoins.toLocaleString()}</span>
                  <span className="text-slate-400 text-[11px] font-medium leading-tight mt-0.5">Coins</span>
                </div>
             </div>

             {/* Level Pill */}
             <div className="flex items-center gap-3 px-4 py-2 bg-[#0F172A]/80 border border-slate-700/50 rounded-2xl backdrop-blur-md shadow-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg leading-none">Level {currentLevel}</span>
                  <span className="text-slate-400 text-[11px] font-medium leading-tight mt-0.5">({Math.floor(liveXP).toLocaleString()} XP)</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-10 pb-20 relative z-20 max-w-7xl mx-auto space-y-8 -mt-6">
        
        {/* Next Milestone Card */}
        {nextCollege && (
           <div className="relative overflow-hidden bg-[#0F172A] border border-[#1E293B] rounded-[24px] p-6 md:p-8 shadow-xl">
              <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none p-4">
                 <GraduationCap className="w-64 h-64 md:w-80 md:h-80" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] text-[#60A5FA] rounded-full text-[10px] font-bold tracking-widest mb-4">
                 <Target className="w-3.5 h-3.5" /> NEXT MILESTONE
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-1 text-white">{nextCollege.name}</h2>
              <p className="text-slate-400 font-medium text-sm mb-8">Rank #{nextCollege.id} • {nextCollege.type}</p>
              
              <div className="max-w-2xl space-y-6">
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                       <span className="text-slate-300">Coins</span>
                       <span><span className="text-yellow-400">{liveCoins.toLocaleString()}</span> <span className="text-slate-500">/ {requiredCoinsForNext.toLocaleString()}</span></span>
                    </div>
                    <div className="h-2.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-right mt-2">{Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} coins left</p>
                 </div>
                 
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                       <span className="text-slate-300">Level Requirement</span>
                       <span><span className="text-[#3B82F6]">Level {currentLevel}</span> <span className="text-slate-500">/ {requiredLevelForNext}</span></span>
                    </div>
                    <div className="h-2.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${Math.min(100, (currentLevel / requiredLevelForNext) * 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-right mt-2">{Math.max(0, requiredLevelForNext - currentLevel)} levels left</p>
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
              <button onClick={() => setActiveTab('city')} className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2", activeTab === 'city' ? "bg-[#2563EB] text-white" : "bg-transparent border border-[#1E293B] text-slate-400 hover:text-white hover:bg-white/5")}>
                 <MapPin className="w-4 h-4" /> City View
              </button>
           </div>
           
           {activeTab === 'collection' && (
              <div className="px-5 py-2.5 rounded-xl bg-transparent border border-[#1E293B] text-sm font-bold text-slate-400 hidden sm:block">
                 <span className="text-white">{unlockedRank}</span> / {COLLEGES.length} Collected
              </div>
           )}
        </div>

        {activeTab === 'city' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#0F172A] p-2 rounded-2xl border border-[#1E293B]">
              <CampusCityMap colleges={COLLEGES} unlockedRank={unlockedRank} />
           </div>
        )}

        {/* Collection Grid */}
        {activeTab === 'collection' && (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {COLLEGES.map((college, idx) => {
                 const isUnlocked = idx < unlockedRank;

                 return (
                    <div key={college.id} className={cn(
                       "relative rounded-2xl overflow-hidden flex flex-col border transition-all duration-300", 
                       isUnlocked ? "bg-[#0F172A] border-[#2563EB] shadow-lg hover:-translate-y-1" : "bg-[#0F172A] border-[#1E293B]"
                    )}>
                       
                       {/* Image Area */}
                       <div className="relative h-[180px] w-full bg-[#030712] overflow-hidden">
                          <img 
                            src={isUnlocked ? "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400"} 
                            alt="" 
                            className={cn("w-full h-full object-cover", !isUnlocked && "opacity-30 grayscale")} 
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/20 to-transparent" />

                          {/* Lock Icon */}
                          {!isUnlocked && (
                             <div className="absolute inset-0 flex items-center justify-center pb-6">
                                <div className="w-12 h-14 bg-[#0F172A]/90 backdrop-blur-md rounded-2xl border border-[#1E293B] flex items-center justify-center shadow-xl">
                                   <Lock className="w-5 h-5 text-slate-400" />
                                </div>
                             </div>
                          )}

                          {/* Rank Badge */}
                          <div className={cn(
                              "absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider",
                              isUnlocked ? "bg-black/60 text-white backdrop-blur-md border border-white/10" : "bg-black/80 text-slate-400 border border-slate-700"
                          )}>
                             RANK #{college.id}
                          </div>

                          {/* Logo (Only if Unlocked) */}
                          {isUnlocked && (
                             <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-[#2D1B69]/90 backdrop-blur-md border border-[#6D28D9]/50 flex items-center justify-center text-[#C4B5FD] shadow-[0_0_15px_rgba(109,40,217,0.3)]">
                                   <Building2 className="w-5 h-5" />
                                </div>
                             </div>
                          )}
                       </div>

                       {/* Text Content */}
                       <div className="p-4 flex flex-col flex-1">
                          <h4 className={cn("font-bold text-base line-clamp-1 mb-1", isUnlocked ? "text-white" : "text-slate-400")}>{college.name}</h4>
                          <p className="text-[11px] text-slate-500 mb-5">Rank #{college.id} • {college.type}</p>

                          <div className="mt-auto flex items-center justify-between">
                             <div className="flex items-center gap-1.5">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isUnlocked ? "bg-yellow-500/20" : "")}>
                                  <Star className={cn("w-3.5 h-3.5 fill-current", isUnlocked ? "text-yellow-400" : "text-yellow-600/70")} />
                                </div>
                                <span className={cn("text-sm font-bold", isUnlocked ? "text-yellow-400" : "text-yellow-600/70")}>{getCumulativeCoinsNeeded(college.id).toLocaleString()}</span>
                             </div>
                             <div className={cn("text-sm font-bold", isUnlocked ? "text-[#3B82F6]" : "text-blue-800/70")}>
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
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Collect All. Be The Best.</h3>
              <p className="text-slate-400 text-sm">Unlock all colleges and become the ultimate achiever!</p>
           </div>
           <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 opacity-90">
              <img src="https://img.icons8.com/3d-fluency/188/crown.png" alt="Crown" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.2)]" />
           </div>
        </div>

      </div>
    </div>
  );
}
"""
with open('src/pages/Campus.tsx', 'w') as f:
    f.write(parts[0] + "  return (\n    <div className=\"min-h-screen" + new_jsx[29:])

