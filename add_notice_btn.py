import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """            <p className="text-blue-100/90 text-xs font-medium leading-relaxed max-w-[260px] mx-auto md:mx-0">
              Study together, set daily goals, and see your friends' screen time live.
            </p>"""

replacement = """            <p className="text-blue-100/90 text-xs font-medium leading-relaxed max-w-[260px] mx-auto md:mx-0">
              Study together, set daily goals, and see your friends' screen time live.
            </p>
            
            <button 
              onClick={() => setShowRulesModal(true)}
              className="mt-3.5 inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:bg-amber-300 active:scale-95 uppercase tracking-wider mx-auto md:mx-0"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              Important: Study Rules
            </button>"""

if target in content:
    content = content.replace(target, replacement)
    print("Added notice button!")
else:
    print("Could not find target!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

