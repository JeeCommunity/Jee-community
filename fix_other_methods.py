import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

get_goal_time_replacement = """  const getGoalTime = (goal: Goal) => {
    let total = goal.accumulatedTime || 0;
    const todayDate = getLocalDate();
    if (mySession?.dailyDate !== todayDate) {
      return 0;
    }
    if (
      mySession?.isStudying &&
      mySession?.activeGoalId === goal.id &&
      mySession?.startTime
    ) {
      total += Math.floor((Date.now() - mySession.startTime) / 1000);
    }
    return total;
  };"""
content = re.sub(r'  const getGoalTime = \(goal: Goal\) => \{.*?\n  \};', get_goal_time_replacement, content, flags=re.DOTALL)


clear_goals_replacement = """  const clearGoals = async () => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying } = resolveSessionState(sData, todayDate);
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: [] };

    await updateDoc(ref, {
      goals: [],
      activeGoalId: null,
      accumulatedTime: baseTime,
      dailyDate: todayDate,
      weeklyData,
      startTime: newStartTime,
      lastUpdated: serverTimestamp(),
    });
  };"""
content = re.sub(r'  const clearGoals = async \(\) => \{.*?\n  \};', clear_goals_replacement, content, flags=re.DOTALL)


add_goal_replacement = """  const addGoal = async () => {
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
      const sData = snap.data();
      const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying } = resolveSessionState(sData, todayDate);
      const updatedGoals = [...currentGoals, newGoal];
      
      weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
      
      await updateDoc(ref, { 
          goals: updatedGoals,
          accumulatedTime: baseTime,
          dailyDate: todayDate,
          weeklyData,
          startTime: newStartTime,
          lastUpdated: serverTimestamp()
      });
    }
    setGoalInput("");
  };"""
content = re.sub(r'  const addGoal = async \(\) => \{.*?\n  \};', add_goal_replacement, content, flags=re.DOTALL)


update_goal_status_replacement = """  const updateGoalStatus = async (
    goalId: string,
    status: "pending" | "completed" | "failed",
  ) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying } = resolveSessionState(sData, todayDate);
    
    const updatedGoals = currentGoals.map((g: Goal) =>
      g.id === goalId ? { ...g, status } : g,
    );
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
    
    const updates: any = { 
        goals: updatedGoals,
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        startTime: newStartTime,
        lastUpdated: serverTimestamp()
    };
    
    if (activeGoalId === goalId && status !== "pending") {
      updates.activeGoalId = null;
    }
    
    await updateDoc(ref, updates);
  };"""
content = re.sub(r'  const updateGoalStatus = async \([\s\S]*?\n  \};', update_goal_status_replacement, content, count=1)


remove_goal_replacement = """  const removeGoal = async (goalId: string) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying } = resolveSessionState(sData, todayDate);
    
    const updatedGoals = currentGoals.filter((g: Goal) => g.id !== goalId);
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
    
    const updates: any = { 
        goals: updatedGoals,
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        startTime: newStartTime,
        lastUpdated: serverTimestamp()
    };
    
    if (activeGoalId === goalId) {
      updates.activeGoalId = null;
    }
    
    await updateDoc(ref, updates);
  };"""
content = re.sub(r'  const removeGoal = async \([\s\S]*?\n  \};', remove_goal_replacement, content, count=1)


get_session_time_replacement = """  const getSessionTime = (s: any) => {
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startForToday = Math.max(s.startTime, midnight);
        total += Math.floor((Date.now() - startForToday) / 1000);
      }
    } else {
      if (s.isStudying && s.startTime) {
        total += Math.floor((Date.now() - s.startTime) / 1000);
      }
    }
    return total;
  };"""
content = re.sub(r'  const getSessionTime = \([\s\S]*?\n  \};', get_session_time_replacement, content, count=1)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
