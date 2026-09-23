import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 w-full">
              <div className="flex items-center gap-1.5 text-blue-200">
                 <Info className="w-3.5 h-3.5 shrink-0" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Study Rules</span>
              </div>
              <ul className="text-[10px] text-blue-100/70 space-y-1 pl-4 list-disc">
                <li>Max study time is <span className="font-semibold text-white">18 hours / day</span>.</li>
                <li>Session auto-stops after <span className="font-semibold text-white">3 hours</span>.</li>
                <li>Reset is at <span className="font-semibold text-white">Midnight (12 AM)</span>.</li>
              </ul>
            </div>"""

replacement = """            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 w-full">
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

if target in content:
    content = content.replace(target, replacement)
    print("Updated rules text!")
else:
    print("Target not found in LiveStudy.tsx")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

