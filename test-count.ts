import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getCountFromServer } from 'firebase/firestore';

const firebaseConfig = {
  // need to get from .env or somewhere
};
// I can't easily run client SDK in node without full setup. Let's not do that.
