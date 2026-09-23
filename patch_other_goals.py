import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_update = """  const updateGoalStatus = async (
    goalId: string,
    status: "pending" | "completed" | "failed",
  ) => {
    if (!user || !mySession) return;
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (mySession.goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.map((g: Goal) =>
      g.id === goalId ? { ...g, status } : g,
    );
    const ref = doc(db, "study_sessions", user.uid);
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
    
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (snap.data().goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.map((g: Goal) =>
      g.id === goalId ? { ...g, status } : g,
    );
    const todayDate = getLocalDate();
    await updateDoc(ref, { goals: updatedGoals, [`weeklyData.${todayDate}.goals`]: updatedGoals });
  };"""

old_remove = """  const removeGoal = async (goalId: string) => {
    if (!user || !mySession) return;
    const todayStr = new Date().toDateString();
    const todaysExistingGoals = (mySession.goals || []).filter((g: Goal) => g.createdAt && new Date(g.createdAt).toDateString() === todayStr);
    const updatedGoals = todaysExistingGoals.filter((g: Goal) => g.id !== goalId);
    const ref = doc(db, "study_sessions", user.uid);
    const todayDate = getLocalDate();
    
    let updates: any = { goals: updatedGoals, [`weeklyData.${todayDate}.goals`]: updatedGoals };
    if (mySession.activeGoalId === goalId) {
       updates.activeGoalId = null;
       if (mySession.isStudying) {
         updates.isStudying = false;
         const timeStudied = Math.floor((Date.now() - mySession.startTime) / 1000);
         updates.accumulatedTime = (mySession.accumulatedTime || 0) + timeStudied;
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

content = content.replace(old_update, new_update)
content = content.replace(old_remove, new_remove)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
print("Patched update/remove")
