import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type QueryConstraint,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";

export { collection, doc, query, where, orderBy, onSnapshot, Timestamp };

/** Convert Firestore Timestamps to Dates recursively in a document snapshot. */
export function convertTimestamps<T extends DocumentData>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value instanceof Timestamp) {
      (result as Record<string, unknown>)[key] = value.toDate();
    }
  }
  return result;
}

/** Convert Dates to Firestore Timestamps for writing. */
export function convertDates<T extends DocumentData>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value instanceof Date) {
      (result as Record<string, unknown>)[key] = Timestamp.fromDate(value);
    }
  }
  return result;
}

export function getCollectionRef(path: string) {
  return collection(getDb(), path);
}

export function getDocRef(path: string, id: string) {
  return doc(getDb(), path, id);
}

export async function addDocument<T extends WithFieldValue<DocumentData>>(
  path: string,
  data: T,
) {
  return addDoc(collection(getDb(), path), convertDates(data as DocumentData) as T);
}

export async function updateDocument(
  path: string,
  id: string,
  data: Partial<DocumentData>,
) {
  return updateDoc(doc(getDb(), path, id), convertDates(data));
}

export async function deleteDocument(path: string, id: string) {
  return deleteDoc(doc(getDb(), path, id));
}

export async function getDocument(path: string, id: string) {
  const snap = await getDoc(doc(getDb(), path, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...convertTimestamps(snap.data()) };
}

export async function queryDocuments(
  path: string,
  ...constraints: QueryConstraint[]
) {
  const q = query(collection(getDb(), path), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) }));
}
