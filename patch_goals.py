import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_goals_block = """                     <div className="flex flex-wrap items-center gap-1.5">
                       {s.goals && s.goals.length > 0 ? (
                         s.goals.map((g: any, i: number) => {
                           const isGoalActive = g.id === s.activeGoalId && s.isStudying;
                           return (
                             <div key={g.id || i} className={cn("flex items-center text-[11px] font-medium border px-2 py-0.5 rounded-full w-fit max-w-full",
                                 isGoalActive ? "border-indigo-200 text-indigo-700 bg-indigo-50" : "border-slate-200 text-slate-500 bg-white")}>
                               <div className={cn("w-2 h-2 mr-1.5 rounded-full shrink-0 border-[1.5px]", 
                                 isGoalActive ? "border-indigo-500 bg-indigo-100" : "border-slate-300 bg-white")} />
                               <span className="truncate">{g.text}</span>
                             </div>
                           );
                         })
                       ) : ("""

new_goals_block = """                     <div className="flex flex-wrap items-center gap-1.5">
                       {s.goals && s.goals.length > 0 ? (
                         s.goals.map((g: any, i: number) => {
                           const isGoalActive = g.id === s.activeGoalId && s.isStudying;
                           const isGoalCompleted = g.completed;
                           return (
                             <div key={g.id || i} className={cn("flex items-center text-[11px] font-medium border px-2 py-0.5 rounded-full w-fit max-w-full",
                                 isGoalCompleted ? "border-green-200 text-green-700 bg-green-50" :
                                 isGoalActive ? "border-indigo-200 text-indigo-700 bg-indigo-50" : 
                                 "border-slate-200 text-slate-500 bg-white")}>
                               {isGoalCompleted ? (
                                 <div className="mr-1.5 flex items-center justify-center shrink-0">
                                   <CheckCircle2 className="w-3 h-3 text-green-600" />
                                 </div>
                               ) : (
                                 <div className={cn("w-2 h-2 mr-1.5 rounded-full shrink-0 border-[1.5px]", 
                                   isGoalActive ? "border-indigo-500 bg-indigo-100" : "border-slate-300 bg-white")} />
                               )}
                               <span className={cn("truncate", isGoalCompleted && "line-through")}>{g.text}</span>
                             </div>
                           );
                         })
                       ) : ("""

if old_goals_block in content:
    content = content.replace(old_goals_block, new_goals_block)
    with open('src/pages/LiveStudy.tsx', 'w') as f:
        f.write(content)
    print("Patched goals in student list")
else:
    print("Could not find old goals block")

