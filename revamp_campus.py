import re

with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

# I will replace the render return statement completely.
# Let's find everything from `return (` to the end.

# Regex to match the return statement body
match = re.search(r"return \(\s*(<div className=\"min-h-screen.*?);\s*\}\s*$", content, re.DOTALL)
if match:
    old_return = match.group(1)
else:
    print("Could not find return statement")
    exit(1)

new_return = """<div className="min-h-screen bg-[#060B19] pb-20 pt-16 md:pt-0 md:pb-0 md:pl-64 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Header Section with Space Theme */}
      <div className="relative w-full h-[450px] md:h-[500px]">
        {/* Background Image / Gradients */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B19]/10 via-[#060B19]/60 to-[#060B19]" />
        
        {/* Fantasy Floating Island Placeholder (Right side) */}
        <div className="absolute right-0 top-0 w-full md:w-2/3 h-full opacity-60 md:opacity-80 pointer-events-none" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1200&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "right center",
            maskImage: "linear-gradient(to left, black 50%, transparent 100%), linear-gradient(to bottom, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 100%), linear-gradient(to bottom, black 50%, transparent 100%)"
        }} />

        {/* Content */}
        <div className="relative z-10 p-6 md:p-10 flex flex-col justify-center h-full max-w-4xl pt-12 md:pt-20">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
            My Campus <br className="hidden md:block" />
            <span className="text-blue-400">Collection</span>
          </h1>
          <p className="text-slate-300 md:text-lg max-w-md mb-8 drop-shadow-md">
            Earn coins and XP from study sessions to unlock your dream engineering colleges.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-none">{liveCoins.toLocaleString()}</div>
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Coins</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400 fill-current" />
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-none">Level {currentLevel}</div>
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">({Math.floor(liveXP).toLocaleString()} XP)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 pb-20 -mt-10 relative z-20 max-w-7xl mx-auto space-y-8">
        {/* Next Milestone */}
        {nextCollege && (
          <div className="relative overflow-hidden bg-[#0A1128] border border-blue-900/50 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute right-0 top-0 p-8 opacity-5 pointer-events-none">
              <GraduationCap className="w-64 h-64 text-blue-300" />
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5 border border-blue-500/20">
                <Target className="w-3.5 h-3.5" /> Next Milestone
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black mb-1 text-white">{nextCollege.name}</h2>
              <p className="text-blue-200/50 font-medium text-sm mb-10">Rank #{nextCollege.id} &bull; {nextCollege.type}</p>
              
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm font-bold items-end">
                    <span className="text-slate-300">Coins</span>
                    <div className="text-right">
                      <span className="text-yellow-400">{liveCoins.toLocaleString()}</span>
                      <span className="text-slate-500"> / {requiredCoinsForNext.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-[#060B19] rounded-full overflow-hidden border border-slate-800/50 inset-shadow-sm">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                      style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 text-right">
                    {Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} coins left
                  </p>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm font-bold items-end">
                    <span className="text-slate-300">Level Requirement</span>
                    <div className="text-right">
                      <span className="text-blue-400">Level {currentLevel}</span>
                      <span className="text-slate-500"> / {requiredLevelForNext}</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-[#060B19] rounded-full overflow-hidden border border-slate-800/50 inset-shadow-sm">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${Math.min(100, (currentLevel / requiredLevelForNext) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 text-right">
                    {Math.max(0, requiredLevelForNext - currentLevel)} levels left
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('collection')}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                activeTab === 'collection' ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-slate-400 bg-[#0A1128] border border-slate-800 hover:text-white"
              )}
            >
              <Building2 className="w-4 h-4" /> Collection
            </button>
            <button
              onClick={() => setActiveTab('city')}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                activeTab === 'city' ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-slate-400 bg-[#0A1128] border border-slate-800 hover:text-white"
              )}
            >
              <MapPin className="w-4 h-4" /> City View
            </button>
          </div>
          
          {activeTab === 'collection' && (
            <div className="text-slate-400 font-medium text-sm flex items-center gap-2 bg-[#0A1128] border border-slate-800 px-4 py-2 rounded-xl">
              <span className="text-white font-bold">{unlockedRank} / {COLLEGES.length}</span> Collected
            </div>
          )}
        </div>

        {/* Collection Grid */}
        {activeTab === 'city' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#0A1128] p-2 rounded-3xl border border-slate-800">
            <CampusCityMap colleges={COLLEGES} unlockedRank={unlockedRank} />
          </div>
        )}

        {activeTab === 'collection' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {COLLEGES.map((college, idx) => {
              const isUnlocked = idx < unlockedRank;
              const isNext = idx === unlockedRank;
              
              return (
                <div 
                  key={college.id} 
                  className={cn(
                    "group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col h-[280px] md:h-[320px]",
                    isUnlocked ? "bg-[#0A1128] border-blue-500/30 hover:border-blue-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)]" : 
                    isNext ? "bg-[#0A1128] border-yellow-500/30 hover:border-yellow-400/50" : 
                    "bg-[#060B19] border-slate-800/80"
                  )}
                >
                  {/* Card Image Area */}
                  <div className="absolute inset-0 h-[65%] w-full bg-slate-800 overflow-hidden">
                    {/* Background Image */}
                    <img 
                      src={isUnlocked || isNext 
                        ? "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400&auto=format&fit=crop" 
                        : "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop"} 
                      alt="" 
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
                        !isUnlocked && !isNext ? "opacity-30 grayscale sepia-[.2] hue-rotate-180" : "opacity-80"
                      )}
                    />
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-[#0A1128]/80 to-transparent" />
                    {!isUnlocked && !isNext && (
                      <div className="absolute inset-0 bg-[#060B19]/50" />
                    )}
                  </div>

                  {/* Lock Icon */}
                  {!isUnlocked && (
                    <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-[#060B19]/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center text-slate-400 shadow-xl">
                      <Lock className="w-5 h-5" />
                    </div>
                  )}

                  {/* Rank Badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[9px] font-bold tracking-wider text-slate-300">
                    RANK #{college.id}
                  </div>
                  
                  {/* Content Area */}
                  <div className="relative z-10 flex-1 flex flex-col justify-end p-4 pb-5">
                    {/* College Icon / Logo */}
                    {isUnlocked && (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <Building2 className="w-4 h-4" />
                      </div>
                    )}

                    <h4 className={cn(
                      "font-bold leading-tight line-clamp-2",
                      isUnlocked ? "text-white text-lg" : "text-slate-300 text-base mb-1"
                    )}>{college.name}</h4>
                    
                    <p className="text-[11px] font-medium text-slate-500 mt-1 mb-auto">
                      {college.type}
                    </p>
                    
                    {/* Requirements Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
                      {isUnlocked ? (
                        <>
                          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {getCumulativeCoinsNeeded(college.id).toLocaleString()}
                          </div>
                          <div className="text-blue-400 text-xs font-bold">
                            LVL {getCollegeLevelRequired(college.id)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs font-bold",
                            liveCoins >= getCumulativeCoinsNeeded(college.id) ? "text-green-400" : "text-yellow-500/50"
                          )}>
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {getCumulativeCoinsNeeded(college.id).toLocaleString()}
                          </div>
                          <div className={cn(
                            "text-xs font-bold",
                            currentLevel >= getCollegeLevelRequired(college.id) ? "text-green-400" : "text-blue-500/50"
                          )}>
                            LVL {getCollegeLevelRequired(college.id)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Bottom Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A1128] via-[#111836] to-[#0A1128] border border-blue-900/30 p-8 flex items-center justify-between mt-8 shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white mb-2">Collect All. Be The Best.</h3>
            <p className="text-slate-400 text-sm font-medium">Unlock all colleges and become the ultimate achiever!</p>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-40 mix-blend-screen pointer-events-none">
            <img src="https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop" alt="" className="w-64 h-64 object-cover rounded-full blur-xl" />
          </div>
        </div>

      </div>
    </div>"""

content = content.replace(old_return, new_return)

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
