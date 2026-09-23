const { google } = require('googleapis');
async function getToken() {
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
  const token = await client.getAccessToken();
  console.log(token.token);
}
getToken().catch(e => { console.error(e); process.exit(1); });
