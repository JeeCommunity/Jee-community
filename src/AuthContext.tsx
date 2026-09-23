import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { auth, db } from './firebase';
import { requestNotificationPermission } from './lib/fcm';

interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  targetYear?: number;
  targetExam?: string;
  studentClass?: string;
  cheersEnabled?: boolean;
  state: string;
  bio?: string;
  photoURL?: string;
  isBlocked?: boolean;
  role?: 'user' | 'admin';
  streakDays?: number;
  lastLoginDate?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: (user?: User | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (currentUser = user) => {
    if (currentUser) {
      if (!db) {
        setProfile(null);
        return;
      }
      const docRef = doc(db, 'users', currentUser.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          
          // Streak Logic
          const today = new Date().toISOString().split('T')[0];
          const lastLogin = data.lastLoginDate;
          let newStreak = data.streakDays || 0;
          let updated = false;

          if (lastLogin && lastLogin !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const dayBefore = new Date();
            dayBefore.setDate(dayBefore.getDate() - 2);
            const dayBeforeStr = dayBefore.toISOString().split('T')[0];

            if (lastLogin === yesterdayStr) {
              newStreak += 1;
              updated = true;
            } else if (lastLogin === dayBeforeStr) {
              newStreak += 1; // 1 day missed, streak continues
              updated = true;
            } else {
              newStreak = 1; // broken
              updated = true;
            }
          } else if (!lastLogin) {
             newStreak = 1;
             updated = true;
          }

          if (updated || lastLogin !== today) {
            try {
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(docRef, {
                streakDays: newStreak,
                lastLoginDate: today
              });
              data.streakDays = newStreak;
              data.lastLoginDate = today;
            } catch (e: any) {
              console.error("Failed to update streak", e?.message || 'Error');
            }
          }

          setProfile({ uid: currentUser.uid, ...data });
          localStorage.setItem('userProfileCache_' + currentUser.uid, JSON.stringify({ uid: currentUser.uid, ...data }));
        } else {
          localStorage.removeItem('userProfileCache_' + currentUser.uid);
          setProfile(null);
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error?.message || 'Error');
        // Fallback to localStorage cache if offline
        const localCache = localStorage.getItem('userProfileCache_' + currentUser.uid);
        if (localCache) {
            try {
                setProfile(JSON.parse(localCache));
                return;
            } catch (e) {
                console.error("Failed to parse cached profile", e);
            }
        }
        // If no cache, we just set profile to null (forces setup)
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await refreshProfile(currentUser);
      setLoading(false);
      if (currentUser && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
         // Silently sync FCM token if already granted
         // requestNotificationPermission(currentUser.uid).catch((e: any) => console.log('Silently sync FCM failed', e?.message || 'Error'));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
