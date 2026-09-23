import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Replace handleAddGoal
add_goal_pattern = r"(const handleAddGoal = async \(e: React\.FormEvent\) => \{.*?)(?=\s+const handleStart)"
new_add_goal = """const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || !user) return;
    
    try {
      const newGoal = {
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
          communityType: profile?.role === "admin" ? "admin" : (profile?.targetExam === "Class 12th Board" ? "Board" : "JEE"),
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
        const { baseTime, currentGoals, weeklyData, newStartTime, isStudying } = resolveSessionState(sData, todayDate);
        const updatedGoals = [...currentGoals, newGoal];
        
        weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
        
        await updateDoc(ref, { 
            goals: updatedGoals,
            accumulatedTime: baseTime,
            dailyDate: todayDate,
            weeklyData,
            isStudying,
            startTime: newStartTime,
            lastUpdated: serverTimestamp()
        });
      }
      setGoalInput("");
      toast.success("Goal added");
    } catch (err) {
      toast.error("Error adding goal");
    }
  };"""

content = re.sub(add_goal_pattern, new_add_goal + "\n", content, flags=re.DOTALL)


# Replace handleStart
start_pattern = r"(const handleStart = async \(goalId: string\) => \{.*?)(?=\s+const handleStop)"
new_start = """const handleStart = async (goalId: string) => {
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
        goals: currentGoals,
        isStudying: true,
        activeGoalId: goalId || null,
        startTime: Date.now(),
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        lastUpdated: serverTimestamp()
      });
      toast.success("Started working on goal");
    } catch (err) {
      toast.error("Error starting goal");
    }
  };"""

content = re.sub(start_pattern, new_start + "\n", content, flags=re.DOTALL)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

print("Updated functions.")
