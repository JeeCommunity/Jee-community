import fs from 'fs';
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

const meetRender = `
                                                  {msg.type === 'meet' && msg.meetUri && (
                                                     <div className="my-2 border rounded-xl overflow-hidden bg-white shadow-sm">
                                                       <div className="bg-slate-50 border-b border-slate-100 p-3 flex flex-col items-center justify-center text-center">
                                                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                                            <Video className="w-6 h-6" />
                                                          </div>
                                                          <div className="font-bold text-slate-800 text-sm">Live Video Call</div>
                                                          <div className="text-xs text-slate-500">Tap to join this study session!</div>
                                                       </div>
                                                       <div className="p-2 bg-white">
                                                          <a href={msg.meetUri} target="_blank" rel="noreferrer" className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                                                            Join Meet
                                                          </a>
                                                       </div>
                                                     </div>
                                                  )}
                                                  {msg.type === 'file' && msg.fileUrl && (`;

code = code.replace("{msg.type === 'file' && msg.fileUrl && (", meetRender);

fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Patched Message UI");
