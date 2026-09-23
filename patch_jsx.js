const fs = require('fs');
let code = fs.readFileSync('src/components/PostCard.tsx', 'utf-8');

const corrupted = `                  )}
                </div>
              )}
              {post.pdfUrl && (
                <div className="mt-3 flex items-center space-x-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">PDF Attachment</p>
                  </div>
                  <a 
                    href={post.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200"
                  >
                    Open <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              )}
                  {post.images.length > 1 && (
                     <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                       1 / {post.images.length}
                     </div>
                  )}
                </div>
              )}`;

const fixed = `                    </div>
                  )}
                  {post.images.length > 1 && (
                     <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                       1 / {post.images.length}
                     </div>
                  )}
                </div>
              )}
              {post.pdfUrl && (
                <div className="mt-3 flex items-center space-x-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">PDF Attachment</p>
                  </div>
                  <a 
                    href={post.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200"
                  >
                    Open <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              )}`;

code = code.replace(corrupted, fixed);
fs.writeFileSync('src/components/PostCard.tsx', code);
