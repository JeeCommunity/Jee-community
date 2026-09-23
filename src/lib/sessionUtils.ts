import { getLocalDate } from "./utils";
import { getDailyCoins, getDailyXP } from "./campusEconomy";

export const getWeekMonday = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split("T")[0];
};

export const resolveSessionState = (data: any, todayDate: string) => {
  let baseTime = data.accumulatedTime || 0;
  let currentGoals = data.goals || [];
  let weeklyData = data.weeklyData || {};
  let activeGoalId = data.activeGoalId;
  let isStudying = data.isStudying;
  let newStartTime = data.startTime;
  
  let addedCoins = 0;
  let addedXP = 0;

  if (!weeklyData[todayDate] && data.dailyDate === todayDate) {
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };
  }

  if (data.dailyDate !== todayDate) {
    if (isStudying && data.startTime) {
      const now = new Date();
      
      // Auto-stop at 3 hours (10800 seconds) overall since start
      const totalTimeStudied = Math.floor((now.getTime() - data.startTime) / 1000);
      let effectiveEndTime = now.getTime();
      if (totalTimeStudied > 3 * 3600) {
         effectiveEndTime = data.startTime + 3 * 3600 * 1000;
         isStudying = false;
      }

      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      let timeStudiedToday = 0;
      let timeStudiedYesterday = 0;

      if (effectiveEndTime > midnight) {
         timeStudiedYesterday = Math.max(0, Math.floor((midnight - data.startTime) / 1000));
         timeStudiedToday = Math.max(0, Math.floor((effectiveEndTime - midnight) / 1000));
      } else {
         timeStudiedYesterday = Math.max(0, Math.floor((effectiveEndTime - data.startTime) / 1000));
         timeStudiedToday = 0;
      }
      
      if (timeStudiedYesterday > 0 && data.dailyDate) {
        if (!weeklyData[data.dailyDate]) {
          weeklyData[data.dailyDate] = { accumulatedTime: 0, goals: [] };
        }
        
        const oldYdayTime = weeklyData[data.dailyDate].accumulatedTime || 0;
        const newYdayTime = oldYdayTime + timeStudiedYesterday;
        weeklyData[data.dailyDate].accumulatedTime = newYdayTime;
        
        addedCoins += getDailyCoins(newYdayTime / 60) - getDailyCoins(oldYdayTime / 60);
        addedXP += getDailyXP(newYdayTime / 60) - getDailyXP(oldYdayTime / 60);

        if (activeGoalId) {
          weeklyData[data.dailyDate].goals = (weeklyData[data.dailyDate].goals || []).map((g: any) => 
            g.id === activeGoalId ? { ...g, accumulatedTime: (g.accumulatedTime || 0) + timeStudiedYesterday } : g
          );
        }
      }
      
      baseTime = timeStudiedToday;
      if (baseTime > 18 * 3600) baseTime = 18 * 3600;
      currentGoals = []; 
      activeGoalId = null; 
      newStartTime = Date.now();
      
      addedCoins += getDailyCoins(baseTime / 60) - getDailyCoins(0);
      addedXP += getDailyXP(baseTime / 60) - getDailyXP(0);
      
    } else {
      baseTime = 0;
      currentGoals = [];
      activeGoalId = null;
    }
  } else {
    if (isStudying && data.startTime) {
      // Auto-stop at 3 hours (10800 seconds) to prevent AFK farming
      let timeStudied = Math.floor((Date.now() - data.startTime) / 1000);
      if (timeStudied > 3 * 3600) {
        timeStudied = 3 * 3600;
        isStudying = false; // Auto-stop
      }
      const oldTime = baseTime;
      baseTime += timeStudied;
      
      // Enforce 18 hour max limit per day
      if (baseTime > 18 * 3600) {
        baseTime = 18 * 3600;
      }
      
      addedCoins += getDailyCoins(baseTime / 60) - getDailyCoins(oldTime / 60);
      addedXP += getDailyXP(baseTime / 60) - getDailyXP(oldTime / 60);

      if (activeGoalId) {
        currentGoals = currentGoals.map((g: any) =>
          g.id === activeGoalId ? { ...g, accumulatedTime: (g.accumulatedTime || 0) + timeStudied } : g
        );
      }
      newStartTime = Date.now();
    }
  }

  return { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying, addedCoins, addedXP };
};
