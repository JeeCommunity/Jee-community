import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

if (!serviceAccount) {
    console.log("No FIREBASE_SERVICE_ACCOUNT found in env.");
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}
const db = getFirestore();

async function findPoll() {
    try {
        console.log("Searching users for 'hrizz'...");
        const usersRef = db.collection('users');
        let userSnapshot = await usersRef.where('username', '==', 'hrizz').get();
        if (userSnapshot.empty) {
            userSnapshot = await usersRef.where('fullName', '==', 'hrizz').get();
        }
        
        let userId = null;
        if (!userSnapshot.empty) {
            userId = userSnapshot.docs[0].id;
            console.log(`Found user 'hrizz' with ID: ${userId}`);
        } else {
            console.log("Could not find user 'hrizz' directly. Searching all posts...");
        }

        const postsRef = db.collection('posts');
        let postsQuery = userId ? postsRef.where('authorId', '==', userId) : postsRef;
        const postsSnapshot = await postsQuery.get();
        
        let foundPoll = false;
        postsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.poll && (!userId || data.authorId === userId)) {
                foundPoll = true;
                console.log("\n--- POLL POST FOUND ---");
                console.log(`Post ID: ${doc.id}`);
                console.log(`Text: ${data.text}`);
                console.log(`Created At: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt}`);
                console.log(`Author ID: ${data.authorId}`);
                console.log(`Likes: ${data.likesCount}, Dislikes: ${data.dislikesCount}`);
                console.log("Poll Data:");
                console.log(JSON.stringify(data.poll, null, 2));
                console.log("-----------------------\n");
            }
        });
        
        if (!foundPoll) {
            console.log("No polls found for this user/criteria.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
findPoll();
