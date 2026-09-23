import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """  function getSessionTime(s: any) {
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startForToday = Math.max(s.startTime, midnight);
        total += Math.floor((Date.now() - startForToday) / 1000);
      }
    } else {
      if (s.isStudying && s.startTime) {
        total += Math.floor((Date.now() - s.startTime) / 1000);
      }
    }
    return total;
  };"""

replacement = """  function getSessionTime(s: any) {
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const nowDate = new Date();
        const totalTimeStudied = Math.floor((nowDate.getTime() - s.startTime) / 1000);
        let effectiveEndTime = nowDate.getTime();
        if (totalTimeStudied > 3 * 3600) {
           effectiveEndTime = s.startTime + 3 * 3600 * 1000;
        }

        const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
        
        let timeStudiedToday = 0;
        if (effectiveEndTime > midnight) {
           timeStudiedToday = Math.max(0, Math.floor((effectiveEndTime - midnight) / 1000));
        }
        total += timeStudiedToday;
      }
    } else {
      if (s.isStudying && s.startTime) {
        let t = Math.floor((Date.now() - s.startTime) / 1000);
        if (t > 3 * 3600) {
           t = 3 * 3600;
        }
        total += t;
      }
    }
    
    return Math.min(total, 18 * 3600);
  };"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced getSessionTime logic!")
else:
    print("Could not find getSessionTime logic!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

