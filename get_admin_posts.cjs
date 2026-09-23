const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./payload.json', 'utf-8')).firebase_admin_key;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').limit(5).get();
  console.log(`Found ${snapshot.docs.length} posts`);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().text, doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt);
  });
}
run().then(() => process.exit(0)).catch(console.error);
