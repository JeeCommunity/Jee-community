import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """            {nextCollege && requiredCoinsForNext && (
              <div className="w-full bg-slate-900/40 rounded-xl p-3 border border-slate-700/50 mb-3 shadow-inner">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-300">Next: {nextCollege.name}</span>
                  <span className="text-yellow-400">{(requiredCoinsForNext - liveCoins).toLocaleString()} Coins Left</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                    style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }}
                  />
                </div>
              </div>
            )}"""

replacement = """            {nextCollege && requiredCoinsForNext && (
              <div className="w-full bg-slate-900/40 rounded-xl p-3 border border-slate-700/50 mb-3 shadow-inner flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-300">Next: {nextCollege.name}</div>
                
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className="text-slate-400">Coins</span>
                    <span className="text-yellow-400">{Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} Left</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                      style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className="text-slate-400">Level</span>
                    <span className="text-blue-400">{Math.max(0, (nextCollege ? getCollegeLevelRequired(nextCollege.id) : 0) - currentLevel)} Left</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${Math.min(100, (currentLevel / (nextCollege ? getCollegeLevelRequired(nextCollege.id) : 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("Could not find target")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

