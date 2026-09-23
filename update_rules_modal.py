import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# 1. Add state
state_target = """  const [todayStr, setTodayStr] = useState(new Date().toDateString());"""
state_replacement = """  const [todayStr, setTodayStr] = useState(new Date().toDateString());
  const [showRulesModal, setShowRulesModal] = useState(false);"""
if state_target in content:
    content = content.replace(state_target, state_replacement)
    print("Added state")

# 2. Add toggle button
title_target = """            <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1.5">
              Live Study Room
            </h2>"""
title_replacement = """            <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1.5">
              Live Study Room
              <button onClick={() => setShowRulesModal(true)} className="ml-1 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <Info className="w-3.5 h-3.5 text-white" />
              </button>
            </h2>"""
if title_target in content:
    content = content.replace(title_target, title_replacement)
    print("Added toggle button")

# 3. Remove old static rules
rules_target = """            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 w-full">
              <div className="flex items-center gap-1.5 text-blue-200">
                 <Info className="w-3.5 h-3.5 shrink-0" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Study Room Rules</span>
              </div>
              <ul className="text-[10px] text-blue-100/70 space-y-1.5 pl-4 list-disc">
                <li><span className="font-semibold text-white">18 Hours Daily Limit:</span> You can study up to 18 hours per day to maintain healthy habits.</li>
                <li><span className="font-semibold text-white">3-Hour Slots:</span> The timer auto-stops every 3 hours. You must manually start it again to continue.</li>
                <li><span className="font-semibold text-white">Midnight Reset:</span> Daily time and goals automatically reset at 12:00 AM.</li>
              </ul>
            </div>"""
if rules_target in content:
    content = content.replace(rules_target, "")
    print("Removed old static rules")

# 4. Add modal at the bottom
modal_target = """      {selectedUserForProfile && ("""
modal_replacement = """      {showRulesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                Study Room Rules
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">18 Hours Daily Limit</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    You can study up to 18 hours per day to maintain healthy habits.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">3-Hour Slots</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    To prevent fake study time, the timer automatically stops every 3 hours. You must manually start it again to continue.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Midnight Reset</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Daily time and goals automatically reset at 12:00 AM local time.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserForProfile && ("""
if modal_target in content:
    content = content.replace(modal_target, modal_replacement)
    print("Added modal")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

