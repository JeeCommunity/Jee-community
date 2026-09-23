import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

old_block = """                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                          <div className="flex items-center gap-1 shrink-0 pb-1">
                             <button type="button" onClick={handleFileClick} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <Paperclip className="w-5 h-5" />
                             </button>
                             <button type="button" onClick={handleFileClick} className="hidden sm:flex w-10 h-10 rounded-full hover:bg-slate-100 items-center justify-center text-slate-400 transition-colors">
                                <ImageIcon className="w-5 h-5" />
                             </button>
                          </div>"""

new_block = """                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
                          <div className="flex items-center gap-1 shrink-0 pb-1">
                             <label className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer">
                                <Paperclip className="w-5 h-5" />
                                <input type="file" accept="*/*" onChange={handleFileUpload} className="hidden" />
                             </label>
                             <label className="hidden sm:flex w-10 h-10 rounded-full hover:bg-slate-100 items-center justify-center text-slate-400 transition-colors cursor-pointer">
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                             </label>
                          </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("src/components/PrivateStudyGroups.tsx", "w") as f:
        f.write(content)
    print("Replaced successfully!")
else:
    print("Old block not found!")
