import fs from 'fs';
async function run() {
  const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const url = "data:image/png;base64," + imgBase64;
  const res = await fetch('http://localhost:3000/api/tutor-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What is this?', image: url }]
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
