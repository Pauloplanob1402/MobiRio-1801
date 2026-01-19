// Fixed the initialization error by removing redundant lines and ensuring the modular import is correctly placed at the top of the file.
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

/*
  👉 COLE SUAS CHAVES DO FIREBASE AQUI 👇
*/
const firebaseConfig = {
  apiKey: "AIzaSyBbIE3ovdauw0I_HvB6N9eHrVTFde2VRmE",
  authDomain: "mobirio-220fc.firebaseapp.com",
  projectId: "mobirio-220fc",
  storageBucket: "mobirio-220fc.firebasestorage.app",
  messagingSenderId: "466354930101",
  appId: "1:466354930101:web:6b792aae0bdc6d85a319fc",
};

/*
  👉 COLE SUA VAPID KEY AQUI 👇
*/
const FIREBASE_VAPID_KEY = "BBrwYBbequkzDKhqG6U5-HjpUbtP0bVHs0ttqNPw5QdUAaPWEIk3s7Dn0poCt0P3IM0h8L1YWbiYweVh7VVSp2c";

export const firebaseApp = initializeApp(firebaseConfig);
export const messaging =
  typeof window !== "undefined" ? getMessaging(firebaseApp) : null;