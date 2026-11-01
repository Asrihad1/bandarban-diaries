import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBApajhaEtpEBCOqZ6ENBHWl2Y0_3wt-D8",
    authDomain: "travel-diaries-4df3a.firebaseapp.com",
    projectId: "travel-diaries-4df3a",
    storageBucket: "travel-diaries-4df3a.firebasestorage.app",
    messagingSenderId: "758701369488",
    appId: "1:758701369488:web:56b8352b6a44b3103d9015",
    measurementId: "G-VGP2FG1RH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it so your React app can use it
export const db = getFirestore(app);