import { getApp, getApps, initializeApp } from "firebase/app";
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getFunctions