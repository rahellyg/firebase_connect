# Firebase Connect – Login & Registration

Login and registration screens that save all registered users in **Firebase Authentication**. Every user who signs up is stored in your Firebase project automatically.

## Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com).

2. **Enable Email/Password sign-in**:  
   Authentication → Sign-in method → Email/Password → Enable → Save.

3. **Get your config**:  
   Project settings (gear) → General → Your apps → Add web app (or use existing). Copy the `firebaseConfig` values.

4. **Configure environment**:  
   Copy `.env.example` to `.env` and set the variables:

   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc...
   ```

5. **Install and run**:

   ```bash
   npm install
   npm run dev
   ```

Open the URL shown (e.g. http://localhost:5173). Use **Register** to create an account; the user is saved in Firebase. You can see all users under **Authentication → Users** in the Firebase Console.

## Push notifications when app is closed

To get scheduled notifications even when the app/tab is closed:

1. **Create a Firestore database** in Firebase Console (Build → Firestore Database → Create database). Choose a mode and location.

2. **Get a VAPID key**: Firebase Console → Project settings → **Cloud Messaging** → **Web Push certificates** → **Generate key pair**. Copy the key pair (the long string) and add to `.env`:
   ```
   VITE_FIREBASE_VAPID_KEY=your-vapid-public-key
   ```

3. **Generate the messaging service worker** (uses your `.env` config):
   ```bash
   npm run generate:sw
   ```
   Or run `npm run build` (it runs this step automatically).

4. **Deploy Firestore rules** (so the app can read/write `scheduledPush`):
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
   (Install Firebase CLI first: `npm install -g firebase-tools`, then `firebase login` and `firebase use <project-id>`.)

5. **Deploy the Cloud Function** (sends push at scheduled times):
   ```bash
   cd functions
   npm install
   cd ..
   npx firebase-tools deploy --only functions
   ```

After that, when you add a scheduled notification in the app it is stored in Firestore and the Cloud Function sends the push at the right time even if the app is closed.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build (generates `firebase-messaging-sw.js` from `.env`)
- `npm run preview` – preview production build
- `npm run generate:sw` – generate `public/firebase-messaging-sw.js` for FCM (run after changing `.env`)
