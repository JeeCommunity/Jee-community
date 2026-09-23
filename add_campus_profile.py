import re

file_path = "src/components/UserProfileModal.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add calculations before return (around line 170)
calc_code = """
  const { currentLevel, nextCollege } = getCampusProgress(campusStats.totalXP, campusStats.totalCoins);
"""

# Let's just find `const sortedDates = ` to put it before it.
if "getCampusProgress(" not in content.split("const sortedDates")[0]:
    content = content.replace("const sortedDates =", calc_code + "\n  const sortedDates =")

# Add the UI right before {/* WEEKLY HISTORY */}
ui_code = """
                {/* DREAM COLLEGE PROGRESS */}
                {nextCollege && (
                  <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 mb-4">
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
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold">{campusStats.totalCoins.toLocaleString()} Coins</p>
                      </div>
                    </div>
                  </div>
                )}
"""

content = content.replace("{/* WEEKLY HISTORY */}", ui_code + "\n                {/* WEEKLY HISTORY */}")

with open(file_path, "w") as f:
    f.write(content)
