import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

functions = """  const handleStart = async (goalId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const todayDate = getLocalDate();
      const { baseTime, currentGoals, weeklyData } = resolveSessionState(data, todayDate);
      
      await updateDoc(ref, {
        goals: currentGoals,
        isStudying: true,
        activeGoalId: goalId || null,
        startTime: Date.now(),
        accumulatedTime: baseTime,
        weeklyData,
        lastUpdated: serverTimestamp()
      });
      toast.success("Started working on goal");
    } catch (err) {
      toast.error("Error starting goal");
    }
  };

  const handleStop = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const s = snap.data();
      const timeStudied = s.isStudying && s.startTime ? Math.floor((Date.now() - s.startTime) / 1000) : 0;
      await updateDoc(ref, {
        isStudying: false,
        activeGoalId: null,
        accumulatedTime: (s.accumulatedTime || 0) + timeStudied,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      toast.error("Error stopping goal");
    }
  };

  const getGoalTime = (goal: any, mySession: any) => {
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
  };

  const updateGoalStatus = async (goalId: string, status: "pending" | "completed" | "failed") => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const sData = snap.data();
      const todayDate = getLocalDate();
      const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime } = resolveSessionState(sData, todayDate);
      
      const updatedGoals = currentGoals.map((g: any) =>
        g.id === goalId ? { ...g, status } : g
      );
      
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
    } catch (err) {
      toast.error("Error updating goal status");
    }
  };

  const removeGoal = async (goalId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const sData = snap.data();
      const todayDate = getLocalDate();
      const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime } = resolveSessionState(sData, todayDate);
      
      const updatedGoals = currentGoals.filter((g: any) => g.id !== goalId);
      
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
      toast.success("Goal deleted");
    } catch (err) {
      toast.error("Error deleting goal");
    }
  };

"""

# Let's insert this before handleToggleGoal
pattern = r"(\s+const handleToggleGoal = async \(goalId: string, currentStatus: string\) => \{)"
if re.search(pattern, content):
    content = re.sub(pattern, "\n" + functions + r"\1", content)
    with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
        f.write(content)
    print("Functions injected successfully.")
else:
    print("Could not find handleToggleGoal")

