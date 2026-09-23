import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function getFullChat() {
    try {
        const groupSnap = await db.collection('study_groups').where('shortCode', '==', 'GC-CB92P').get();
        if (groupSnap.empty) {
            console.log("Group not found.");
            return;
        }
        const groupId = groupSnap.docs[0].id;
        
        const messagesSnap = await db.collection('study_groups').doc(groupId).collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
            
        console.log("--- Last 100 messages in GC ---");
        const messages = [];
        messagesSnap.forEach(doc => {
            messages.push(doc.data());
        });
        
        // Print in chronological order (oldest to newest among the last 100)
        messages.reverse().forEach(data => {
            console.log(`[${data.userName || data.userId}]: ${data.text}`);
        });
    } catch(e) {
        console.error(e);
    }
}
getFullChat();
