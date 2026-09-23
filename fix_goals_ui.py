import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

old_block = """                                      {s.goals.map((g: any) => {
                                         const isActive = s.isStudying && s.activeGoalId === g.id;
                                         const isCompleted = g.status === 'completed';
                                         
                                         return (
                                            <div key={g.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 group transition-all hover:bg-slate-100/50">
                                               {isMe ? (
                                                  <button onClick={() => handleToggleGoal(g.id, g.status)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                                                     {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />}
                                                  </button>
                                               ) : (
                                                  <div className="mt-0.5 shrink-0">
                                                     {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                                                  </div>
                                               )}
                                               
                                               <div className="flex-1 min-w-0">
                                                  <div className={cn("text-[15px] font-medium leading-snug transition-colors", isCompleted ? "text-slate-400 line-through" : "text-slate-700")}>
                                                     {g.text}
                                                  </div>
                                                  {isActive && (
                                                     <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                        Currently Working On
                                                     </div>
                                                  )}
                                               </div>
                                            </div>
                                         )
                                      })}"""

new_block = """                                      {s.goals.map((g: any) => {
                                         const isActive = s.isStudying && s.activeGoalId === g.id;
                                         const isCompleted = g.status === 'completed';
                                         const isFailed = g.status === 'failed';
                                         
                                         return (
                                            <div key={g.id} className={cn("flex flex-col gap-3 p-4 rounded-2xl border transition-all bg-white", isActive ? "border-indigo-200 shadow-sm ring-1 ring-indigo-100" : isCompleted ? "border-green-200 opacity-75" : isFailed ? "border-red-200 opacity-75" : "border-slate-100 hover:border-indigo-100")}>
                                              {/* Top: Goal Text */}
                                              <span className={cn("font-semibold text-[15px]", isCompleted ? "text-green-700 line-through" : isFailed ? "text-red-700 line-through" : isActive ? "text-indigo-900" : "text-slate-700")}>
                                                {g.text}
                                              </span>
                                              
                                              {/* Bottom: Controls */}
                                              <div className="flex items-center justify-between mt-1">
                                                
                                                {/* Left: Play and Time */}
                                                <div className="flex items-center gap-3">
                                                  {isMe && (
                                                    isActive ? (
                                                      <button onClick={() => handleStop()} className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors shrink-0" title="Stop">
                                                        <Square className="w-4 h-4 fill-current" />
                                                      </button>
                                                    ) : (
                                                      <button onClick={() => handleStart(g.id)} className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors shrink-0" title="Start">
                                                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                                                      </button>
                                                    )
                                                  )}
                                                  
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-mono font-bold text-slate-600 tracking-tight">
                                                      {formatTime(getGoalTime(g, s))}
                                                    </span>
                                                    {g.createdAt && (
                                                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                                        {new Date(g.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                
                                                {/* Right: Actions */}
                                                {isMe && (
                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                    <button onClick={() => updateGoalStatus(g.id, g.status === "completed" ? "pending" : "completed")} className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors", g.status === "completed" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600")} title="Mark Completed">
                                                      <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => updateGoalStatus(g.id, g.status === "failed" ? "pending" : "failed")} className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors", g.status === "failed" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600")} title="Mark Failed">
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => removeGoal(g.id)} className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors ml-1" title="Delete Goal">
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                )}
                                                
                                              </div>
                                            </div>
                                         )
                                      })}"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
        f.write(content)
    print("UI Block replaced successfully.")
else:
    print("Could not find start string.")
