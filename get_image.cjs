const admin = require('firebase-admin');
const appConfig = require('./firebase-applet-config.json');

// Need to just grab the photo URL from firestore directly since user is having trouble copying it
admin.initializeApp({
  credential: admin.credential.cert(appConfig.serviceAccountKey),
  databaseURL: `https://${appConfig.projectId}.firebaseio.com`
});

const db = admin.firestore();

async function getImageUrl() {
  try {
    // Look in messages for any recent image upload
    console.log("Searching for recent messages with images...");
    const snapshot = await db.collectionGroup('messages')
      .where('type', '==', 'image')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
      
    if (snapshot.empty) {
      console.log('No recent image messages found.');
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Found image URL: ${data.fileUrl}`);
      });
    }
  } catch (error) {
    console.error("Error fetching images:", error);
  } finally {
    process.exit(0);
  }
}

getImageUrl();
