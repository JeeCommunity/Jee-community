import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """          const getSessionTimeLocal = (s: any) => {
            const todayDate = getLocalDate();
            let total = s.accumulatedTime || 0;
            if (s.dailyDate !== todayDate) return 0;
            if (s.isStudying && s.startTime) {
              total += Math.floor((Date.now() - s.startTime) / 1000);
            }
            return total;
          };"""

replacement = """          const getSessionTimeLocal = (s: any) => {
            const todayDate = getLocalDate();
            let total = s.accumulatedTime || 0;
            if (s.dailyDate !== todayDate) return 0;
            if (s.isStudying && s.startTime) {
              let t = Math.floor((Date.now() - s.startTime) / 1000);
              if (t > 3 * 3600) t = 3 * 3600;
              total += t;
            }
            return Math.min(total, 18 * 3600);
          };"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced getSessionTimeLocal logic!")
else:
    print("Could not find getSessionTimeLocal logic!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

