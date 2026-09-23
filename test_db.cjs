const admin = require('firebase-admin');
const appConfig = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: appConfig.projectId,
    clientEmail: appConfig.clientEmail,
    privateKey: appConfig.privateKey.replace(/\\n/g, '\n')
  }),
  databaseURL: `https://${appConfig.projectId}.firebaseio.com`
});

const db = admin.firestore();

async function getImageUrl() {
  try {
    console.log("Searching for recent messages with images...");
    const snapshot = await db.collectionGroup('messages')
      .where('type', '==', 'image')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
      
    if (snapshot.empty) {
      console.log('No recent image messages found.');
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`BINGO! IMAGE URL FOUND: ${data.fileUrl}`);
      });
    }
  } catch (error) {
    console.error("Error fetching images:", error);
  } finally {
    process.exit(0);
  }
}

getImageUrl();
