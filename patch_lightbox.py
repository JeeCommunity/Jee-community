import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    lines = f.readlines()

lightbox_code = """      {/* Lightbox */}
      {selectedImage && (
         <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 md:p-8" onClick={() => setSelectedImage(null)}>
             <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                 <X className="w-6 h-6" />
             </button>
             <img src={selectedImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
         </div>
      )}
"""

# Find the end of activeGroup block
for i, line in enumerate(lines):
    if "  return (" in line and i > 1040:
        insert_idx = i - 2
        lines.insert(insert_idx, lightbox_code)
        break

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.writelines(lines)
