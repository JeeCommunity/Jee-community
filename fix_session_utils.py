import sys

with open('src/lib/sessionUtils.ts', 'r') as f:
    content = f.read()

target = """    if (isStudying && data.startTime) {
      const timeStudied = Math.floor((Date.now() - data.startTime) / 1000);
      const oldTime = baseTime;
      baseTime += timeStudied;"""

replacement = """    if (isStudying && data.startTime) {
      // Auto-stop at 3 hours (10800 seconds) to prevent AFK farming
      let timeStudied = Math.floor((Date.now() - data.startTime) / 1000);
      if (timeStudied > 3 * 3600) {
        timeStudied = 3 * 3600;
        isStudying = false; // Auto-stop
      }
      const oldTime = baseTime;
      baseTime += timeStudied;
      
      // Enforce 18 hour max limit per day
      if (baseTime > 18 * 3600) {
        baseTime = 18 * 3600;
      }"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced same-day logic!")
else:
    print("Could not find same-day logic!")

target2 = """    if (isStudying && data.startTime) {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      const startForToday = Math.max(data.startTime, midnight);
      const timeStudiedToday = Math.floor((Date.now() - startForToday) / 1000);
      
      const timeStudiedYesterday = Math.floor((midnight - data.startTime) / 1000);"""

replacement2 = """    if (isStudying && data.startTime) {
      const now = new Date();
      
      // Auto-stop at 3 hours (10800 seconds) overall since start
      const totalTimeStudied = Math.floor((now.getTime() - data.startTime) / 1000);
      let effectiveEndTime = now.getTime();
      if (totalTimeStudied > 3 * 3600) {
         effectiveEndTime = data.startTime + 3 * 3600 * 1000;
         isStudying = false;
      }

      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      let timeStudiedToday = 0;
      let timeStudiedYesterday = 0;

      if (effectiveEndTime > midnight) {
         timeStudiedYesterday = Math.max(0, Math.floor((midnight - data.startTime) / 1000));
         timeStudiedToday = Math.max(0, Math.floor((effectiveEndTime - midnight) / 1000));
      } else {
         timeStudiedYesterday = Math.max(0, Math.floor((effectiveEndTime - data.startTime) / 1000));
         timeStudiedToday = 0;
      }"""

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced cross-day logic!")
else:
    print("Could not find cross-day logic!")

target3 = """      baseTime = timeStudiedToday;
      currentGoals = []; 
      activeGoalId = null; 
      newStartTime = Date.now();"""

replacement3 = """      baseTime = timeStudiedToday;
      if (baseTime > 18 * 3600) baseTime = 18 * 3600;
      currentGoals = []; 
      activeGoalId = null; 
      newStartTime = Date.now();"""

if target3 in content:
    content = content.replace(target3, replacement3)
    print("Replaced cross-day reset logic!")
else:
    print("Could not find cross-day reset logic!")

with open('src/lib/sessionUtils.ts', 'w') as f:
    f.write(content)

