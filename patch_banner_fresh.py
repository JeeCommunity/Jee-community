with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('{/* Main Blue Card */}')
end_idx = content.find('{/* Today\'s Goals Accordion */}')

if start_idx == -1 or end_idx == -1:
    print("Could not find banner section")
    exit(1)

new_banner = """{/* Main Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[20px] p-1 text-white shadow-lg relative overflow-hidden mb-6">
        <div className="bg-white/10 backdrop-blur-md rounded-[16px] p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="flex-1 text-center md:text-left">
            {profile?.role === "admin" && (
              <div className="inline-flex mb-3">
                <div className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[9px] font-bold text-blue-50 flex items-center gap-1 cursor-pointer border border-white/20 uppercase tracking-widest transition-colors" onClick={() => setAdminView(adminView === 'JEE' ? 'Board' : 'JEE')}>
                   ADMIN VIEW: {adminView} <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            )}
            
            <div className="inline-flex items-center justify-center gap-2 bg-blue-500/30 px-3 py-1.5 rounded-full mb-3 border border-blue-400/30">
              <span className="relative flex h-2 w-2">
                <span className={mySession?.isStudying ? "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" : ""}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${mySession?.isStudying ? 'bg-green-500' : 'bg-slate-400'}`}></span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-blue-50 uppercase">
                {mySession?.isStudying ? "Live Session Active" : "Session Paused"}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1.5">
              Live Study Room
            </h2>
            <p className="text-blue-100/90 text-xs font-medium leading-relaxed max-w-[260px] mx-auto md:mx-0">
              Study together, set daily goals, and see your friends' screen time live.
            </p>
          </div>
          
          <div className="w-full md:w-auto bg-black/20 rounded-2xl p-4 md:p-5 border border-white/10 flex flex-col items-center shadow-inner min-w-[240px]">
            <div className="text-4xl md:text-5xl font-mono font-black tracking-tight tabular-nums drop-shadow-sm mb-1 text-white">
              {formatTime(mySession ? getSessionTime(mySession) : 0)}
            </div>
            <div className="text-blue-200/70 font-bold tracking-widest uppercase text-[9px] mb-4">
              MY STUDY TIME • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            
            <div className="flex flex-col w-full gap-2 mt-1">
              <div className="flex items-center gap-2 w-full">
                {mySession?.isStudying ? (
                  <button onClick={() => handleStop()} className="flex-1 bg-red-500 hover:bg-red-600 transition-all py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop Session
                  </button>
                ) : (
                  <button onClick={() => handleStart()} className="flex-1 bg-green-500 hover:bg-green-600 transition-all py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Session
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full">
                <button onClick={togglePip} className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <PictureInPicture className="w-3 h-3" /> PiP
                </button>
                <button onClick={spawnNotification} className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <Bell className="w-3 h-3" /> Notify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      """

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content[:start_idx] + new_banner + content[end_idx:])

print("Successfully replaced banner")
