/**
 * Generates public/firebase-messaging-sw.js from .env so FCM works when app is closed.
 * Run: node scripts/generate-messaging-sw.cjs
 * (or add to package.json "prebuild": "node scripts/generate-messaging-sw.cjs")
 */
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env')
const outPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js')

let env = {}
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
}

const swContent = `// Generated - do not edit. Run: node scripts/generate-messaging-sw.cjs
// Receives push when app is closed. Config from .env
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Reminder';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icon-192.png',
    tag: 'firebase-connect-push'
  };
  return self.registration.showNotification(title, options);
});
`

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, swContent)
console.log('Wrote public/firebase-messaging-sw.js')
