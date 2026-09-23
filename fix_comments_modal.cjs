const fs = require('fs');

let file = 'src/components/CommentsModal.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove auto warning
const targetAutoWarning = `      if (isToxic && !sendAsChulbul) {
        const warningComment = {
          text: "Arey oye! 🛑 Inspector Chulbul here! Mera kaam hai is community ko saaf-suthra rakhna. Tumhare is message me mujhe kuch gadbad aur toxic words mile hain. Aisi bhasha ka istemaal turant rok do warna seedha lockup (Account BAN)! Samajh gaye na? 🚨👮‍♂️",
          authorId: 'inspector-chulbul-bot',
          postId: post.id,
          createdAt: serverTimestamp(),
          parentId: commentDocRef.id, // reply to the toxic comment
          likesCount: 0,
          likedBy: [],
        };
        await addDoc(collection(db, 'comments'), warningComment);
        await updateDoc(doc(db, 'posts', post.id), {
          commentsCount: (post.commentsCount || 0) + 2 // +1 for comment, +1 for warning
        });
      } else {
        await updateDoc(doc(db, 'posts', post.id), {
          commentsCount: (post.commentsCount || 0) + 1
        });
      }`;

const replacementAutoWarning = `      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: (post.commentsCount || 0) + 1
      });`;

if (code.includes(targetAutoWarning)) {
  code = code.replace(targetAutoWarning, replacementAutoWarning);
} else {
  console.log("Could not find auto warning block");
}

// 2. Fix notification sender details
const targetNotif = `if (profile && user) {
        if (replyingTo) {
          createNotification({
            recipientId: replyingTo.authorId || post.authorId,
            senderId: user.uid,
            senderName: profile.fullName || 'User',
            senderAvatar: profile.photoURL || '',
            type: 'reply',
            postId: post.id,
            commentId: replyingTo.id,
            commentContent: newCommentData.text
          });
        } else {
          createNotification({
            recipientId: post.authorId,
            senderId: user.uid,
            senderName: profile.fullName || 'User',
            senderAvatar: profile.photoURL || '',
            type: 'comment',
            postId: post.id,
            postContent: post.content,
            commentContent: newCommentData.text
          });
        }
      }`;

const replacementNotif = `if (profile && user) {
        const notifySenderId = sendAsChulbul ? 'inspector-chulbul-bot' : user.uid;
        const notifySenderName = sendAsChulbul ? 'Inspector Chulbul 👮‍♂️' : (profile.fullName || 'User');
        const notifySenderAvatar = sendAsChulbul ? '/chulbul.png' : (profile.photoURL || '');

        if (replyingTo && replyingTo.authorId !== notifySenderId) {
          createNotification({
            recipientId: replyingTo.authorId || post.authorId,
            senderId: notifySenderId,
            senderName: notifySenderName,
            senderAvatar: notifySenderAvatar,
            type: 'reply',
            postId: post.id,
            commentId: replyingTo.id,
            commentContent: newCommentData.text
          });
        } else if (post.authorId !== notifySenderId) {
          createNotification({
            recipientId: post.authorId,
            senderId: notifySenderId,
            senderName: notifySenderName,
            senderAvatar: notifySenderAvatar,
            type: 'comment',
            postId: post.id,
            postContent: post.content,
            commentContent: newCommentData.text
          });
        }
      }`;

if (code.includes(targetNotif)) {
  code = code.replace(targetNotif, replacementNotif);
} else {
  console.log("Could not find notification block");
}

fs.writeFileSync(file, code);
console.log("Patched CommentsModal successfully.");
