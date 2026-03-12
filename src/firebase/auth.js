import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './config'

export async function register(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback)
}
