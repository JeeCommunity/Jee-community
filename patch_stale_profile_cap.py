with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

old_use = """  if (session?.dailyDate !== todayDate) {
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

new_use = """  if (session?.dailyDate !== todayDate) {
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
  }
  
  // Hard cap at 18 hours for display
  if (currentTotal > 18 * 3600) {
    currentTotal = 18 * 3600;
  }"""

if old_use in content:
    content = content.replace(old_use, new_use)
    with open('src/components/UserProfileModal.tsx', 'w') as f:
        f.write(content)
    print("Patched UserProfileModal.tsx currentTotal")
else:
    print("Not found in UserProfileModal.tsx currentTotal")
