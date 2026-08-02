import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase SDK'ları yalnızca tarayıcıda başlatılır. Bu modül, App Router'ın
// istemci bileşenlerini de sunucu tarafında bir kez render ettiği build/SSR
// aşamasında import edilir; gerçek env değişkenleri olmadan (ör. CI build'i)
// getAuth() çağrısı senkron olarak "invalid-api-key" fırlatır. Bu yüzden
// gerçek SDK nesneleri yalnızca `window` mevcutken oluşturulur.
const isBrowser = typeof window !== "undefined";

export const firebaseApp: FirebaseApp | undefined = isBrowser
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : undefined;

export const auth = (isBrowser ? getAuth(firebaseApp!) : undefined) as Auth;
export const db = (isBrowser ? getFirestore(firebaseApp!) : undefined) as Firestore;
export const storage = (isBrowser ? getStorage(firebaseApp!) : undefined) as FirebaseStorage;
export const googleProvider = new GoogleAuthProvider();
