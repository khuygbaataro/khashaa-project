// Firebase Admin SDK initialization. Picks credentials in this order:
//   1. FIREBASE_SERVICE_ACCOUNT (base64-encoded JSON) — for Render / containers without ADC
//   2. GOOGLE_APPLICATION_CREDENTIALS (file path) — local dev
//   3. Application Default Credentials — Cloud Run / GCP environments
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function loadCredentials(): Parameters<typeof initializeApp>[0] | undefined {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (b64) {
    try {
      const json = Buffer.from(b64, "base64").toString("utf8");
      const sa = JSON.parse(json);
      return { credential: cert(sa) };
    } catch (err) {
      console.error("[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT decode failed", err);
    }
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS or ADC
  return undefined;
}

if (!getApps().length) {
  initializeApp(loadCredentials());
}

export const db = getFirestore();
