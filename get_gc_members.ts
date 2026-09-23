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

async function getMembers() {
    try {
        const groupCode = 'GC-CB92P';
        const groupSnap = await db.collection('study_groups').where('shortCode', '==', groupCode).get();
        if (groupSnap.empty) {
            console.log("Group not found.");
            return;
        }

        const groupData = groupSnap.docs[0].data();
        const memberIds = groupData.members || [];
        
        console.log(`--- Members of ${groupData.name} ---`);
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

            console.log(`Name: ${fullName} | Username: @${username} | Email: ${email}`);
        }

    } catch(err) {
        console.error(err);
    }
}
getMembers();
