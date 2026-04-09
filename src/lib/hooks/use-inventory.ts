"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";
import { useHousehold } from "@/components/providers/household-provider";
import type { Item, CreateItemInput } from "@/lib/schemas/item";
import {
  getExpirationStatus,
  type ExpirationStatus,
} from "@/lib/utils/expiration";

export type ItemWithStatus = Item & {
  expirationStatus: ExpirationStatus;
};

export function useInventory() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [items, setItems] = useState<Item[]>([]);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  const collectionPath = household
    ? `households/${household.id}/items`
    : null;

  // Loading is true when we have a path but haven't received data for it yet.
  const loading = collectionPath !== null && loadedPath !== collectionPath;

  useEffect(() => {
    if (!collectionPath) return;

    const q = query(
      collection(getDb(), collectionPath),
      orderBy("expirationDate", "asc"),
    );

    const currentPath = collectionPath;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          expirationDate:
            data.expirationDate instanceof Timestamp
              ? data.expirationDate.toDate()
              : new Date(data.expirationDate),
          notes: data.notes,
          addedBy: data.addedBy,
          addedByName: data.addedByName,
          imageUrl: data.imageUrl ?? null,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : new Date(data.updatedAt),
        } as Item;
      });
      setItems(docs);
      setLoadedPath(currentPath);
    });

    return unsubscribe;
  }, [collectionPath]);

  const itemsWithStatus: ItemWithStatus[] = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        expirationStatus: getExpirationStatus(item.expirationDate),
      })),
    [items],
  );

  const addItem = useCallback(
    async (input: CreateItemInput) => {
      if (!collectionPath || !user) throw new Error("Not ready");
      const now = Timestamp.now();
      await addDoc(collection(getDb(), collectionPath), {
        ...input,
        expirationDate: Timestamp.fromDate(input.expirationDate),
        addedBy: user.uid,
        addedByName: user.displayName || "User",
        imageUrl: null,
        createdAt: now,
        updatedAt: now,
      });
    },
    [collectionPath, user],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<CreateItemInput>) => {
      if (!collectionPath) throw new Error("Not ready");
      const data: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      if (updates.expirationDate) {
        data.expirationDate = Timestamp.fromDate(updates.expirationDate);
      }
      await updateDoc(doc(getDb(), collectionPath, id), data);
    },
    [collectionPath],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!collectionPath) throw new Error("Not ready");
      await deleteDoc(doc(getDb(), collectionPath, id));
    },
    [collectionPath],
  );

  const addItems = useCallback(
    async (inputs: CreateItemInput[]) => {
      await Promise.all(inputs.map((input) => addItem(input)));
    },
    [addItem],
  );

  return {
    items: itemsWithStatus,
    loading,
    addItem,
    addItems,
    updateItem,
    removeItem,
  };
}
