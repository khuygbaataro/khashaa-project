// Auth helpers: signup creates the matching /agents/{uid} doc, signin/signout wrap Firebase, and onAuthChange streams the merged Agent record.
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Agent } from "./schema";
import { initialsOf } from "./utils";

const AGENTS = "agents";

async function fetchAgent(uid: string): Promise<Agent | null> {
  const snap = await getDoc(doc(db, AGENTS, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    bio: String(data.bio ?? ""),
    avatar: String(data.avatar ?? initialsOf(data.name ?? "")),
    phone: data.phone ? String(data.phone) : undefined,
    joinedAt: (data.joinedAt as Agent["joinedAt"]) ?? 0,
  };
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<Agent> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  const agent = {
    name: name.trim(),
    email: email.trim(),
    bio: "",
    avatar: initialsOf(name),
    joinedAt: serverTimestamp(),
  };
  await setDoc(doc(db, AGENTS, user.uid), agent);
  return {
    id: user.uid,
    name: agent.name,
    email: agent.email,
    bio: "",
    avatar: agent.avatar,
    joinedAt: Date.now(),
  };
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function updateAgent(
  uid: string,
  patch: Partial<Pick<Agent, "name" | "bio" | "phone" | "avatar">>
): Promise<void> {
  await updateDoc(doc(db, AGENTS, uid), patch);
}

// Streams the merged (User + agent doc) record. callback receives null when signed out.
// Robust against Firestore failures (e.g. rules not yet deployed) — falls back to a
// minimal in-memory Agent so the UI can still render and the user can sign out.
export function onAuthChange(
  callback: (agent: Agent | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    const minimal: Agent = {
      id: user.uid,
      name: user.displayName ?? user.email ?? "Agent",
      email: user.email ?? "",
      bio: "",
      avatar: initialsOf(user.displayName ?? user.email ?? "??"),
      joinedAt: Date.now(),
    };
    try {
      let agent = await fetchAgent(user.uid);
      if (!agent) {
        // Edge case: auth user exists but doc was never created. Backfill.
        const fallback = {
          name: minimal.name,
          email: minimal.email,
          bio: "",
          avatar: minimal.avatar,
          joinedAt: serverTimestamp(),
        };
        try {
          await setDoc(doc(db, AGENTS, user.uid), fallback);
        } catch (err) {
          console.warn(
            "[auth] could not create /agents doc — Firestore rules may not be deployed yet",
            err
          );
        }
        agent = minimal;
      }
      callback(agent);
    } catch (err) {
      console.warn(
        "[auth] could not load /agents doc — Firestore rules may not be deployed yet",
        err
      );
      callback(minimal);
    }
  });
}
