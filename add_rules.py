import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """              <div className="flex items-center gap-2 w-full">
                <button onClick={togglePip} className="flex-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <PictureInPicture className="w-3 h-3" /> PiP
                </button>
                <button onClick={spawnNotification} className="flex-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <Bell className="w-3 h-3" /> Notify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>"""

replacement = """              <div className="flex items-center gap-2 w-full">
                <button onClick={togglePip} className="flex-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <PictureInPicture className="w-3 h-3" /> PiP
                </button>
                <button onClick={spawnNotification} className="flex-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <Bell className="w-3 h-3" /> Notify
                </button>
              </div>
            </div>
            
            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 w-full">
              <div className="flex items-center gap-1.5 text-blue-200">
                 <Info className="w-3.5 h-3.5 shrink-0" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Study Rules</span>
              </div>
              <ul className="text-[10px] text-blue-100/70 space-y-1 pl-4 list-disc">
                <li>Max study time is <span className="font-semibold text-white">18 hours / day</span>.</li>
                <li>Session auto-stops after <span className="font-semibold text-white">3 hours</span>.</li>
                <li>Reset is at <span className="font-semibold text-white">Midnight (12 AM)</span>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>"""

if target in content:
    content = content.replace(target, replacement)
    print("Added rules to LiveStudy.tsx!")
else:
    print("Target not found in LiveStudy.tsx")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

