import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const auth = getAuth();

async function getGroupDetails() {
    try {
        const groupCode = 'GC-CB92P';
        console.log(`Searching for group with code: ${groupCode}`);
        
        const groupSnap = await db.collection('study_groups').where('shortCode', '==', groupCode).get();
        if (groupSnap.empty) {
            console.log("Group not found.");
            return;
        }

        const groupDoc = groupSnap.docs[0];
        const groupData = groupDoc.data();
        console.log(`\nGroup Name: ${groupData.name}`);
        console.log(`Created By: ${groupData.createdBy}`);
        console.log(`Flags/Status on Group:`, groupData.redFlag ? "Yes" : "No", groupData);

        const memberIds = groupData.members || [];
        console.log(`\n--- Members (${memberIds.length}) ---`);
        
        for (const uid of memberIds) {
            let email = "N/A";
            let fullName = "N/A";
            let username = "N/A";
            
            try {
                const userRecord = await auth.getUser(uid);
                email = userRecord.email || "N/A";
            } catch(e) {}
            
            try {
                const userDoc = await db.collection('users').doc(uid).get();
                if (userDoc.exists) {
                    const ud = userDoc.data();
                    fullName = ud.fullName || "N/A";
                    username = ud.username || "N/A";
                }
            } catch(e) {}

            console.log(`- ${fullName} (@${username}) | Email: ${email} | UID: ${uid}`);
        }

        console.log("\n--- Recent Messages ---");
        const messagesSnap = await db.collection('study_groups').doc(groupDoc.id).collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const messages = [];
        messagesSnap.forEach(doc => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                text: data.text,
                userId: data.userId,
                senderName: data.senderName,
                isFlagged: data.isFlagged,
                flagReason: data.flagReason
            });
        });

        messages.reverse().forEach(m => {
            const flagInfo = m.isFlagged ? `[FLAGGED: ${m.flagReason}] ` : '';
            console.log(`[${m.senderName}] ${flagInfo}: ${m.text}`);
        });

    } catch(err) {
        console.error(err);
    }
}
getGroupDetails();
