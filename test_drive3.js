async function checkDriveLink(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      redirect: 'follow'
    });

    const text = await response.text();
    const finalUrl = response.url;
    
    console.log("FINAL URL:", finalUrl);
    console.log("STATUS:", response.status);
    console.log("TEXT snippet:", text.substring(0, 100));
    
    if (finalUrl.includes('ServiceLogin') || 
        text.includes('<title>Google Drive - Sign in</title>') || 
        text.includes('Request access') || 
        text.includes('You need access')) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    return true; // error fallback
  }
}
checkDriveLink('https://drive.google.com/file/d/1_dummy_private_id_xyz/view?usp=sharing');
