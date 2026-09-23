import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Add selectedImage state
state_block = """  const [isUploading, setIsUploading] = useState(false);"""
new_state_block = """  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);"""
content = content.replace(state_block, new_state_block)

# 2. Fix finally block
old_handle = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];"""
new_handle = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target;
      const file = target.files?.[0];"""
content = content.replace(old_handle, new_handle)

old_finally = """      } finally {
          setIsUploading(false);
          toast.dismiss(loadingToast);
          e.target.value = '';
      }"""
new_finally = """      } finally {
          setIsUploading(false);
          toast.dismiss(loadingToast);
          target.value = '';
      }"""
content = content.replace(old_finally, new_finally)

# 3. Add onClick to image
old_img_block = """                                                  {msg.type === 'image' && msg.fileUrl && (
                                                     <div className="max-w-[240px] max-h-[300px] rounded-lg overflow-hidden my-1">
                                                        <img src={msg.fileUrl} alt="Uploaded image" className="w-full h-auto object-contain bg-black/5" />
                                                     </div>
                                                  )}"""
new_img_block = """                                                  {msg.type === 'image' && msg.fileUrl && (
                                                     <div className="max-w-[240px] max-h-[300px] rounded-lg overflow-hidden my-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedImage(msg.fileUrl)}>
                                                        <img src={msg.fileUrl} alt="Uploaded image" className="w-full h-auto object-contain bg-black/5" />
                                                     </div>
                                                  )}"""
content = content.replace(old_img_block, new_img_block)

# 4. Add popup at the bottom of the component
# Find the last closing tag for the main component.
old_end = """        </div>
      </div>
    );
  }"""
new_end = """        </div>
        
        {/* Full Screen Image Viewer */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
             <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors border border-white/20">
                <X className="w-6 h-6" />
             </button>
             <img src={selectedImage} alt="Expanded" className="max-w-full max-h-full object-contain drop-shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }"""
content = content.replace(old_end, new_end)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
print("Popup added!")
