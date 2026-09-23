import re

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

replacement = """  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (isStudying) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [isStudying]);

  let currentTotal = session?.accumulatedTime || 0;
  
  if (session?.dailyDate !== todayDate) {
    currentTotal = 0;
    if (session?.isStudying && session?.startTime) {
      const nowDate = new Date();
      const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
      const startForToday = Math.max(session.startTime, midnight);
      currentTotal += Math.floor((now - startForToday) / 1000);
    }
  } else {
    if (session?.isStudying && session?.startTime) {
      currentTotal += Math.floor((now - session.startTime) / 1000);
    }
  }"""

content = re.sub(r'  let currentTotal = session\?.accumulatedTime \|\| 0;\s*if \(session\?.dailyDate !== todayDate\) \{\s*currentTotal = 0;\s*\}\s*const \[now, setNow\] = useState\(Date\.now\(\)\);\s*useEffect\(\(\) => \{\s*if \(isStudying\) \{\s*const interval = setInterval\(\(\) => setNow\(Date\.now\(\)\), 1000\);\s*return \(\) => clearInterval\(interval\);\s*\}\s*\}, \[isStudying\]\);\s*if \(isStudying && session\?.startTime\) \{\s*currentTotal \+= Math\.floor\(\(now - session\.startTime\) / 1000\);\s*\}', replacement, content)

with open('src/components/UserProfileModal.tsx', 'w') as f:
    f.write(content)
