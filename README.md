# Firebase Connect – Login & Registration

Login and registration screens that save all registered users in **Firebase Authentication**. Every user who signs up is stored in your Firebase project automatically.

## Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com).

2. **Enable Email/Password sign-in**:  
   Authentication → Sign-in method → Email/Password → Enable → Save.

3. **Get your config**:  
   Project settings (gear) → General → Your apps → Add web app (or use existing). Copy the `firebaseConfig` values.

4. **Configure environment**:  
   Copy `.env.example` to `.env` and set Firebase variables.

   Supported names:
   - `VITE_FIREBASE_*` (standard Vite)
   - `FIREBASE_*` (useful when reusing CI/repo secrets from other projects)

   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc...
   ```

   Or equivalent `FIREBASE_` names:

   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=1:123:web:abc...
   ```

5. **Install and run**:

   ```bash
   npm install
   npm run dev
   ```

Open the URL shown (e.g. http://localhost:5173). Use **Register** to create an account; the user is saved in Firebase. You can see all users under **Authentication → Users** in the Firebase Console.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
