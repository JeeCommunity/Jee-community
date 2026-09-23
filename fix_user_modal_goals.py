import re

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

replacement = """                      let goalTime = g.accumulatedTime || 0;
                      if (session?.dailyDate !== todayDate) {
                        goalTime = 0;
                        if (isStudying && session.activeGoalId === g.id && session.startTime) {
                          const nowDate = new Date();
                          const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                          const startForToday = Math.max(session.startTime, midnight);
                          goalTime += Math.floor((now - startForToday) / 1000);
                        }
                      } else {
                        if (isStudying && session.activeGoalId === g.id && session.startTime) {
                          goalTime += Math.floor((now - session.startTime) / 1000);
                        }
                      }"""

content = re.sub(r'                      let goalTime = g\.accumulatedTime \|\| 0;\s*if \(isStudying && session\.activeGoalId === g\.id && session\.startTime\) \{\s*goalTime \+= Math\.floor\(\(now - session\.startTime\) / 1000\);\s*\}', replacement, content)

with open('src/components/UserProfileModal.tsx', 'w') as f:
    f.write(content)
