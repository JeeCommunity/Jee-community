import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# First remove the misplaced lightbox
bad_lightbox_match = r'    \);\n      \{\/\* Lightbox \*\/.*?      \}\n  \}'
# We'll just replace the whole thing starting from `      </div>\n    );\n      {/* Lightbox */}` down to `  }`

bad_code = """      </div>
    );
      {/* Lightbox */}
      {selectedImage && (
         <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 md:p-8" onClick={() => setSelectedImage(null)}>
             <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                 <X className="w-6 h-6" />
             </button>
             <img src={selectedImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
         </div>
      )}
  }"""

good_code = """      </div>
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
  }"""

content = content.replace(bad_code, good_code)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
