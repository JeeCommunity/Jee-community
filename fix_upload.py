import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

upload_func = """
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) { // 1MB limit
        toast.error("Image must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditGroupPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
"""

content = content.replace(
    "const handleUpdateGroup = async",
    upload_func + "\n  const handleUpdateGroup = async"
)

old_form = """                             <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Image URL (Optional)</label>
                               <input type="url" value={editGroupPhoto} onChange={(e) => setEditGroupPhoto(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                             </div>"""

new_form = """                             <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Group Picture (Optional)</label>
                               <div className="flex items-center gap-3">
                                 {editGroupPhoto && (
                                   <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                      <img src={editGroupPhoto} alt="Preview" className="w-full h-full object-cover" />
                                   </div>
                                 )}
                                 <input 
                                   type="file" 
                                   accept="image/*"
                                   onChange={handleImageUpload} 
                                   className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" 
                                 />
                               </div>
                               <p className="text-[10px] text-slate-400 mt-1.5">Max size: 1MB.</p>
                             </div>"""

content = content.replace(old_form, new_form)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

