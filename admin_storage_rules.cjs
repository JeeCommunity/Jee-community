const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function updateRules() {
  const securityRules = admin.securityRules();
  // We can't directly update storage rules easily through securityRules since it defaults to firestore, 
  // but wait, is it possible to fetch them?
  const rulesets = await securityRules.listRulesetMetadata();
  console.log(rulesets);
}

updateRules().catch(console.error);
