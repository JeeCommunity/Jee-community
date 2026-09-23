import re

file_path = "src/components/PrivateStudyGroups.tsx"
with open(file_path, "r") as f:
    c = f.read()

c = c.replace(
"""        await updateDoc(ref, { 
            goals: updatedGoals,
            accumulatedTime: baseTime,
            dailyDate: todayDate,
            weeklyData,
            isStudying,
            startTime: newStartTime,
            lastUpdated: serverTimestamp()
        });""",
"""        await updateSessionWithEconomy(ref, { 
            goals: updatedGoals,
            accumulatedTime: baseTime,
            dailyDate: todayDate,
            weeklyData,
            isStudying,
            startTime: newStartTime,
            lastUpdated: serverTimestamp()
        }, addedCoins, addedXP, user.uid);""")

c = c.replace(
"""      await updateDoc(ref, {
        goals: currentGoals,
        isStudying: true,
        activeGoalId: goalId || null,
        startTime: Date.now(),
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        lastUpdated: serverTimestamp()
      });""",
"""      await updateSessionWithEconomy(ref, {
        goals: currentGoals,
        isStudying: true,
        activeGoalId: goalId || null,
        startTime: Date.now(),
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        lastUpdated: serverTimestamp()
      }, addedCoins, addedXP, user.uid);""")

c = c.replace(
"""      await updateDoc(ref, {
        isStudying: false,
        activeGoalId: null,
        accumulatedTime: baseTime,
        goals: currentGoals,
        dailyDate: todayDate,
        weeklyData,
        lastUpdated: serverTimestamp()
      });""",
"""      await updateSessionWithEconomy(ref, {
        isStudying: false,
        activeGoalId: null,
        accumulatedTime: baseTime,
        goals: currentGoals,
        dailyDate: todayDate,
        weeklyData,
        lastUpdated: serverTimestamp()
      }, addedCoins, addedXP, user.uid);""")

c = c.replace("await updateDoc(ref, updates);", "await updateSessionWithEconomy(ref, updates, addedCoins, addedXP, user.uid);")

# Also the toggleGoal which doesn't use resolveSessionState (just goals array update)
# `await updateDoc(ref, { goals: updatedGoals });` - this one doesn't update time, so addedCoins=0, addedXP=0.
# No need to change it actually! But we didn't change it.

with open(file_path, "w") as f:
    f.write(c)

