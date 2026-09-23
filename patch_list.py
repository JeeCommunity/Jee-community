import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('{/* Active Students List */}')
end_idx = content.find('{selectedUserForProfile && (')

if start_idx == -1 or end_idx == -1:
    print("Could not find list")
    exit(1)

new_list = """{/* Active Students List */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Active Students
          </h3>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-bold">
             {sessions.filter(s => s.isStudying).length} Online
          </span>
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No active students.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {sessions.map(s => ({ ...s, ...(usersData[s.id] || { fullName: "Unknown User", userClass: "N/A", userState: "N/A", role: "student" }) })).sort((a, b) => {
              if (a.isStudying && !b.isStudying) return -1;
              if (!a.isStudying && b.isStudying) return 1;
              return (b.accumulatedTime || 0) - (a.accumulatedTime || 0);
            }).map((s, idx) => {
              const isMe = s.id === user?.uid;
              const totalSessionTime = getSessionTime(s);
              const activeGoal = s.isStudying && s.activeGoalId && s.goals ? s.goals.find((g: any) => g.id === s.activeGoalId) : null;
              const isAdmin = s.role === 'admin' || (s.id === '33i0xJtN9HNA9hQZ5j0N31U2u9p2');
              
              return (
                <div key={s.id} onClick={() => !isMe && handleUserClick(s.id)} className={cn("flex items-center gap-4 py-4 px-4 border-b border-slate-50 last:border-0 transition-colors", idx === 0 ? "bg-yellow-50/30" : "")}>
                  {/* Left: Avatar with rank */}
                  <div className="relative shrink-0">
                     <div className={cn("w-14 h-14 rounded-full overflow-hidden shadow-sm flex items-center justify-center font-bold text-xl", 
                        idx === 0 ? "border-[3px] border-yellow-400 text-yellow-600 bg-yellow-100" :
                        idx === 1 ? "border-[3px] border-slate-300 text-slate-600 bg-slate-100" :
                        idx === 2 ? "border-[3px] border-orange-400 text-orange-600 bg-orange-100" :
                        "border-2 border-slate-200 text-indigo-600 bg-indigo-50")}>
                       {(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} alt={s.fullName || s.userName} className="w-full h-full object-cover" /> : getFirstName(s.fullName || s.userName || "Unknown User").charAt(0).toUpperCase()}
                     </div>
                     {s.isStudying && (
                       <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                     )}
                     
                     {/* Rank Badges */}
                     {idx === 0 && (
                       <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1 shadow-sm border-2 border-white">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                       </div>
                     )}
                     {idx === 1 && (
                       <div className="absolute -top-1 -right-1 bg-slate-300 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm border border-white">
                          #2
                       </div>
                     )}
                     {idx === 2 && (
                       <div className="absolute -top-1 -right-1 bg-orange-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm border border-white">
                          #3
                       </div>
                     )}
                     
                     {/* Admin Diamond */}
                     {isAdmin && (
                       <div className="absolute -top-2 -left-2 text-cyan-400 drop-shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg>
                       </div>
                     )}
                  </div>
                  
                  {/* Middle: Name and Goal */}
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1 flex-wrap">
                       <h4 className="font-bold text-slate-800 truncate text-base">
                         {getFirstName(s.fullName || s.userName || "Unknown User")}
                       </h4>
                       {isAdmin && (
                         <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                           ADMIN
                         </span>
                       )}
                       {isMe && (
                         <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                           YOU
                         </span>
                       )}
                       {/* Add the Class tag if available */}
                       {(!isAdmin && !isMe && s.userClass && s.userClass !== "N/A") && (
                         <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                           {s.userClass}
                         </span>
                       )}
                     </div>
                     
                     <div className="flex items-center">
                       {activeGoal ? (
                         <div className="flex items-center text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full w-fit">
                           <Target className="w-3 h-3 mr-1.5 text-slate-400" />
                           <span className="truncate max-w-[150px]">{activeGoal.text}</span>
                         </div>
                       ) : (
                         <div className="flex items-center text-[11px] font-semibold text-slate-400 bg-white border border-slate-100 px-2.5 py-0.5 rounded-full w-fit italic">
                           No goals set
                         </div>
                       )}
                     </div>
                     
                     {/* Cheers */}
                     {!isMe && s.isStudying && (
                       <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                         <button disabled={cheerCooldowns[s.id]} onClick={() => handleCheer(s.id, 'cheer_fire')} className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-sm disabled:opacity-50 transition-colors border border-orange-100/50">🔥</button>
                         <button disabled={cheerCooldowns[s.id]} onClick={() => handleCheer(s.id, 'cheer_clap')} className="w-8 h-8 rounded-full bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center text-sm disabled:opacity-50 transition-colors border border-yellow-100/50">👏</button>
                       </div>
                     )}
                  </div>
                  
                  {/* Right: Time and Status */}
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <div className="text-xl font-mono font-black text-slate-700 tracking-tight">
                      {formatTime(totalSessionTime)}
                    </div>
                    
                    {!s.isStudying ? (
                      <div className="text-[10px] font-black text-slate-400 tracking-widest mt-1 uppercase">
                         PAUSED
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                           <span className="text-[10px] font-black text-green-600 tracking-widest uppercase">
                             STUDYING
                           </span>
                        </div>
                        
                        {(profile?.role === "admin" || (user?.uid === '33i0xJtN9HNA9hQZ5j0N31U2u9p2')) && !isMe && (
                           <button onClick={(e) => { e.stopPropagation(); handleStop(s.id); }} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm mt-1">
                             <Square className="w-3 h-3 fill-current" /> Stop
                           </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      """

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content[:start_idx] + new_list + content[end_idx:])

print("Patched List")
