import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# 1. Add fileInputRef
if 'fileInputRef' not in content:
    content = content.replace(
        '  const chatEndRef = useRef<HTMLDivElement>(null);',
        '  const chatEndRef = useRef<HTMLDivElement>(null);\n  const fileInputRef = useRef<HTMLInputElement>(null);'
    )

# 2. Replace handleFileClick and add handleFileChange
old_file_click = """  const handleFileClick = () => {
     toast("File uploads require Firebase Storage configuration.", { icon: '📎' });
  };"""

new_file_logic = """  const handleFileClick = () => {
     fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroup || !user || !profile) return;
    
    if (!file.type.startsWith('image/')) {
        toast.error("Only images are supported right now");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX = 800;
            if (width > height) {
                if (width > MAX) {
                    height *= MAX / width;
                    width = MAX;
                }
            } else {
                if (height > MAX) {
                    width *= MAX / height;
                    height = MAX;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const base64Img = canvas.toDataURL('image/jpeg', 0.6);
            
            try {
              await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
                text: "",
                userId: user.uid,
                userName: profile.fullName || profile.username || "Unknown",
                userPhoto: profile.photoURL || null,
                createdAt: serverTimestamp(),
                replyToId: replyingTo?.id || null,
                replyToText: replyingTo?.text || null,
                replyToUser: replyingTo?.userName || null,
                type: 'image',
                imageUrl: base64Img
              });
              setReplyingTo(null);
            } catch (error) {
              console.error(error);
              toast.error("Error sending image");
            }
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };"""

content = content.replace(old_file_click, new_file_logic)

# 3. Add file input to JSX
if '<input type="file"' not in content:
    content = content.replace(
        '<form onSubmit={handleSendMessage}',
        '<input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />\n                       <form onSubmit={handleSendMessage}'
    )

# 4. Render image in bubble
old_bubble = """                                         {/* Bubble */}
                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            <div className="leading-relaxed">{msg.text}</div>
                                            <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                         </div>"""

new_bubble = """                                         {/* Bubble */}
                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm",
                                             msg.type === 'image' ? 'p-1.5' : '')}>
                                            {msg.type === 'image' && msg.imageUrl ? (
                                                <div className="relative rounded-2xl overflow-hidden bg-black/5">
                                                    <img src={msg.imageUrl} alt="Shared image" className="max-w-[240px] md:max-w-xs max-h-64 object-contain rounded-2xl" />
                                                </div>
                                            ) : null}
                                            {msg.text && <div className={cn("leading-relaxed", msg.type === 'image' && 'px-2 pt-1.5 pb-1')}>{msg.text}</div>}
                                            <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400", msg.type === 'image' && !msg.text ? 'px-2 pb-1 bg-gradient-to-t from-black/50 to-transparent absolute bottom-1.5 right-1.5 text-white/90 rounded-bl-md rounded-br-md !mb-0' : '')}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                         </div>"""
content = content.replace(old_bubble, new_bubble)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

