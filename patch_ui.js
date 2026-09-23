import fs from 'fs';
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

const mobileHeader = `{/* MOBILE HEADER */}
           <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setActiveGroup(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 truncate leading-tight text-[15px]">{activeGroup.name}</h2>
                  <div className="text-[11px] text-slate-500 font-medium">{groupMembers.length} members</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleStartMeet} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 shrink-0 shadow-sm border border-blue-100" title="Start Video Call">
                   <Video className="w-4 h-4" />
                </button>
                <button onClick={() => window.open(\`/whiteboard/\${activeGroup.id}\`, '_blank')} className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 hover:bg-purple-100 shrink-0 shadow-sm border border-purple-100" title="Whiteboard">
                   <Palette className="w-4 h-4" />
                </button>
                <button onClick={() => handleLeaveGroup(activeGroup.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 shrink-0 shadow-sm border border-red-100" title="Leave Group">
                   <LogOut className="w-4 h-4 ml-0.5" />
                </button>
              </div>
           </div>`;

code = code.replace(/\{\/\* MOBILE HEADER \*\/\}.*?<\/button>\s*<\/div>/s, mobileHeader);

const desktopHeader = `{/* CHAT TAB */}
              {activeGroupTab === 'chat' && (
                 <div className="absolute inset-0 flex flex-col">
                    {/* DESKTOP HEADER (Hidden on mobile) */}
                    <div className="hidden md:flex items-center justify-between p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                      <div>
                        <h2 className="font-bold text-slate-800 text-lg">{activeGroup.name} Chat</h2>
                        <p className="text-sm text-slate-500">Collaborate and solve doubts together.</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={handleStartMeet} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors">
                            <Video className="w-4 h-4" /> Start Video Call
                         </button>
                         <button onClick={() => window.open(\`/whiteboard/\${activeGroup.id}\`, '_blank')} className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors">
                            <Palette className="w-4 h-4" /> Whiteboard
                         </button>
                      </div>
                    </div>`;

code = code.replace(/\{\/\* CHAT TAB \*\/\}\s*\{activeGroupTab === 'chat' && \(\s*<div className="absolute inset-0 flex flex-col">/, desktopHeader);

fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Patched UI");
