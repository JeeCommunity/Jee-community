import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findPoll() {
    try {
        console.log("Searching for user 'hrizz'...");
        const usersRef = collection(db, 'users');
        let userSnapshot = await getDocs(query(usersRef, where('username', '==', 'hrizz')));
        if (userSnapshot.empty) {
            userSnapshot = await getDocs(query(usersRef, where('fullName', '==', 'hrizz')));
        }
        
        let userId = null;
        if (!userSnapshot.empty) {
            userId = userSnapshot.docs[0].id;
            console.log(`Found user 'hrizz' with ID: ${userId}`);
        } else {
            console.log("Could not find user 'hrizz'. Searching all posts...");
        }

        const postsRef = collection(db, 'posts');
        const postsQuery = userId ? query(postsRef, where('authorId', '==', userId)) : postsRef;
        const postsSnapshot = await getDocs(postsQuery);
        
        let foundPoll = false;
        postsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.poll && (!userId || data.authorId === userId)) {
                foundPoll = true;
                console.log("\n--- POLL POST FOUND ---");
                console.log(`Post ID: ${doc.id}`);
                console.log(`Text: ${data.text}`);
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
    process.exit(0);
}
findPoll();
