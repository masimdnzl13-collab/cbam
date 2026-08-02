"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS, type Organization, type UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  organization: Organization | null;
  loading: boolean;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  organization: null,
  loading: true,
  refreshOrganization: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOrganization = useCallback(async () => {
    if (!profile?.organizationId) return;
    const orgSnap = await getDoc(doc(db, COLLECTIONS.organizations, profile.organizationId));
    if (orgSnap.exists()) {
      setOrganization({ id: orgSnap.id, ...(orgSnap.data() as Omit<Organization, "id">) });
    }
  }, [profile?.organizationId]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setOrganization(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubProfile = onSnapshot(doc(db, COLLECTIONS.users, user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubProfile();
  }, [user]);

  useEffect(() => {
    if (!profile?.organizationId) {
      if (profile === null && user) setLoading(false);
      return;
    }
    const unsubOrg = onSnapshot(
      doc(db, COLLECTIONS.organizations, profile.organizationId),
      (snap) => {
        if (snap.exists()) {
          setOrganization({ id: snap.id, ...(snap.data() as Omit<Organization, "id">) });
        }
        setLoading(false);
      }
    );
    return () => unsubOrg();
  }, [profile, user]);

  return (
    <AuthContext.Provider value={{ user, profile, organization, loading, refreshOrganization }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
