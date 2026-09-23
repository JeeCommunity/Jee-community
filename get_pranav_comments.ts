import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function checkComments() {
    try {
        console.log("Searching for the post...");
        let postSnapshot = await db.collection('posts').get();
        let targetPostId = null;
        postSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.text && data.text.includes("guyzz, ek bnde ne mere name se")) {
                targetPostId = doc.id;
            }
        });

        if (!targetPostId) {
            console.log("Post not found.");
            return;
        }
        console.log(`Found Post ID: ${targetPostId}`);

        console.log("\nSearching for ALL current comments on this post...");
        const commentsSnap = await db.collection('comments').where('postId', '==', targetPostId).get();
        if (commentsSnap.empty) {
            console.log("No active comments found on this post.");
        } else {
            commentsSnap.forEach(doc => {
                const c = doc.data();
                console.log(`- [${c.authorName}] (${c.authorId}): ${c.text}`);
            });
        }

        console.log("\nSearching ALL comments for user 'pranav' globally just in case...");
        const allCommentsSnap = await db.collection('comments').get();
        let pranavCount = 0;
        allCommentsSnap.forEach(doc => {
            const c = doc.data();
            if (c.authorName && c.authorName.toLowerCase().includes("pranav")) {
                pranavCount++;
                console.log(`- PostID [${c.postId}] -> ${c.authorName}: ${c.text}`);
            }
        });
        if (pranavCount === 0) {
            console.log("No active comments found by anyone named Pranav in the entire database.");
        }
    } catch(err) {
        console.error(err);
    }
}
checkComments();
