import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function findGaytri() {
    try {
        console.log("Searching for user 'gaytri'...");
        const usersSnap = await db.collection('users').get();
        let gaytriId = null;
        let gaytriName = null;
        
        usersSnap.forEach(doc => {
            const data = doc.data();
            const name = (data.fullName || "").toLowerCase();
            const uname = (data.username || "").toLowerCase();
            if (name.includes('gaytri') || name.includes('gayatri') || uname.includes('gaytri')) {
                gaytriId = doc.id;
                gaytriName = data.fullName || data.username;
                console.log(`Found User: ${gaytriName} (ID: ${gaytriId})`);
            }
        });

        if (!gaytriId) {
            console.log("Could not find any user named Gaytri.");
            return;
        }

        console.log("\nSearching for their current posts...");
        const postsSnap = await db.collection('posts').where('authorId', '==', gaytriId).get();
        if (postsSnap.empty) {
            console.log("No active posts found for this user. It was likely permanently deleted.");
        } else {
            postsSnap.forEach(doc => {
                const p = doc.data();
                console.log(`[Active Post] ID: ${doc.id} | Date: ${p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt}`);
                console.log(`Text: ${p.text}`);
                if (p.imageUrl) console.log(`Image: ${p.imageUrl}`);
                console.log("---");
            });
        }
        
        // Let's also check if we have any soft-deleted posts collection or similar (not standard, but worth checking)
        const deletedSnap = await db.collection('deleted_posts').where('authorId', '==', gaytriId).get().catch(() => ({empty: true}));
        if (!deletedSnap.empty) {
             console.log("\nFound in deleted_posts collection:");
             deletedSnap.forEach(doc => {
                  console.log(doc.data().text);
             });
        }

    } catch(err) {
        console.error(err);
    }
}
findGaytri();
