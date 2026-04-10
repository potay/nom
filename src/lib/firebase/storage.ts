import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/config";

export async function uploadScanImage(
  householdId: string,
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  const storage = getFirebaseStorage();
  const ext = mimeType === "image/png" ? "png" : "jpg";
  const path = `households/${householdId}/scans/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  // Convert base64 to Uint8Array
  const binary = atob(imageBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  await uploadBytes(storageRef, bytes, { contentType: mimeType });
  return getDownloadURL(storageRef);
}
