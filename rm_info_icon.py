import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """            <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1.5">
              Live Study Room
              <button onClick={() => setShowRulesModal(true)} className="ml-1 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <Info className="w-3.5 h-3.5 text-white" />
              </button>
            </h2>"""

replacement = """            <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1.5">
              Live Study Room
            </h2>"""

if target in content:
    content = content.replace(target, replacement)
    print("Removed old info icon!")
else:
    print("Could not find old info icon target!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

