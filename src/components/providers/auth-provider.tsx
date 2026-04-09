"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "@/lib/firebase/config";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Ensure a user profile document exists in Firestore. */
async function ensureUserProfile(user: User) {
  const userRef = doc(getDb(), "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      householdId: null,
      fcmTokens: [],
      notificationPrefs: {
        dailyDigest: true,
        digestTime: "09:00",
        expirationWarningDays: 3,
      },
      createdAt: Timestamp.now(),
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      console.log("[auth] state changed:", firebaseUser?.email ?? "signed out");
      // Set user immediately so the app isn't blocked by Firestore writes.
      setUser(firebaseUser);
      setLoading(false);

      // Create user profile in background - don't block auth flow.
      if (firebaseUser) {
        ensureUserProfile(firebaseUser).catch((err) => {
          console.error("[auth] Failed to ensure user profile:", err);
        });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
