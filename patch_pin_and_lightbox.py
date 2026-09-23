import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add selectedImage state
state_match = r'  const \[editingMessageId, setEditingMessageId\] = useState<string \| null>\(null\);'
new_state = """  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);"""
content = re.sub(state_match, new_state, content, count=1)

# Modify image to have onClick and pointer cursor
img_match = r'<img src=\{msg.imageUrl\} alt="Shared image" className="max-w-\[240px\] md:max-w-xs max-h-64 object-contain rounded-2xl" />'
new_img = '<img src={msg.imageUrl} alt="Shared image" className="max-w-[240px] md:max-w-xs max-h-64 object-contain rounded-2xl cursor-pointer hover:opacity-90 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedImage(msg.imageUrl || null); }} />'
content = content.replace(img_match, new_img)

# Remove Pin button
pin_btn_match = r'                                         \{!isMe && activeGroup\.creatorId === user\?\.uid && \(\n                                            <button onClick=\{[^}]+\} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors" title="Pin">\n                                               <Pin className="w-4 h-4" />\n                                            </button>\n                                         \)\}'
content = re.sub(pin_btn_match, '', content)

# Add lightbox at the very end of the return statement
lightbox_code = """      </div>
      {/* Lightbox */}
      {selectedImage && (
         <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 md:p-8" onClick={() => setSelectedImage(null)}>
             <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                 <X className="w-6 h-6" />
             </button>
             <img src={selectedImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
         </div>
      )}
    </div>
  );
};"""

end_match = r'      </div>\n    </div>\n  \);\n\};'
content = re.sub(end_match, lightbox_code, content)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
