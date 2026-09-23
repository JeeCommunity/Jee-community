import fs from 'fs';

let code = fs.readFileSync('src/components/CommentsModal.tsx', 'utf8');

// Replace deleteDoc with updateDoc
code = code.replace(
  "await deleteDoc(doc(db, 'comments', comment.id));",
  "await updateDoc(doc(db, 'comments', comment.id), { isDeleted: true });"
);

// We need to inject the early return and the red badge.
// The early return goes right after the `useEffect` hooks or `const isLiked = ...`
// Let's replace:
//   const isLiked = user && comment.likedBy?.includes(user.uid);
// with:
//   const isLiked = user && comment.likedBy?.includes(user.uid);
//   if (comment.isDeleted && isCommentOwner) return null;
code = code.replace(
  "const isLiked = user && comment.likedBy?.includes(user.uid);",
  "const isLiked = user && comment.likedBy?.includes(user.uid);\n  if (comment.isDeleted && isCommentOwner) return null;"
);

// Now for the badge. It should be inside the comment content area.
// Let's replace:
//   <div className="flex items-center space-x-2 min-w-0">
// with:
//   {comment.isDeleted && <div className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit border border-red-100"><ShieldAlert className="w-3 h-3" />This comment was deleted by sender</div>}
//   <div className="flex items-center space-x-2 min-w-0">

code = code.replace(
  /<div className="flex items-center space-x-2 min-w-0">/g,
  `{comment.isDeleted && <div className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit border border-red-100"><ShieldAlert className="w-3 h-3" />This comment was deleted by sender</div>}\n            <div className="flex items-center space-x-2 min-w-0">`
);

fs.writeFileSync('src/components/CommentsModal.tsx', code);
console.log("Patched CommentsModal soft delete");
