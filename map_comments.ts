import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function mapComments() {
    try {
        const targetPostId = 'XHm9QzfCUi90IvduxR8C';
        const commentsSnap = await db.collection('comments').where('postId', '==', targetPostId).get();
        
        const authorIds = [...new Set(commentsSnap.docs.map(doc => doc.data().authorId))];
        const userProfiles = {};
        
        await Promise.all(authorIds.map(async (uid) => {
            if (!uid) return;
            const uSnap = await db.collection('users').doc(uid).get();
            if (uSnap.exists) {
                userProfiles[uid] = uSnap.data();
            }
        }));

        console.log("Comments mapped to users:");
        commentsSnap.forEach(doc => {
            const c = doc.data();
            const u = userProfiles[c.authorId] || {};
            const name = u.fullName || u.username || 'Unknown User';
            
            if (name.toLowerCase().includes('pranav')) {
                console.log(`\n--- Pranav's Comment ---`);
                console.log(`Text: ${c.text}`);
                console.log(`Comment ID: ${doc.id}`);
            }
            // Let's print all so we can see the full discussion for context
            console.log(`[${name}] ${c.text}`);
        });

    } catch(err) {
        console.error(err);
    }
}
mapComments();
