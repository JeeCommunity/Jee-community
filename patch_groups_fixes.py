import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Fix mobile outer layout to support safe viewing height (100dvh) and prevent keyboard overlap issues.
content = content.replace(
    'className="bg-white md:rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row md:min-h-[600px] md:h-[calc(100vh-140px)] md:max-h-[800px] fixed md:relative inset-0 z-50 md:z-auto"',
    'className="bg-white md:rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row md:min-h-[600px] md:h-[calc(100vh-140px)] md:max-h-[800px] fixed md:relative inset-0 z-[100] md:z-auto h-[100dvh] md:h-auto w-full"'
)

# 2. Add min-h-0 to scrollable container wrapper
content = content.replace(
    '<div className="flex-1 overflow-hidden relative flex flex-col bg-white">',
    '<div className="flex-1 overflow-hidden relative flex flex-col bg-white min-h-0">'
)

# 3. Replace handleFileClick button with a <label> to fix mobile file picking silent failures
old_file_buttons = """                         <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                          <div className="flex items-center gap-1 shrink-0 pb-1">
                             <button type="button" onClick={handleFileClick} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <Paperclip className="w-5 h-5" />
                             </button>
                             <button type="button" onClick={handleFileClick} className="hidden sm:flex w-10 h-10 rounded-full hover:bg-slate-100 items-center justify-center text-slate-400 transition-colors">
                                <ImageIcon className="w-5 h-5" />
                             </button>
                          </div>"""

new_file_buttons = """                         <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
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
content = content.replace(old_file_buttons, new_file_buttons)

# 4. Use cloudinary uploader in handleFileUpload to get compression
old_upload = """      try {
          if (!storage) throw new Error("Firebase Storage is not configured");
          
          // Use Firebase Storage
          const fileRef = ref(storage, `study_groups/${activeGroup.id}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const fileUrl = await getDownloadURL(fileRef);"""

new_upload = """      try {
          // Use centralized uploader (which handles compression and Firebase storage internally)
          const fileUrl = await uploadFileToCloudinary(file);"""

content = content.replace(old_upload, new_upload)

# 5. Make sure uploadFileToCloudinary is imported
if "uploadFileToCloudinary" not in content[:1000]:
    content = content.replace("import { db, storage } from '../firebase';", "import { db, storage } from '../firebase';\nimport { uploadFileToCloudinary } from '../lib/cloudinary';")

# 6. Add touch-pan-y to chat container to enforce smooth mobile scrolling
content = content.replace(
    'className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6  relative"',
    'className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative touch-pan-y"'
)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
