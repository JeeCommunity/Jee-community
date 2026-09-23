import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Flame, Calendar, Target } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DailyStreakWidget() {
  const { user, profile } = useAuth();
  const [streak, setStreak] = useState(profile?.streakDays || 0);
  const [isActiveToday, setIsActiveToday] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const checkAndUpdateStreak = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = profile.lastLoginDate;

      let newStreak = profile.streakDays || 0;
      let updated = false;

      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
          // Logged in yesterday, increment streak
          newStreak += 1;
        } else {
          // Missed a day, reset
          newStreak = 1;
        }
        
        updated = true;
      } else {
        setIsActiveToday(true);
      }

      if (updated) {
        setStreak(newStreak);
        setIsActiveToday(true);
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            streakDays: newStreak,
            lastLoginDate: today
          });
        } catch (err) {
          console.error("Failed to update streak", err?.message || 'Error');
        }
      }
    };

    checkAndUpdateStreak();
  }, [user, profile]);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0 is Monday, 6 is Sunday

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-sm border border-orange-100 p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center">
          <Flame className="w-5 h-5 mr-2 fill-current" />
          Daily Streak
        </h3>
        <div className="flex items-center space-x-1 bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-lg backdrop-blur-sm">
          <Target className="w-4 h-4" />
          <span className="text-sm font-bold">{streak} Days</span>
        </div>
      </div>
      
      <p className="text-sm text-orange-50 font-medium mb-4">
        {isActiveToday ? "You're on fire! Keep it up tomorrow." : "Complete a task today to keep your streak!"}
      </p>

      <div className="flex justify-between items-center px-2">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center space-y-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              idx <= todayIndex 
                ? "bg-white dark:bg-slate-900 text-orange-600 shadow-md scale-110" 
                : "bg-white/20 dark:bg-slate-900/20 text-orange-100"
            )}>
              {idx < todayIndex ? '✓' : (idx === todayIndex ? (isActiveToday ? '✓' : '!') : '')}
            </div>
            <span className="text-xs font-semibold text-orange-100">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
