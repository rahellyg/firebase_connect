import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value === 'undefined' || String(value).startsWith('your-'))
  .map(([key]) => key)

if (missing.length > 0) {
  throw new Error(
    `Missing Firebase config keys: ${missing.join(', ')}. For local development, copy .env.example to .env and set values. GitHub repo secrets are available in GitHub Actions builds only.`
  )
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
