const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  const db = admin.firestore();
  const snapshot = await db.collection('notes_hub').limit(10).get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data().linkUrl || doc.data().fileUrl);
  });
}
run();
