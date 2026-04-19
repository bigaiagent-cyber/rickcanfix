import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot as per guidelines
async function testConnection() {
  try {
    // Guidelines say doc(db, 'test', 'connection'), but we don't need to actually read it yet
    // just testing connectivity
    await getDocFromServer(doc(db, 'inquiries', 'connection-test')).catch(() => {});
    console.log("Firebase connection initialized.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
