import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'; // 1. Added new auth imports
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // 2. Import Async Storage

const firebaseConfig = {
  apiKey: "AIzaSyDGfURh85wfJelLiBlzGjNdpvFD_V3V5Vg",
  authDomain: "handwritten-ai-system.firebaseapp.com",
  databaseURL: "https://handwritten-ai-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "handwritten-ai-system",
  storageBucket: "handwritten-ai-system.firebasestorage.app",
  messagingSenderId: "9183885350",
  appId: "1:9183885350:web:e01085963bf0d5d7084ee7"
};

const app = initializeApp(firebaseConfig);

// 3. Initialize Auth with Persistence (Fixes the warning)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  // If auth is already initialized (hot reload), use existing instance
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);