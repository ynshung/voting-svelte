// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDS7c766Yu8xy-wCtal9t0lk4lvBWrw3ao",
  authDomain: "agm2023-usm.firebaseapp.com",
  databaseURL: "https://agm2023-usm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agm2023-usm",
  storageBucket: "agm2023-usm.appspot.com",
  messagingSenderId: "408321776852",
  appId: "1:408321776852:web:f11f57dc77b18258fdef41"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "asia-northeast1");
export const storage = getStorage(app);

