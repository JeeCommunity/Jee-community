import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

canvas_replacement = """    let timeStr = "00:00:00";
    if (studySessionRef.current) {
      const session = studySessionRef.current;
      const todayDate = getLocalDate();
      let totalSeconds = session.accumulatedTime || 0;
      if (session.dailyDate !== todayDate) {
        totalSeconds = 0;
        if (session.isStudying && session.startTime) {
          const now = new Date();
          const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const startForToday = Math.max(session.startTime, midnight);
          totalSeconds += Math.floor((Date.now() - startForToday) / 1000);
        }
      } else {
        if (session.isStudying && session.startTime) {
          totalSeconds += Math.floor((Date.now() - session.startTime) / 1000);
        }
      }
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      timeStr = [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
    }"""
content = re.sub(r'    let timeStr = "00:00:00";\n    if \(studySessionRef.current\) \{[\s\S]*?timeStr = \[h, m, s\].map\(\(v\) => v.toString\(\).padStart\(2, "0"\)\).join\(":"\);\n    \}', canvas_replacement, content, count=1)


with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
