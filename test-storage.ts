import * as dotenv from 'dotenv';
dotenv.config();
// mock import.meta.env
(global as any).import = { meta: { env: process.env } };
import { app, storage } from './src/firebase.ts';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
async function run() {
  if (!storage) {
    console.log("No storage");
    return;
  }
  const storageRef = ref(storage, 'test.txt');
  try {
    await uploadString(storageRef, 'hello world');
    const url = await getDownloadURL(storageRef);
    console.log("Success:", url);
  } catch (e: any) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}
run();
