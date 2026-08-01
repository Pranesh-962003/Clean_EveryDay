import admin from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { readFileSync, existsSync } from "node:fs";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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

if (getApps().length === 0 && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default admin;