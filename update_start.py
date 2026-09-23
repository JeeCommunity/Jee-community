import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """  const handleStart = async (goalId?: string) => {
    lastCheckInTimeRef.current = Date.now();
    setShowCheckIn(false);
    setCheckInCountdown(60);
    if (!user || !profile) return;

    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();

    if (!snap.exists()) {"""

replacement = """  const handleStart = async (goalId?: string) => {
    if (!user || !profile) return;

    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();
    
    if (snap.exists()) {
      const data = snap.data();
      const { baseTime } = resolveSessionState(data, todayDate);
      if (baseTime >= 18 * 3600) {
        alert("You have reached the maximum study limit of 18 hours for today! Take a break and come back tomorrow.");
        return;
      }
    }

    lastCheckInTimeRef.current = Date.now();
    setShowCheckIn(false);
    setCheckInCountdown(60);

    if (!snap.exists()) {"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced start logic!")
else:
    print("Could not find start logic!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

