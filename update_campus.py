import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

# Add CheckCircle2 to imports
if "Target } from" in content:
    content = content.replace("Target } from", "Target, CheckCircle2 } from")

# Fix coins display
target_coins = """                 <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                       <span className="text-slate-300">Coins</span>
                       <span><span className="text-yellow-400">{Math.floor(liveCoins).toLocaleString()}</span> <span className="text-slate-500">/ {requiredCoinsForNext.toLocaleString()}</span></span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-right mt-2.5">{Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} coins left</p>
                 </div>"""

replacement_coins = """                 <div>
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
                 </div>"""

if target_coins in content:
    content = content.replace(target_coins, replacement_coins)
else:
    print("Could not find target_coins")

# Fix levels display
target_levels = """                 <div>
                    <div className="flex justify-between text-sm font-bold mb-3">
                       <span className="text-slate-300">Level Requirement</span>
                       <span><span className="text-[#3B82F6]">Level {currentLevel}</span> <span className="text-slate-500">/ {requiredLevelForNext}</span></span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                       <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${Math.min(100, (currentLevel / requiredLevelForNext) * 100)}%` }} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-right mt-2.5">{Math.max(0, requiredLevelForNext - currentLevel)} levels left</p>
                 </div>"""

replacement_levels = """                 <div>
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
                 </div>"""

if target_levels in content:
    content = content.replace(target_levels, replacement_levels)
else:
    print("Could not find target_levels")

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)

