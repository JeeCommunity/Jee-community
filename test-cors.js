fetch('https://catbox.moe/user/api.php', { method: 'OPTIONS' }).then(res => {
  console.log('CORS Headers:', res.headers.get('access-control-allow-origin'));
}).catch(err => console.error(err));
