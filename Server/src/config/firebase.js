import admin from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { readFileSync, existsSync } from "node:fs";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err);
  }
}

if (!serviceAccount) {
  try {
    const jsonUrl = new URL("../clean-every-day-firebase-adminsdk-fbsvc-2d895691c1.json", import.meta.url);
    if (existsSync(jsonUrl)) {
      serviceAccount = JSON.parse(readFileSync(jsonUrl, "utf-8"));
    }
  } catch (e) {
    console.warn("Local Firebase service account JSON file not found.");
  }
}

if (serviceAccount && typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

if (getApps().length === 0 && serviceAccount) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (initErr) {
    console.error("Firebase Admin initialization error:", initErr);
  }
}

export default admin;