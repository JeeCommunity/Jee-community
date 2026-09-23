const url = 'https://drive.google.com/file/d/1_dummy_private_id_xyz/view?usp=sharing';
// Let's test with a real public link if possible, or just look at the HTTP status
// Actually, let me write a better function to extract the file ID and ping it.
function getFileId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
console.log(getFileId(url));
