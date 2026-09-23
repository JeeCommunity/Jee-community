import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function fixFlags() {
    try {
        const groupCode = 'GC-CB92P';
        const groupSnap = await db.collection('study_groups').where('shortCode', '==', groupCode).get();
        const groupId = groupSnap.docs[0].id;

        await db.collection('study_groups').doc(groupId).update({ needsAdminAttention: false });
        
        const messagesSnap = await db.collection('study_groups').doc(groupId).collection('messages')
            .where('isToxic', '==', true)
            .get();
        
        for (const doc of messagesSnap.docs) {
            await doc.ref.update({
                isToxic: false,
                toxicWords: []
            });
        }
        console.log("Flags cleared.");
    } catch(err) {
        console.error(err);
    }
}
fixFlags();
