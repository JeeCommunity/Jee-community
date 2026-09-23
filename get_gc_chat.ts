import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function getChat() {
    try {
        const groupSnap = await db.collection('study_groups').where('shortCode', '==', 'GC-CB92P').get();
        const groupId = groupSnap.docs[0].id;
        
        const messagesSnap = await db.collection('study_groups').doc(groupId).collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
            
        console.log("--- Last 10 messages in GC ---");
        messagesSnap.forEach(doc => {
            const data = doc.data();
            console.log(`[${data.userName}]: ${data.text}`);
        });
    } catch(e) {}
}
getChat();
