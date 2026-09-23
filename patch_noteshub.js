const fs = require('fs');
let code = fs.readFileSync('src/pages/NotesHub.tsx', 'utf-8');

const corrupted = `            {note.fileType === 'image' && note.fileUrl && (
              <div className="px-5 pb-3">
                <div 
                  className="w-full h-40 bg-slate-100 rounded-xl overflow-hidden cursor-pointer relative group border border-slate-200"
                  onClick={() => setPreviewImage(note.fileUrl)}
                >
                  <img src={note.fileUrl} alt={note.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </div>
              </div>
            )}`;

const fixed = `            {note.fileType === 'image' && note.fileUrl && (
              <div className="px-5 pb-3">
                <div 
                  className="w-full h-40 bg-slate-100 rounded-xl overflow-hidden cursor-pointer relative group border border-slate-200"
                  onClick={() => setPreviewImage(note.fileUrl)}
                >
                  <img src={note.fileUrl} alt={note.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </div>
              </div>
            )}
            {note.fileType !== 'image' && note.fileType !== 'link' && note.fileUrl && (
              <div className="px-5 pb-3">
                <div className="flex items-center space-x-3 bg-slate-100/50 rounded-xl p-3 border border-slate-200">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <FileText className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">Document Attached</p>
                    <p className="text-xs text-slate-500 truncate">Click open to view</p>
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(corrupted, fixed);
fs.writeFileSync('src/pages/NotesHub.tsx', code);
