import sys

def replace_get_session_time(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    target = """  const getSessionTime = (session: any) => {
    if (!session || session.status !== "active") return 0;
    return Math.floor((now - session.startTime) / 60000) + (session.accumulatedTime || 0);
  };"""

    replacement = """  const getSessionTime = (s: any) => {
    if (!s) return 0;
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const midnight = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        total += Math.floor((Date.now() - Math.max(s.startTime, midnight)) / 1000);
      }
    } else {
      if (s.isStudying && s.startTime) {
        total += Math.floor((Date.now() - s.startTime) / 1000);
      }
    }
    return total;
  };"""
    
    if target in content:
        content = content.replace(target, replacement)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"Could not find target in {filepath}")

replace_get_session_time('src/pages/Campus.tsx')
replace_get_session_time('src/components/Layout.tsx')
