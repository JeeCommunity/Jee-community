import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """  const getSessionTime = (s: any) => {
    if (!s) return 0;
    let time = s.accumulatedTime || 0;
    if (s.isStudying && s.startTime) {
      const start = s.startTime;
      const t = Math.floor((now - start) / 1000);
      if (t > 0) time += t;
    }
    return time;
  };"""

replacement = """  const getSessionTime = (s: any) => {
    if (!s) return 0;
    let time = s.accumulatedTime || 0;
    if (s.isStudying && s.startTime) {
      const start = s.startTime;
      let t = Math.floor((now - start) / 1000);
      if (t > 3 * 3600) {
        t = 3 * 3600;
      }
      if (t > 0) time += t;
    }
    return Math.min(time, 18 * 3600);
  };"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced getSessionTime logic!")
else:
    print("Could not find getSessionTime logic!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

