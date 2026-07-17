import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";

import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

t