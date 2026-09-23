import re

file_path = "src/pages/Campus.tsx"
with open(file_path, "r") as f:
    content = f.read()

grid_code = """
        {/* Collection Grid */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-white">Detailed Collection</h3>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold">
              {unlockedRank} / {COLLEGES.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLLEGES.map((college, idx) => {
              const isUnlocked = idx < unlockedRank;
              const isNext = idx === unlockedRank;
              
              return (
                <div 
                  key={college.id} 
                  className={cn(
                    "relative p-5 rounded-2xl border transition-all duration-300",
                    isUnlocked ? "bg-slate-800/80 border-slate-700 hover:border-slate-500" : 
                    isNext ? "bg-slate-800/30 border-blue-500/30" : 
                    "bg-slate-900/50 border-slate-800 opacity-60"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isUnlocked ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
                    )}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Rank #{college.id}
                    </div>
                  </div>
                  
                  <h4 className={cn(
                    "text-lg font-bold leading-tight mb-1",
                    isUnlocked ? "text-white" : "text-slate-400"
                  )}>{college.name}</h4>
                  
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {college.type}
                  </p>
                  
                  {!isUnlocked && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Coins</span>
                        <span className={campusStats.totalCoins >= getCumulativeCoinsNeeded(college.id) ? "text-green-400" : "text-yellow-500/70"}>
                          {getCumulativeCoinsNeeded(college.id).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Level</span>
                        <span className={currentLevel >= getCollegeLevelRequired(college.id) ? "text-green-400" : "text-blue-500/70"}>
                          Lvl {getCollegeLevelRequired(college.id)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {isUnlocked && (
                    <div className="absolute top-4 right-4 text-green-400">
                      <Unlock className="w-4 h-4" />
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="absolute top-4 right-4 text-slate-600">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
"""

new_content = content.replace("        </div>\n      </div>\n    </div>\n  );\n}", "        </div>\n" + grid_code + "\n      </div>\n    </div>\n  );\n}")

with open(file_path, "w") as f:
    f.write(new_content)
