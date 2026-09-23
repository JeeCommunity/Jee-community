import re

file_path = "src/pages/LiveStudy.tsx"
with open(file_path, "r") as f:
    c = f.read()

c = c.replace(
"""    await updateDoc(ref, {
      goals: currentGoals,
      isStudying: true,
      activeGoalId: goalId || null,
      communityType: profile?.role === "admin" ? adminView : profile?.targetExam === "Class 12th Board" ? "Board" : "JEE",
      startTime: Date.now(),
      fullName: profile.fullName,
      username: profile.username,
      photoURL: profile.photoURL || null,
      role: profile?.role || "user",
      dailyDate: todayDate,
      weeklyData,
      accumulatedTime: baseTime,
      lastUpdated: serverTimestamp()
    });""",
"""    await updateSessionWithEconomy(ref, {
      goals: currentGoals,
      isStudying: true,
      activeGoalId: goalId || null,
      communityType: profile?.role === "admin" ? adminView : profile?.targetExam === "Class 12th Board" ? "Board" : "JEE",
      startTime: Date.now(),
      fullName: profile.fullName,
      username: profile.username,
      photoURL: profile.photoURL || null,
      role: profile?.role || "user",
      dailyDate: todayDate,
      weeklyData,
      accumulatedTime: baseTime,
      lastUpdated: serverTimestamp()
    }, addedCoins, addedXP, user.uid);""")

c = c.replace(
"""    await updateDoc(ref, {
      isStudying: false,
      activeGoalId: null,
      accumulatedTime: baseTime,
      goals: currentGoals,
      dailyDate: todayDate,
      weeklyData,
      lastUpdated: serverTimestamp(),
    });""",
"""    await updateSessionWithEconomy(ref, {
      isStudying: false,
      activeGoalId: null,
      accumulatedTime: baseTime,
      goals: currentGoals,
      dailyDate: todayDate,
      weeklyData,
      lastUpdated: serverTimestamp(),
    }, addedCoins, addedXP, targetUid);""")

c = c.replace(
"""    await updateDoc(ref, {
      goals: [],
      activeGoalId: null,
      accumulatedTime: baseTime,
      dailyDate: todayDate,
      weeklyData,
      startTime: newStartTime,
      lastUpdated: serverTimestamp(),
    });""",
"""    await updateSessionWithEconomy(ref, {
      goals: [],
      activeGoalId: null,
      accumulatedTime: baseTime,
      dailyDate: todayDate,
      weeklyData,
      startTime: newStartTime,
      lastUpdated: serverTimestamp(),
    }, addedCoins, addedXP, user.uid);""")

c = c.replace(
"""      await updateDoc(ref, { 
          goals: updatedGoals,
          accumulatedTime: baseTime,
          dailyDate: todayDate,
          weeklyData,
          startTime: newStartTime,
          lastUpdated: serverTimestamp()
      });""",
"""      await updateSessionWithEconomy(ref, { 
          goals: updatedGoals,
          accumulatedTime: baseTime,
          dailyDate: todayDate,
          weeklyData,
          startTime: newStartTime,
          lastUpdated: serverTimestamp()
      }, addedCoins, addedXP, user.uid);""")

with open(file_path, "w") as f:
    f.write(c)

