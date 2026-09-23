import sys
import re

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

start_marker = "                {/* WEEKLY HISTORY */}"
end_marker = "              </>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    replacement_ui = """                {/* STUDY HEATMAP */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center justify-between mb-3">
                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Study Heatmap</span>
                    <span className="text-[9px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Last 60 Days</span>
                  </h4>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4">
                    <div className="flex flex-wrap gap-1">
                      {heatmapDates.map((dateStr) => {
                        const dayData = weeklyData[dateStr] || { accumulatedTime: 0 };
                        let displayTime = dayData.accumulatedTime || 0;
                        if (dateStr === todayDate) {
                            displayTime = currentTotal;
                        } else if (session?.isStudying && session?.startTime && session?.dailyDate === dateStr) {
                           const nowDate = new Date();
                           const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                           if (session.startTime < midnight) {
                              displayTime += Math.floor((midnight - session.startTime) / 1000);
                           }
                        }
                        
                        return (
                          <div 
                            key={dateStr}
                            onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                            className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-transform hover:scale-110 hover:ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900 ${getDayColor(displayTime)} ${selectedDate === dateStr ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                            title={`${new Date(dateStr + "T00:00:00Z").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${formatHMS(displayTime)}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-2.5 text-[9px] text-slate-400 font-medium">
                      <span>Less</span>
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-200 dark:bg-indigo-900" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-300 dark:bg-indigo-700" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-400 dark:bg-indigo-600" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-600 dark:bg-indigo-500" />
                      <span>More</span>
                    </div>
                  </div>

                  {/* SELECTED DATE DETAILS */}
                  {selectedDate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 shadow-sm rounded-xl p-3 mb-2">
                      {(() => {
                        const dateObj = new Date(selectedDate + "T00:00:00Z");
                        const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
                        const dayData = weeklyData[selectedDate] || { accumulatedTime: 0, goals: [] };
                        
                        let displayTime = dayData.accumulatedTime || 0;
                        if (selectedDate === todayDate) {
                            displayTime = currentTotal;
                        } else if (session?.isStudying && session?.startTime && session?.dailyDate === selectedDate) {
                           const nowDate = new Date();
                           const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                           if (session.startTime < midnight) {
                              displayTime += Math.floor((midnight - session.startTime) / 1000);
                           }
                        }

                        // Use current goals for today, else historical goals
                        const goalsToDisplay = selectedDate === todayDate && session?.goals ? session.goals : (dayData.goals || []);

                        return (
                          <>
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{dayName}</span>
                              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {formatHMS(displayTime)}
                              </span>
                            </div>
                            
                            {goalsToDisplay.length > 0 ? (
                              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {goalsToDisplay.map((g: any) => (
                                  <div key={g.id} className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center min-w-0 mr-2">
                                      {g.status === 'completed' ? (
                                        <Check className="w-3 h-3 text-green-500 shrink-0 mr-1.5" />
                                      ) : g.status === 'failed' ? (
                                        <X className="w-3 h-3 text-red-500 shrink-0 mr-1.5" />
                                      ) : (
                                        <div className="w-3 h-3 rounded-full border-[1.5px] border-slate-300 dark:border-slate-600 shrink-0 mr-1.5" />
                                      )}
                                      <span className={`truncate font-medium ${g.status !== 'pending' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {g.text}
                                      </span>
                                    </div>
                                    {(() => {
                                      let gTime = g.accumulatedTime || 0;
                                      if (selectedDate === todayDate && session?.isStudying && session?.activeGoalId === g.id && session?.startTime) {
                                         gTime += Math.floor((Date.now() - session.startTime) / 1000);
                                      } else if (session?.isStudying && session?.startTime && session?.dailyDate === selectedDate && session?.activeGoalId === g.id) {
                                          const nowDate = new Date();
                                          const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
                                          if (session.startTime < midnight) {
                                              gTime += Math.floor((midnight - session.startTime) / 1000);
                                          }
                                      }
                                      return gTime > 0 ? (
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-semibold shrink-0">{formatHMS(gTime)}</span>
                                      ) : null;
                                    })()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-2 text-center">
                                <p className="text-[10px] text-slate-400 italic">No goals recorded on this day.</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
"""
    new_content = content[:start_idx] + replacement_ui + content[end_idx:]
    with open('src/components/UserProfileModal.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced WEEKLY HISTORY block with HEATMAP")
else:
    print("Could not find start/end markers for replacement")

