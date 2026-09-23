const url = 'https://drive.google.com/file/d/1_dummy_private_id_xyz/view?usp=sharing';
fetch(url, { redirect: 'manual' })
  .then(r => console.log('STATUS:', r.status, 'LOCATION:', r.headers.get('location')))
  .catch(e => console.error('ERR:', e.message));
