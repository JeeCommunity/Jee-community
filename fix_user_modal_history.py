import re

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

replacement = """                        const dayData = weeklyData[dateStr] || { accumulatedTime: 0, goals: [] };
                        if (dateStr === todayDate) return null; // Already showing today at the top
                        
                        let displayTime = dayData.accumulatedTime || 0;
                        if (session?.isStudying && session?.startTime && session?.dailyDate === dateStr) {
                           // If this history day is the day the session started, add the elapsed time for that day
                           const nowDate = new Date();
                           const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                           const startForToday = Math.max(session.startTime, midnight);
                           // The time spent on that day is from startTime until midnight, OR until now if todayDate is still dateStr
                           // Since dateStr !== todayDate (because of the return null above), the time spent on dateStr is from startTime to midnight.
                           const endOfDay = new Date(dateStr + "T23:59:59.999Z").getTime();
                           // Wait, local midnight is better:
                           // Actually, just add the time before midnight if this is yesterday!
                           if (session.startTime < midnight) {
                              const timeBeforeMidnight = Math.floor((midnight - session.startTime) / 1000);
                              displayTime += timeBeforeMidnight;
                           }
                        }
"""

content = re.sub(r'                        const dayData = weeklyData\[dateStr\] \|\| \{ accumulatedTime: 0, goals: \[\] \};\s*if \(dateStr === todayDate\) return null; // Already showing today at the top', replacement, content, flags=re.DOTALL)

with open('src/components/UserProfileModal.tsx', 'w') as f:
    f.write(content)
