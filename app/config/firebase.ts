import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// import { getAnalytics } from "firebase/analytics"; // Optional: if you need analytics

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbU3b14WbGB_QAREETUMlbRCAGRUCZf_U",
  authDomain: "elite-elevator-411619.firebaseapp.com",
  projectId: "elite-elevator-411619",
  storageBucket: "elite-elevator-411619.appspot.com",
  messagingSenderId: "98325339290",
  appId: "1:98325339290:web:a51c38845c893f1b1b5323",
  // measurementId: "YOUR_MEASUREMENT_ID" // Optional: Add if needed
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// const analytics = getAnalytics(app); // Optional

export { app, db, auth };
