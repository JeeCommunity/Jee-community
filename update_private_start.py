import sys

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

target = """  const handleStart = async (goalId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const todayDate = getLocalDate();
      const { baseTime, currentGoals, weeklyData, addedCoins, addedXP } = resolveSessionState(data, todayDate);
      
      weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };"""

replacement = """  const handleStart = async (goalId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const todayDate = getLocalDate();
      const { baseTime, currentGoals, weeklyData, addedCoins, addedXP } = resolveSessionState(data, todayDate);
      
      if (baseTime >= 18 * 3600) {
        alert("You have reached the maximum study limit of 18 hours for today! Take a break and come back tomorrow.");
        return;
      }
      
      weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced private start logic!")
else:
    print("Could not find private start logic!")

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

