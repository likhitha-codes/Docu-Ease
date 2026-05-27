import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDm9Od0W9pZyJasfJrNDql6J9ARD1jFtYY",
  authDomain: "docuease-333bf.firebaseapp.com",
  projectId: "docuease-333bf",
  storageBucket: "docuease-333bf.firebasestorage.app",
  messagingSenderId: "293363036300",
  appId: "1:293363036300:web:455c37e87a676728354ba9"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connectivity Check-off to validate the configuration dynamically
async function validateFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "_test_connection_", "validate"));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firebase client appears to be offline. Verify network connection.");
    }
  }
}

validateFirebaseConnection();
