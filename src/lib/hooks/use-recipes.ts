"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";

/** Remove undefined values from an object (Firestore rejects them). */
function stripUndefined(obj: Record<string, unknown>): DocumentData {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}
import { getDb } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";
import { useHousehold } from "@/components/providers/household-provider";
import type { Recipe, CreateRecipeInput, RecipeSource } from "@/lib/schemas/recipe";

export function useRecipes() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  const collectionPath = household
    ? `households/${household.id}/recipes`
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
          ingredients: data.ingredients,
          instructions: data.instructions,
          source: data.source,
          sourceUrl: data.sourceUrl,
          prepTime: data.prepTime,
          servings: data.servings,
          addedBy: data.addedBy,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        } as Recipe;
      });
      setRecipes(docs);
      setLoadedPath(currentPath);
    });

    return unsubscribe;
  }, [collectionPath]);

  const addRecipe = useCallback(
    async (input: CreateRecipeInput, source: RecipeSource = "manual") => {
      if (!collectionPath || !user) throw new Error("Not ready");
      await addDoc(collection(getDb(), collectionPath), stripUndefined({
        ...input,
        source,
        addedBy: user.uid,
        createdAt: Timestamp.now(),
      }));
    },
    [collectionPath, user],
  );

  const importRecipes = useCallback(
    async (inputs: CreateRecipeInput[], source: RecipeSource = "umami") => {
      if (!collectionPath || !user) throw new Error("Not ready");
      const db = getDb();
      const batch = writeBatch(db);
      for (const input of inputs) {
        const ref = doc(collection(db, collectionPath));
        batch.set(ref, stripUndefined({
          ...input,
          source,
          addedBy: user.uid,
          createdAt: Timestamp.now(),
        }));
      }
      await batch.commit();
    },
    [collectionPath, user],
  );

  const removeRecipe = useCallback(
    async (id: string) => {
      if (!collectionPath) throw new Error("Not ready");
      await deleteDoc(doc(getDb(), collectionPath, id));
    },
    [collectionPath],
  );

  return { recipes, loading, addRecipe, importRecipes, removeRecipe };
}
