import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Update handleFileUpload
old_upload = """          await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
             text: file.name,
             fileUrl: fileUrl,
             fileName: file.name,
             fileType: file.type,
             senderId: user?.uid,
             senderName: profile?.fullName || "Anonymous",
             senderPhoto: profile?.photoURL || null,
             createdAt: serverTimestamp()
          });"""

new_upload = """          await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
             text: "",
             userId: user?.uid,
             userName: profile?.fullName || profile?.username || "Unknown",
             userPhoto: profile?.photoURL || null,
             createdAt: serverTimestamp(),
             fileUrl: fileUrl,
             fileName: file.name,
             fileType: file.type,
             type: file.type.startsWith('image/') ? 'image' : 'file'
          });"""
content = content.replace(old_upload, new_upload)


# 2. Update Bubble Rendering
old_bubble = """                                               <>
                                                  <div className="leading-relaxed">{msg.text}</div>
                                                  <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>"""

new_bubble = """                                               <>
                                                  {msg.type === 'image' && msg.fileUrl && (
                                                     <div className="max-w-[240px] max-h-[300px] rounded-lg overflow-hidden my-1">
                                                        <img src={msg.fileUrl} alt="Uploaded image" className="w-full h-auto object-contain bg-black/5" />
                                                     </div>
                                                  )}
                                                  {msg.type === 'file' && msg.fileUrl && (
                                                     <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={cn("flex items-center gap-2 p-2 rounded-lg my-1 transition-colors", isMe ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 hover:bg-slate-100")}>
                                                        <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Paperclip className="w-4 h-4" /></div>
                                                        <span className="text-sm font-medium truncate max-w-[150px]">{msg.fileName || "Download File"}</span>
                                                     </a>
                                                  )}
                                                  {msg.text && <div className="leading-relaxed">{msg.text}</div>}
                                                  <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>"""
content = content.replace(old_bubble, new_bubble)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
