import sys

with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

# 1. Update state
target_state = """  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(getLocalDate());
  const [campusStats, setCampusStats] = useState({ totalCoins: 0, totalXP: 0 });"""

replacement_state = """  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(getLocalDate());
  const [campusStats, setCampusStats] = useState({ totalCoins: 0, totalXP: 0 });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(getLocalDate() + "T00:00:00Z");
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
  });"""
if target_state in content:
    content = content.replace(target_state, replacement_state)
    print("Added currentMonth state")

# 2. Add calendar generation logic
target_logic = """  // Generate last 60 days for heatmap
  const getHeatmapDates = () => {
    const dates = [];
    for (let i = 59; i >= 0; i--) {
      const d = new Date(todayDate + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const heatmapDates = getHeatmapDates();"""

replacement_logic = """  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
       days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, dateStr: new Date(Date.UTC(year, month - 1, prevMonthLastDay - i)).toISOString().split('T')[0] });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
       days.push({ day: i, isCurrentMonth: true, dateStr: new Date(Date.UTC(year, month, i)).toISOString().split('T')[0] });
    }
    
    // Next month padding
    const remainingSlots = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= remainingSlots; i++) {
       days.push({ day: i, isCurrentMonth: false, dateStr: new Date(Date.UTC(year, month + 1, i)).toISOString().split('T')[0] });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();
  
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
"""
if target_logic in content:
    content = content.replace(target_logic, replacement_logic)
    print("Replaced heatmap logic with calendar logic")

# 3. Replace the UI block
target_ui = """                {/* STUDY HEATMAP */}
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
                  </div>"""

import re

replacement_ui = """                {/* STUDY CALENDAR */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Study Calendar
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[90px] text-center">
                        {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4">
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayInfo, idx) => {
                        const dateStr = dayInfo.dateStr;
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
                        
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === todayDate;
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative border border-transparent
                              ${!dayInfo.isCurrentMonth ? 'opacity-30' : ''}
                              ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm z-10' : 'hover:border-slate-300 dark:hover:border-slate-600'}
                              ${isToday && !isSelected ? 'border-indigo-200 dark:border-indigo-800' : ''}
                              ${displayTime > 0 ? getDayColor(displayTime) : 'bg-white dark:bg-slate-900'}
                            `}
                            title={`${new Date(dateStr + "T00:00:00Z").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${formatHMS(displayTime)}`}
                          >
                            <span className={`text-[10px] font-bold ${displayTime > 3600 ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {dayInfo.day}
                            </span>
                            {isToday && (
                               <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-indigo-500"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-slate-400 font-medium">
                      <span>Less</span>
                      <div className="w-3 h-3 rounded-[3px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-200 dark:bg-indigo-900" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-300 dark:bg-indigo-700" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-400 dark:bg-indigo-600" />
                      <div className="w-3 h-3 rounded-[3px] bg-indigo-600 dark:bg-indigo-500" />
                      <span>More</span>
                    </div>
                  </div>"""

if target_ui in content:
    content = content.replace(target_ui, replacement_ui)
    print("Replaced UI with calendar component")

with open('src/components/UserProfileModal.tsx', 'w') as f:
    f.write(content)

