import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_start = """  const handleStart = async (goalId?: string) => {
    lastCheckInTimeRef.current = Date.now();
    setShowCheckIn(false);
    setCheckInCountdown(60);
    if (!user || !profile) return;

    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();
    const currentMonday = getWeekMonday(todayDate);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        fullName: profile.fullName,
        username: profile.username,
        photoURL: profile.photoURL || null,
        role: profile.role || "user",
        goals: mySession?.goals || [],
        isStudying: true,
        activeGoalId: goalId || null,
        communityType: profile?.role === "admin" ? adminView : profile?.targetExam === "Class 12th Board" ? "Board" : "JEE",
        startTime: Date.now(),
        accumulatedTime: 0,
        dailyDate: todayDate,
        weeklyData: {
            [todayDate]: { accumulatedTime: 0, goals: mySession?.goals || [] }
        },
        lastUpdated: serverTimestamp(),
      });
    } else {"""

new_start = """  const handleStart = async (goalId?: string) => {
    lastCheckInTimeRef.current = Date.now();
    setShowCheckIn(false);
    setCheckInCountdown(60);
    if (!user) return;

    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();
    const currentMonday = getWeekMonday(todayDate);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        fullName: profile?.fullName || "User",
        username: profile?.username || "user",
        photoURL: profile?.photoURL || null,
        role: profile?.role || "user",
        goals: mySession?.goals || [],
        isStudying: true,
        activeGoalId: goalId || null,
        communityType: profile?.role === "admin" ? adminView : (profile?.targetExam === "Class 12th Board" ? "Board" : "JEE"),
        startTime: Date.now(),
        accumulatedTime: 0,
        dailyDate: todayDate,
        weeklyData: {
            [todayDate]: { accumulatedTime: 0, goals: mySession?.goals || [] }
        },
        lastUpdated: serverTimestamp(),
      });
    } else {"""

content = content.replace(old_start, new_start)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
print("Patched handleStart")
