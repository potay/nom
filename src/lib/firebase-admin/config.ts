import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Running locally with a service account key file
    initializeApp();
  } else if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
    // Running on Cloud Run with Application Default Credentials
    initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID });
  } else {
    initializeApp();
  }
}

export const adminAuth = getAuth();
