import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/config";

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;

/** Resize a base64 image to max 800px on longest side and compress to JPEG. */
function compressImage(base64: string, mimeType: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

export async function uploadScanImage(
  householdId: string,
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  const storage = getFirebaseStorage();
  const path = `households/${householdId}/scans/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  let bytes: Uint8Array;
  if (typeof document !== "undefined") {
    // Client-side: compress with canvas
    bytes = await compressImage(imageBase64, mimeType);
  } else {
    // Server-side fallback: upload as-is
    const binary = atob(imageBase64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  }

  await uploadBytes(storageRef, bytes, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}
