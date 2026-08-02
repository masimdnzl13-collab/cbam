import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/types";

async function ensureUserProfile(cred: UserCredential) {
  const ref = doc(db, COLLECTIONS.users, cred.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      organizationId: "",
      email: cred.user.email ?? "",
      displayName: cred.user.displayName ?? "",
      role: "owner",
      createdAt: serverTimestamp(),
    });
  }
  return snap.exists();
}

export async function registerWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred);
  return cred;
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(cred);
  return cred;
}
