import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCfO6cZCnZRF6fIwW1gBQi-w7gtSx3x_PM",
  authDomain: "falatriangulo-45122.firebaseapp.com",
  databaseURL: "https://falatriangulo-45122-default-rtdb.firebaseio.com",
  projectId: "falatriangulo-45122",
  storageBucket: "falatriangulo-45122.appspot.com",
  messagingSenderId: "1098827961707",
  appId: "1:1098827961707:web:c2f4c1c0f0e4d2e0c4c4c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app; 