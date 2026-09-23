import re

with open('src/lib/sessionUtils.ts', 'r') as f:
    content = f.read()

# Replace getWeekMonday logic with keeping last 7 days
replacement = """  const sevenDaysAgo = new Date(todayDate + "T00:00:00Z");
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const cutoffDate = sevenDaysAgo.toISOString().split("T")[0];

  Object.keys(weeklyData).forEach((key) => {
    if (key < cutoffDate) delete weeklyData[key];
  });"""

content = re.sub(r'  const currentMonday = getWeekMonday\(todayDate\);\s*Object\.keys\(weeklyData\)\.forEach\(\(key\) => \{\s*if \(key < currentMonday\) delete weeklyData\[key\];\s*\}\);', replacement, content)

with open('src/lib/sessionUtils.ts', 'w') as f:
    f.write(content)

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content2 = f.read()

replacement2 = """  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayDate + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr <= todayDate) {
        dates.push(dateStr);
      }
    }
    return dates;
  };"""

content2 = re.sub(r'  const getWeekDates = \(\) => \{.*?\n  \};', replacement2, content2, flags=re.DOTALL)
content2 = content2.replace("This Week's History", "Last 7 Days History")

with open('src/components/UserProfileModal.tsx', 'w') as f:
    f.write(content2)

