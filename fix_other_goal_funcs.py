import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Replace updateGoalStatus
update_pattern = r"(const updateGoalStatus = async \(goalId: string, status: \"pending\" \| \"completed\" \| \"failed\"\) => \{.*?)(?=\s+const removeGoal)"
new_update = """const updateGoalStatus = async (goalId: string, status: "pending" | "completed" | "failed") => {
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
    } catch (err) {
      toast.error("Error updating goal status");
    }
  };"""

content = re.sub(update_pattern, new_update + "\n", content, flags=re.DOTALL)


# Replace removeGoal
remove_pattern = r"(const removeGoal = async \(goalId: string\) => \{.*?)(?=\s+const handleToggleGoal|\s+const handleImageUpload)"
new_remove = """const removeGoal = async (goalId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const sData = snap.data();
      const todayDate = getLocalDate();
      const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime } = resolveSessionState(sData, todayDate);
      
      const updatedGoals = currentGoals.filter((g: any) => g.id !== goalId);
      
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
      toast.success("Goal deleted");
    } catch (err) {
      toast.error("Error deleting goal");
    }
  };"""

content = re.sub(remove_pattern, new_remove + "\n", content, flags=re.DOTALL)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

print("Updated updateGoalStatus and removeGoal.")
