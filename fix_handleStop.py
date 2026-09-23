import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Replace handleStop
stop_pattern = r"(const handleStop = async \(\) => \{.*?)(?=\s+const getGoalTime)"
new_stop = """const handleStop = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const todayDate = getLocalDate();
      
      const { baseTime, currentGoals, weeklyData } = resolveSessionState(data, todayDate);

      weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };

      await updateDoc(ref, {
        isStudying: false,
        activeGoalId: null,
        accumulatedTime: baseTime,
        goals: currentGoals,
        dailyDate: todayDate,
        weeklyData,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      toast.error("Error stopping goal");
    }
  };"""

content = re.sub(stop_pattern, new_stop + "\n", content, flags=re.DOTALL)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

print("Updated handleStop.")
