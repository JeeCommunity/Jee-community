const fs = require('fs');
let code = fs.readFileSync('src/pages/NotesHub.tsx', 'utf8');

const target = `                    <div className="flex items-center gap-2">
                      {note.uploadedBy.avatar ? (
                        <img src={note.uploadedBy.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {note.uploadedBy.name[0]}
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-slate-500">by {note.uploadedBy.name}</span>
                    </div>`;

const replacement = `                    <div className="flex items-center gap-2">
                      {((user?.uid === note.uploadedBy.uid && profile?.photoURL) || note.uploadedBy.avatar) ? (
                        <img src={(user?.uid === note.uploadedBy.uid && profile?.photoURL) ? profile.photoURL : note.uploadedBy.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {((user?.uid === note.uploadedBy.uid && (profile?.fullName || profile?.username)) ? (profile.fullName || profile.username) : note.uploadedBy.name)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-slate-500">by {(user?.uid === note.uploadedBy.uid && (profile?.fullName || profile?.username)) ? (profile.fullName || profile.username) : note.uploadedBy.name}</span>
                    </div>`;

if (code.includes(target)) {
    fs.writeFileSync('src/pages/NotesHub.tsx', code.replace(target, replacement));
    console.log("Patched NotesHub.tsx rendering successfully");
} else {
    console.log("Could not find target in NotesHub.tsx rendering");
}
