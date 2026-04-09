"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";
import type { Household } from "@/lib/schemas/household";
import { INVITE_CODE_LENGTH } from "@/lib/constants";

type HouseholdContextValue = {
  household: Household | null;
  loading: boolean;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextValue>({
  household: null,
  loading: true,
  createHousehold: async () => {},
  joinHousehold: async () => {},
});

export function useHousehold() {
  return useContext(HouseholdContext);
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // Loading when we have a user but haven't received their doc yet.
  const loading = user !== null && loadedUserId !== user?.uid;

  // Watch user doc for householdId changes
  useEffect(() => {
    if (!user) return;

    const currentUid = user.uid;
    const unsubscribe = onSnapshot(
      doc(getDb(), "users", user.uid),
      (snap) => {
        const data = snap.data();
        console.log("[household] user doc:", data ? "exists" : "missing");
        const newHouseholdId = data?.householdId ?? null;
        setHouseholdId(newHouseholdId);
        if (!newHouseholdId) {
          setHousehold(null);
        }
        setLoadedUserId(currentUid);
      },
      (err) => {
        console.error("[household] user doc subscription error:", err);
        // Still mark as loaded so the UI isn't stuck.
        setLoadedUserId(currentUid);
      },
    );
    return unsubscribe;
  }, [user]);

  // Watch household doc when householdId is set
  useEffect(() => {
    if (!householdId) return;

    const unsubscribe = onSnapshot(doc(getDb(), "households", householdId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHousehold({
          id: snap.id,
          name: data.name,
          members: data.members,
          memberNames: data.memberNames,
          inviteCode: data.inviteCode,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        });
      } else {
        setHousehold(null);
      }
    });
    return unsubscribe;
  }, [householdId]);

  const createHousehold = useCallback(
    async (name: string) => {
      if (!user) throw new Error("Must be logged in");

      const householdRef = doc(collection(getDb(), "households"));
      const inviteCode = generateInviteCode();

      await setDoc(householdRef, {
        name,
        members: [user.uid],
        memberNames: { [user.uid]: user.displayName || "User" },
        inviteCode,
        createdAt: Timestamp.now(),
      });

      await updateDoc(doc(getDb(), "users", user.uid), {
        householdId: householdRef.id,
      });
    },
    [user],
  );

  const joinHousehold = useCallback(
    async (inviteCode: string) => {
      if (!user) throw new Error("Must be logged in");

      const q = query(
        collection(getDb(), "households"),
        where("inviteCode", "==", inviteCode.toUpperCase()),
      );
      const snap = await getDocs(q);

      if (snap.empty) throw new Error("Invalid invite code");

      const householdDoc = snap.docs[0];

      // Check if already a member
      const currentData = householdDoc.data();
      if (currentData.members.includes(user.uid)) {
        throw new Error("You are already a member of this household");
      }

      await updateDoc(doc(getDb(), "households", householdDoc.id), {
        members: arrayUnion(user.uid),
        [`memberNames.${user.uid}`]: user.displayName || "User",
      });

      await updateDoc(doc(getDb(), "users", user.uid), {
        householdId: householdDoc.id,
      });
    },
    [user],
  );

  return (
    <HouseholdContext.Provider
      value={{ household, loading, createHousehold, joinHousehold }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}
