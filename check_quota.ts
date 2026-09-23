import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function check() {
    try {
        const snap = await db.collection('posts').limit(1).get();
        console.log("Success reading 1 doc:", snap.empty ? "Empty" : "Has Data");
    } catch(e) {
        console.log("Error:", e.message);
    }
}
check();
