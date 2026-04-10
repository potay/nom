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
import type {
  ShoppingItem,
  ShoppingItemSource,
  CreateShoppingItemInput,
} from "@/lib/schemas/shopping";
import type { Category } from "@/lib/schemas/item";

export function useShoppingList() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  const collectionPath = household
    ? `households/${household.id}/shoppingList`
    : null;

  const loading = collectionPath !== null && loadedPath !== collectionPath;

  useEffect(() => {
    if (!collectionPath) return;

    const q = query(
      collection(getDb(), collectionPath),
      orderBy("createdAt", "desc"),
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
          source: data.source,
          checked: data.checked ?? false,
          addedBy: data.addedBy,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        } as ShoppingItem;
      });
      setItems(docs);
      setLoadedPath(currentPath);
    });

    return unsubscribe;
  }, [collectionPath]);

  const { unchecked, checked } = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);
    return { unchecked, checked };
  }, [items]);

  const addItem = useCallback(
    async (input: CreateShoppingItemInput, source: ShoppingItemSource = "manual") => {
      if (!collectionPath || !user) throw new Error("Not ready");
      await addDoc(collection(getDb(), collectionPath), {
        ...input,
        source,
        checked: false,
        addedBy: user.uid,
        createdAt: Timestamp.now(),
      });
    },
    [collectionPath, user],
  );

  const toggleChecked = useCallback(
    async (id: string, checked: boolean) => {
      if (!collectionPath) throw new Error("Not ready");
      await updateDoc(doc(getDb(), collectionPath, id), { checked });
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

  const clearChecked = useCallback(async () => {
    if (!collectionPath) throw new Error("Not ready");
    await Promise.all(
      checked.map((item) =>
        deleteDoc(doc(getDb(), collectionPath, item.id)),
      ),
    );
  }, [collectionPath, checked]);

  const addExpiredToList = useCallback(
    async (name: string, category?: Category) => {
      await addItem(
        { name, category, quantity: 1, unit: "item" },
        "auto_expired",
      );
    },
    [addItem],
  );

  return {
    items,
    unchecked,
    checked,
    loading,
    addItem,
    toggleChecked,
    removeItem,
    clearChecked,
    addExpiredToList,
  };
}
