const fs = require('fs');
let code = fs.readFileSync('src/pages/NotesHub.tsx', 'utf-8');

const corrupted = `            {note.fileType !== 'image' && note.fileType !== 'link' && note.fileUrl && (
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

const fixed = `            {note.fileType !== 'image' && note.fileType !== 'link' && note.fileUrl && (
              <div className="px-5 pb-3">
                <div className="flex items-center space-x-3 bg-slate-100/50 rounded-xl p-3 border border-slate-200">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <FileText className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">Document Attached</p>
                    <p className="text-xs text-slate-500 truncate">Click open to view</p>
                  </div>
                  <a 
                    href={note.fileUrl.includes('.pdf') ? note.fileUrl.replace('/upload/', '/upload/fl_attachment/') : note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full"
                  >
                    Open <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            )}`;

code = code.replace(corrupted, fixed);
fs.writeFileSync('src/pages/NotesHub.tsx', code);
