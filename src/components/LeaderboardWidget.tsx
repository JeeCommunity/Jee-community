import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Medal, Star } from 'lucide-react';
import { getFirstName } from '../lib/utils';
import { useAuth } from '../AuthContext';

export default function LeaderboardWidget() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const { user } = useAuth();

  const fetchLeaders = async () => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('reputation', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLeaders(data);
  };

  useEffect(() => {
    fetchLeaders();
  }, [user]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Top Contributors</h3>
      </div>
      <div className="space-y-4">
        {leaders.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={getFirstName(user.fullName)} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                    {getFirstName(user.fullName)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full">
                    {index === 0 && <Medal className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                    {index === 1 && <Medal className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />}
                    {index === 2 && <Medal className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{getFirstName(user.fullName)}</p>
                {user.role === "admin" && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">Admin</span>}
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-md shrink-0">
              <Star className="w-3 h-3 text-blue-600 fill-current" />
              <span className="text-xs font-bold text-blue-700">{user.reputation || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
