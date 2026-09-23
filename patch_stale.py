with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_fetch = """          snap.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Retroactive cleanup of stale sessions (>3 hours)
            if (data.isStudying && data.startTime) {
              const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
              if (elapsedSeconds >= 3 * 3600) {
                data.isStudying = false;
                data.accumulatedTime = (data.accumulatedTime || 0) + (3 * 3600);
                
                // Cleanup goals as well
                if (data.goals && data.activeGoalId) {
                  data.goals = data.goals.map((g: any) => {
                    if (g.id === data.activeGoalId) {
                      return { ...g, accumulatedTime: (g.accumulatedTime || 0) + (3 * 3600) };
                    }
                    return g;
                  });
                }
              }
            }
            
            const hasStudiedToday = data.dailyDate === todayDate && (data.accumulatedTime > 0 || data.isStudying);
            if (data.isStudying || hasStudiedToday) {
              allSessions.push({ id: docSnap.id, ...data });
            }
          });"""

new_fetch = """          snap.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Retroactive cleanup of stale sessions (>3 hours)
            if (data.isStudying && data.startTime) {
              const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
              if (elapsedSeconds >= 3 * 3600) {
                data.isStudying = false;
                data.accumulatedTime = Math.min(18 * 3600, (data.accumulatedTime || 0) + (3 * 3600));
                
                // Cleanup goals as well
                if (data.goals && data.activeGoalId) {
                  data.goals = data.goals.map((g: any) => {
                    if (g.id === data.activeGoalId) {
                      return { ...g, accumulatedTime: (g.accumulatedTime || 0) + (3 * 3600) };
                    }
                    return g;
                  });
                }
              }
            }
            
            const hasStudiedToday = data.dailyDate === todayDate && (data.accumulatedTime > 0 || data.isStudying);
            if (data.isStudying || hasStudiedToday) {
              allSessions.push({ id: docSnap.id, ...data });
            }
          });"""

content = content.replace(old_fetch, new_fetch)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
