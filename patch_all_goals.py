import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

def replace_add_goal(text):
    old_add_goal = """  const addGoal = async () => {
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
      const sData = snap.data();
      const existingGoals = sData.goals || [];
      const todaysExistingGoals = existingGoals.filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
      const updatedGoals = [...todaysExistingGoals, newGoal];
      
      const updates: any = { goals: updatedGoals };
      if (!sData.weeklyData || !sData.weeklyData[todayDate]) {
          updates[`weeklyData.${todayDate}`] = { accumulatedTime: 0, goals: updatedGoals };
      } else {
          updates[`weeklyData.${todayDate}.goals`] = updatedGoals;
      }
      
      await updateDoc(ref, updates);
    }
    setGoalInput("");
  };"""
    return text.replace(old_add_goal, new_add_goal)

def replace_update_goal(text):
    old_update = """  const updateGoalStatus = async (
    goalId: string,
    status: "pending" | "completed" | "failed",
  ) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (snap.data().goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.map((g: Goal) =>
      g.id === goalId ? { ...g, status } : g,
    );
    const todayDate = getLocalDate();
    await updateDoc(ref, { goals: updatedGoals, [`weeklyData.${todayDate}.goals`]: updatedGoals });
  };"""

    new_update = """  const updateGoalStatus = async (
    goalId: string,
    status: "pending" | "completed" | "failed",
  ) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (sData.goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.map((g: Goal) =>
      g.id === goalId ? { ...g, status } : g,
    );
    const todayDate = getLocalDate();
    
    const updates: any = { goals: updatedGoals };
    if (!sData.weeklyData || !sData.weeklyData[todayDate]) {
        updates[`weeklyData.${todayDate}`] = { accumulatedTime: 0, goals: updatedGoals };
    } else {
        updates[`weeklyData.${todayDate}.goals`] = updatedGoals;
    }
    
    await updateDoc(ref, updates);
  };"""
    return text.replace(old_update, new_update)

def replace_remove_goal(text):
    old_remove = """  const removeGoal = async (goalId: string) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (sData.goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.filter((g: Goal) => g.id !== goalId);
    const todayDate = getLocalDate();
    
    let updates: any = { goals: updatedGoals, [`weeklyData.${todayDate}.goals`]: updatedGoals };
    if (sData.activeGoalId === goalId) {
       updates.activeGoalId = null;
       if (sData.isStudying) {
         updates.isStudying = false;
         const timeStudied = Math.floor((Date.now() - sData.startTime) / 1000);
         updates.accumulatedTime = (sData.accumulatedTime || 0) + timeStudied;
       }
    }
    await updateDoc(ref, updates);
  };"""

    new_remove = """  const removeGoal = async (goalId: string) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (sData.goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.filter((g: Goal) => g.id !== goalId);
    const todayDate = getLocalDate();
    
    let updates: any = { goals: updatedGoals };
    if (!sData.weeklyData || !sData.weeklyData[todayDate]) {
        updates[`weeklyData.${todayDate}`] = { accumulatedTime: 0, goals: updatedGoals };
    } else {
        updates[`weeklyData.${todayDate}.goals`] = updatedGoals;
    }
    
    if (sData.activeGoalId === goalId) {
       updates.activeGoalId = null;
       if (sData.isStudying) {
         updates.isStudying = false;
         const timeStudied = Math.floor((Date.now() - sData.startTime) / 1000);
         updates.accumulatedTime = (sData.accumulatedTime || 0) + timeStudied;
       }
    }
    await updateDoc(ref, updates);
  };"""
    return text.replace(old_remove, new_remove)

def replace_clear_goals(text):
    old_clear = """  const clearGoals = async () => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    // If we are currently studying a goal, we should stop studying it since we are deleting it.
    let updates: any = { goals: [], [`weeklyData.${todayDate}.goals`]: [] };
    if (sData.isStudying && sData.activeGoalId) {
       updates.isStudying = false;
       updates.activeGoalId = null;
       // We should also calculate the accumulated time for the session
       const timeStudied = Math.floor((Date.now() - sData.startTime) / 1000);
       updates.accumulatedTime = (sData.accumulatedTime || 0) + timeStudied;
    } else if (sData.activeGoalId) {
       updates.activeGoalId = null;
    }
    
    await updateDoc(ref, updates);
  };"""

    new_clear = """  const clearGoals = async () => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    // If we are currently studying a goal, we should stop studying it since we are deleting it.
    let updates: any = { goals: [] };
    if (!sData.weeklyData || !sData.weeklyData[todayDate]) {
        updates[`weeklyData.${todayDate}`] = { accumulatedTime: 0, goals: [] };
    } else {
        updates[`weeklyData.${todayDate}.goals`] = [];
    }
    
    if (sData.isStudying && sData.activeGoalId) {
       updates.isStudying = false;
       updates.activeGoalId = null;
       // We should also calculate the accumulated time for the session
       const timeStudied = Math.floor((Date.now() - sData.startTime) / 1000);
       updates.accumulatedTime = (sData.accumulatedTime || 0) + timeStudied;
    } else if (sData.activeGoalId) {
       updates.activeGoalId = null;
    }
    
    await updateDoc(ref, updates);
  };"""
    return text.replace(old_clear, new_clear)

content = replace_add_goal(content)
content = replace_update_goal(content)
content = replace_remove_goal(content)
content = replace_clear_goals(content)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
print("Patched all goal operations")
