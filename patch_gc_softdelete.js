import fs from 'fs';

let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

code = code.replace(
  "await deleteDoc(doc(db, 'study_groups', activeGroup.id, 'messages', msgId));",
  "await updateDoc(doc(db, 'study_groups', activeGroup.id, 'messages', msgId), { isDeleted: true });"
);

code = code.replace(
  "messages.map((msg, idx) => {",
  `messages.map((msg, idx) => {
                                      const isMe = msg.senderId === user?.uid;
                                      if (msg.isDeleted && isMe) return null;`
);

// We also need to remove the existing `const isMe = msg.senderId === user?.uid;` inside the map to avoid redeclaration.
code = code.replace(
  "const isMe = msg.senderId === user?.uid;",
  ""
);

// Add the red badge.
code = code.replace(
  "{msg.type === 'image' && msg.fileUrl && (",
  `{msg.isDeleted && !isMe && (
                                                     <div className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit border border-red-100">
                                                       <ShieldAlert className="w-3 h-3" />
                                                       This message was deleted by sender
                                                     </div>
                                                  )}
                                                  {msg.type === 'image' && msg.fileUrl && (`
);

fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Patched PrivateStudyGroups soft delete");
