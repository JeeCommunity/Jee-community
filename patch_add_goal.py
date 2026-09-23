import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_add_goal = """  const addGoal = async () => {
    if (!goalInput.trim() || !user || !mySession) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: goalInput.trim(),
      status: "pending",
      createdAt: Date.now(),
    };
    const ref = doc(db, "study_sessions", user.uid);
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (mySession.goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = [...todaysExistingGoals, newGoal];
    const todayDate = getLocalDate();
    await updateDoc(ref, {
      goals: updatedGoals,
      [`weeklyData.${todayDate}.goals`]: updatedGoals
    });
    setGoalInput("");
  };"""

new_add_goal = """  const addGoal = async () => {
    if (!goalInput.trim() || !user) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: goalInput.trim(),
      status: "pending",
      createdAt: Date.now(),
    };
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        fullName: profile?.fullName || "User",
        username: profile?.username || "user",
        photoURL: profile?.photoURL || null,
        role: profile?.role || "user",
        goals: [newGoal],
        isStudying: false,
        activeGoalId: null,
        communityType: profile?.role === "admin" ? adminView : (profile?.targetExam === "Class 12th Board" ? "Board" : "JEE"),
        startTime: null,
        accumulatedTime: 0,
        dailyDate: todayDate,
        weeklyData: {
            [todayDate]: { accumulatedTime: 0, goals: [newGoal] }
        },
        lastUpdated: serverTimestamp(),
      });
    } else {
      const todayStr = new Date().toDateString();
      const existingGoals = snap.data().goals || [];
      const todaysExistingGoals = existingGoals.filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
      const updatedGoals = [...todaysExistingGoals, newGoal];
      await updateDoc(ref, {
        goals: updatedGoals,
        [`weeklyData.${todayDate}.goals`]: updatedGoals
      });
    }
    setGoalInput("");
  };"""

if old_add_goal in content:
    content = content.replace(old_add_goal, new_add_goal)
    with open('src/pages/LiveStudy.tsx', 'w') as f:
        f.write(content)
    print("Patched addGoal")
else:
    print("Could not find old addGoal")

