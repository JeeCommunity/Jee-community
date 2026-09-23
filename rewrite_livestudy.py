import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Find the start of the return statement
start_idx = content.find('  return (\n    <div className="w-full max-w-lg mx-auto md:max-w-4xl space-y-4 pb-20">')
if start_idx == -1:
    print("Could not find start index")
    exit(1)

new_return = """  return (
    <div className="w-full max-w-lg mx-auto md:max-w-4xl space-y-4 pb-20">
      
      {/* Main Blue Card */}
      <div className="bg-gradient-to-br from-[#3b82f6] to-[#4f46e5] rounded-[32px] p-6 md:p-8 text-white shadow-lg relative overflow-hidden mb-6">
        {/* Background icon watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <BookOpen className="w-[300px] h-[300px]" />
        </div>

        {profile?.role === "admin" && (
          <div className="flex justify-center mb-6 relative z-10">
            <div className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-bold text-blue-100 flex items-center gap-2 cursor-pointer border border-white/20 uppercase tracking-widest transition-colors" onClick={() => setAdminView(adminView === 'JEE' ? 'Board' : 'JEE')}>
               ADMIN VIEW: {adminView} <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        )}

        <div className="text-center relative z-10 mb-8">
          <h2 className="text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <Users className="w-10 h-10" /> Live Study Room
          </h2>
          <p className="text-blue-100 text-sm md:text-base max-w-sm mx-auto font-medium">
            Study together, set your daily goals, and see your friends' screen time live!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] p-6 md:p-8 text-center relative z-10 w-full max-w-md mx-auto">
          <div className="text-6xl md:text-7xl font-mono font-black tracking-wider tabular-nums mb-3 drop-shadow-md">
            {formatTime(mySession ? getSessionTime(mySession) : 0)}
          </div>
          <div className="text-blue-200 font-bold tracking-widest uppercase text-xs mb-2">
            MY STUDY TIME
          </div>
          <div className="text-blue-200/80 text-sm font-medium mb-6">
            {new Date().toDateString()}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-3 w-full">
              {mySession?.isStudying ? (
                <button onClick={() => handleStop()} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95">
                  <Square className="w-4 h-4 fill-current" /> Stop Session
                </button>
              ) : (
                <button onClick={() => handleStart()} className="flex-1 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95">
                  <Play className="w-4 h-4 fill-current" /> Start Session
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-3 w-full">
              <button onClick={togglePip} className="flex-1 bg-[#5b54fa] hover:bg-[#6c65fb] transition-colors py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-inner">
                <PictureInPicture className="w-4 h-4" /> PiP Mode
              </button>
              <button onClick={spawnNotification} className="flex-1 bg-[#10b981] hover:bg-[#059669] transition-colors py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-inner">
                <Bell className="w-4 h-4" /> Notify Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Goals Accordion */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mb-4">
        <button onClick={() => setShowGoalsMenu(!showGoalsMenu)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-indigo-500" /> 
            <span className="font-bold text-slate-800 text-lg">Today's Goals</span>
            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{goals.length}</span>
          </div>
          {showGoalsMenu ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {showGoalsMenu && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500">Manage your goals for today</span>
              {goals.length > 0 && (
                <button onClick={() => clearGoals()} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">Clear All</button>
              )}
            </div>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Add a study goal..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              <button
                onClick={addGoal}
                disabled={!goalInput.trim()}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map((g) => {
                  const isGoalActive = mySession?.isStudying && mySession?.activeGoalId === g.id;
                  return (
                    <div key={g.id} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all bg-white", isGoalActive ? "border-indigo-200 shadow-sm ring-1 ring-indigo-100" : g.status === "completed" ? "border-green-200 opacity-75" : g.status === "failed" ? "border-red-200 opacity-75" : "border-slate-100 hover:border-indigo-100")}>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                         <span className={cn("font-semibold truncate", g.status === "completed" ? "text-green-700 line-through" : g.status === "failed" ? "text-red-700 line-through" : isGoalActive ? "text-indigo-900" : "text-slate-700")}>
                           {g.text}
                         </span>
                         {g.accumulatedTime ? (
                           <span className="text-xs font-mono font-bold text-slate-500">{formatTime(g.accumulatedTime)}</span>
                         ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 ml-4 shrink-0">
                        {isGoalActive ? (
                          <button onClick={() => handleStop()} className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors" title="Stop">
                            <Square className="w-3.5 h-3.5 fill-current" />
                          </button>
                        ) : (
                          <button onClick={() => handleStart(g.id)} className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors" title="Start">
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                          </button>
                        )}
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button onClick={() => updateGoalStatus(g.id, "completed")} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", g.status === "completed" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600")}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateGoalStatus(g.id, "failed")} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", g.status === "failed" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600")}>
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeGoal(g.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Active Students List */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Active Students
          </h3>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-bold">
             {sessions.filter(s => s.isStudying).length} Active Now
          </span>
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No active students.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(s => ({ ...s, ...(usersData[s.id] || { userName: "Unknown User", userClass: "N/A", userState: "N/A" }) })).sort((a, b) => {
              if (a.isStudying && !b.isStudying) return -1;
              if (!a.isStudying && b.isStudying) return 1;
              return (b.accumulatedTime || 0) - (a.accumulatedTime || 0);
            }).map((s, idx) => {
              const isMe = s.id === user?.uid;
              const totalSessionTime = getSessionTime(s);
              const isTop3 = idx < 3;
              // Check if they are currently studying a goal
              const activeGoal = s.isStudying && s.activeGoalId && s.goals ? s.goals.find((g: any) => g.id === s.activeGoalId) : null;
              
              return (
                <div key={s.id} onClick={() => !isMe && handleUserClick(s.id)} className={cn("flex items-center gap-4 py-3 border-b border-slate-50 last:border-0", isMe ? "opacity-100" : "opacity-100")}>
                  {/* Left: Avatar with rank */}
                  <div className="relative shrink-0">
                     <div className="w-14 h-14 rounded-full overflow-hidden bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center text-orange-600 font-bold text-xl">
                       {s.userPhoto ? <img src={s.userPhoto} alt={s.userName} className="w-full h-full object-cover" /> : getFirstName(s.userName).charAt(0).toUpperCase()}
                     </div>
                     {s.isStudying && (
                       <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                     )}
                     {isTop3 && (
                       <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">
                          <Crown className={cn("w-4 h-4 fill-current", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-600")} />
                       </div>
                     )}
                  </div>
                  
                  {/* Middle: Name and Goal */}
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <h4 className="font-bold text-slate-800 truncate text-base">
                         {getFirstName(s.userName)}
                       </h4>
                     </div>
                     
                     <div className="flex items-center mt-1">
                       {activeGoal ? (
                         <div className="flex items-center text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50 w-fit">
                           <Target className="w-3 h-3 mr-1" />
                           <span className="truncate max-w-[150px]">{activeGoal.text}</span>
                         </div>
                       ) : (
                         <div className="text-[12px] text-slate-400 font-medium">
                            {s.userClass}
                         </div>
                       )}
                     </div>
                  </div>
                  
                  {/* Right: Time and Status */}
                  <div className="text-right shrink-0">
                    <div className="text-xl font-mono font-black text-slate-700 tracking-tight">
                      {formatTime(totalSessionTime)}
                    </div>
                    {!s.isStudying ? (
                      <div className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">
                         Paused
                      </div>
                    ) : (
                      !isMe && (
                         <div className="flex gap-1 justify-end mt-1" onClick={(e) => e.stopPropagation()}>
                           <button disabled={cheerCooldowns[s.id]} onClick={() => handleCheer(s.id, 'cheer_fire')} className="w-7 h-7 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-sm disabled:opacity-50 transition-colors">🔥</button>
                           <button disabled={cheerCooldowns[s.id]} onClick={() => handleCheer(s.id, 'cheer_clap')} className="w-7 h-7 rounded-full bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center text-sm disabled:opacity-50 transition-colors">👏</button>
                         </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedUserForProfile && (
        <UserProfileModal
          user={selectedUserForProfile}
          session={selectedUserSession}
          onClose={() => {
            setSelectedUserForProfile(null);
            setSelectedUserSession(null);
          }}
        />
      )}

      {pipWindow &&
        createPortal(
          <div
            className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4"
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0f172a",
              color: "white",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#94a3b8",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isMyStudying ? (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#22c55e",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                ></div>
              ) : (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                  }}
                ></div>
              )}
              Live Study Timer
            </div>
            <div
              style={{
                fontSize: "32px",
                fontFamily: "monospace",
                fontWeight: "bold",
                color: "#818cf8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(getSessionTime(mySession))}
            </div>
            <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
              {isMyStudying ? (
                <button
                  onClick={() => handleStop()}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  Stop Session
                </button>
              ) : (
                <button
                  onClick={() => handleStart()}
                  style={{
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(34, 197, 94, 0.2)",
                  }}
                >
                  Start Session
                </button>
              )}
            </div>
          </div>,
          pipWindow.document.body,
        )}
    </div>
  );
}
"""

# Now find the end of the file or the end of the return statement
end_idx = content.rfind('  );\n}')
if end_idx == -1:
    end_idx = content.rfind('}\n')

if end_idx == -1:
    print("Could not find end index")
    exit(1)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content[:start_idx] + new_return + "\n")

print("Successfully replaced")
