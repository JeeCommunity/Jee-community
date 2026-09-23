import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

parts = content.split("  return (\n    <div className=\"min-h-screen")
if len(parts) != 2:
    print("Error splitting on main return")
    sys.exit(1)

new_jsx = """    <div className="min-h-screen bg-[#070B14] pb-20 pt-16 md:pt-0 md:pb-0 md:pl-64 text-white font-sans overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative w-full h-[480px] md:h-[550px]">
        {/* Background Image - The Fantasy Castle/Island */}
        <div className="absolute inset-0 z-0">
            {/* Using multiple backgrounds: first is the user image (if available), second is fallback */}
            <div className="w-full h-full bg-[#0B1120]" style={{
                backgroundImage: "url('https://storage.googleapis.com/aistudio-build-prod-user-content-1/0ab54332-6a6c-4977-bad8-25b292e4ccaf_08e82ef6-a604-41d5-bc44-883a45c74be8_image.png'), url('https://storage.googleapis.com/aistudio-build-prod-user-content-1/b52c00ed-7193-41bb-ad3c-a9ebc6e267d3_08e82ef6-a604-41d5-bc44-883a45c74be8_image.png'), url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000')",
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
                  <span className="text-yellow-400 font-bold text-[15px]">{liveCoins.toLocaleString()}</span>
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
              <p className="text-slate-400 font-medium text-sm mb-8">Rank #{nextCollege.id} • {nextCollege.type}</p>
              
              <div className="max-w-2xl space-y-6">
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                       <span className="text-slate-300">Coins</span>
                       <span><span className="text-yellow-400">{liveCoins.toLocaleString()}</span> <span className="text-slate-500">/ {requiredCoinsForNext.toLocaleString()}</span></span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-right mt-2.5">{Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} coins left</p>
                 </div>
                 
                 <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                       <span className="text-slate-300">Level Requirement</span>
                       <span><span className="text-[#3B82F6]">Level {currentLevel}</span> <span className="text-slate-500">/ {requiredLevelForNext}</span></span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${Math.min(100, (currentLevel / requiredLevelForNext) * 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-right mt-2.5">{Math.max(0, requiredLevelForNext - currentLevel)} levels left</p>
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
              <div className="px-5 py-2.5 rounded-xl bg-[#0A101D]/50 border border-[#1E293B] text-sm font-bold text-slate-400">
                 <span className="text-white">{unlockedRank}</span> / {COLLEGES.length} Collected
              </div>
           )}
        </div>

        {activeTab === 'city' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#10172A] p-2 rounded-[24px] border border-[#1E293B]">
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
                       "relative rounded-[20px] overflow-hidden flex flex-col border transition-all duration-300", 
                       isUnlocked ? "bg-[#10172A] border-[#2563EB]/50 shadow-[0_0_20px_rgba(37,99,235,0.1)] hover:-translate-y-1" : "bg-[#10172A] border-[#1E293B]"
                    )}>
                       
                       {/* Image Area */}
                       <div className="relative h-[160px] w-full bg-[#070B14] overflow-hidden">
                          <img 
                            src={college.id === 1 ? "https://storage.googleapis.com/aistudio-build-prod-user-content-1/0ab54332-6a6c-4977-bad8-25b292e4ccaf_08e82ef6-a604-41d5-bc44-883a45c74be8_image.png" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600"} 
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
                                 RANK #{college.id}
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
                          <p className="text-[11px] text-slate-500 mb-5 font-medium">Rank #{college.id} • {college.type}</p>

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
"""
with open('src/pages/Campus.tsx', 'w') as f:
    f.write(parts[0] + "  return (\n    <div className=\"min-h-screen" + new_jsx[29:])

