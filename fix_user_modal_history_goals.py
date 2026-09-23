import re

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

replacement = """                                    {(() => {
                                      let gTime = g.accumulatedTime || 0;
                                      if (session?.isStudying && session?.startTime && session?.dailyDate === dateStr && session?.activeGoalId === g.id) {
                                          const nowDate = new Date();
                                          const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                                          if (session.startTime < midnight) {
                                              gTime += Math.floor((midnight - session.startTime) / 1000);
                                          }
                                      }
                                      return gTime > 0 ? (
                                        <span className="text-[9px] text-slate-400 font-mono shrink-0">{formatHMS(gTime)}</span>
                                      ) : null;
                                    })()}"""

content = re.sub(r'                                    \{\(g\.accumulatedTime \|\| 0\) > 0 && \(\s*<span className="text-\[9px\] text-slate-400 font-mono shrink-0">\{formatHMS\(g\.accumulatedTime\)\}</span>\s*\)\}', replacement, content, flags=re.DOTALL)

with open('src/components/UserProfileModal.tsx', 'w') as f:
    f.write(content)
