import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { resolveSessionState } from "./src/lib/sessionUtils";
import { getLocalDate } from "./src/lib/utils";
import dotenv from "dotenv";

dotenv.config();

console.log("Imports work!");
