with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Replace the first sort (in useEffect)
old_sort_1 = """allSessions.sort((a, b) => {
          if (a.isStudying === b.isStudying) {
            return (b.accumulatedTime || 0) - (a.accumulatedTime || 0);
          }
          return a.isStudying ? -1 : 1;
        })"""

new_sort_1 = """allSessions.sort((a, b) => {
          const getSessionTimeLocal = (s: any) => {
            const todayDate = getLocalDate();
            let total = s.accumulatedTime || 0;
            if (s.dailyDate !== todayDate) return 0;
            if (s.isStudying && s.startTime) {
              total += Math.floor((Date.now() - s.startTime) / 1000);
            }
            return total;
          };
          return getSessionTimeLocal(b) - getSessionTimeLocal(a);
        })"""

content = content.replace(old_sort_1, new_sort_1)

# Replace the second sort (in render)
old_sort_2 = """).sort((a, b) => {
              if (a.isStudying && !b.isStudying) return -1;
              if (!a.isStudying && b.isStudying) return 1;
              return (b.accumulatedTime || 0) - (a.accumulatedTime || 0);
            }).map((s, idx) => {"""

new_sort_2 = """).sort((a, b) => {
              return getSessionTime(b) - getSessionTime(a);
            }).map((s, idx) => {"""

content = content.replace(old_sort_2, new_sort_2)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

print("Patched sort")
