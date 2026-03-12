// Generated - do not edit. Run: node scripts/generate-messaging-sw.cjs
// Receives push when app is closed. Config from .env
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({"apiKey":"","authDomain":"","projectId":"","storageBucket":"","messagingSenderId":"","appId":""});
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
