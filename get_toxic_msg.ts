import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function getToxicMsgs() {
    try {
        const groupCode = 'GC-CB92P';
        const groupSnap = await db.collection('study_groups').where('shortCode', '==', groupCode).get();
        const groupId = groupSnap.docs[0].id;

        const messagesSnap = await db.collection('study_groups').doc(groupId).collection('messages')
            .where('isToxic', '==', true)
            .get();
        
        messagesSnap.forEach(doc => {
            const data = doc.data();
            console.log(`[${data.senderName}] Text: "${data.text}"`);
            console.log(`Toxic Words Flagged: ${data.toxicWords?.join(', ')}`);
        });

    } catch(err) {
        console.error(err);
    }
}
getToxicMsgs();
