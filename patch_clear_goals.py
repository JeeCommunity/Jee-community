import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_clear = """  const clearGoals = async () => {
    if (!user || !mySession) return;
    const ref = doc(db, "study_sessions", user.uid);
    const todayDate = getLocalDate();
    
    // If we are currently studying a goal, we should stop studying it since we are deleting it.
    let updates: any = { goals: [], [`weeklyData.${todayDate}.goals`]: [] };
    if (mySession.isStudying && mySession.activeGoalId) {
       updates.isStudying = false;
       updates.activeGoalId = null;
       // We should also calculate the accumulated time for the session
       const timeStudied = Math.floor((Date.now() - mySession.startTime) / 1000);
       updates.accumulatedTime = (mySession.accumulatedTime || 0) + timeStudied;
    } else if (mySession.activeGoalId) {
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

content = content.replace(old_clear, new_clear)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
print("Patched clear")
