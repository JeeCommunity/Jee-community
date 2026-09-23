const { google } = require('googleapis');
const fs = require('fs');

async function updateRules() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
      project_id: serviceAccount.project_id
    },
    scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform']
  });

  const client = await auth.getClient();
  const projectId = serviceAccount.project_id;

  const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

  // We need to use REST api directly
  // 1. Create a ruleset
  console.log("Creating ruleset...");
  const createRulesetRes = await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    method: 'POST',
    data: {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent
          }
        ]
      }
    }
  });

  const rulesetName = createRulesetRes.data.name;
  console.log("Created ruleset:", rulesetName);

  // 2. Update release
  console.log("Updating release...");
  await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    method: 'PATCH',
    data: {
      release: {
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: rulesetName
      }
    }
  });
  console.log("Done!");
}

updateRules().catch(console.error);
