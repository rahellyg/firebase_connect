import { getToken, getMessaging, isSupported, onMessage } from 'firebase/messaging'
import app from './config'
import { showNotification } from '../utils/notifications'

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
let messagingInstance = null

export function hasVapidKey() {
  return !!vapidKey && vapidKey !== 'undefined' && !vapidKey.startsWith('your-')
}

/**
 * Get FCM token for push when app is closed. Requires firebase-messaging-sw.js at /firebase-messaging-sw.js
 * and Notification.permission === 'granted'.
 * @returns {Promise<string|null>} token or null
 */
export async function getFCMToken() {
  if (typeof window === 'undefined' || !hasVapidKey()) return null
  if (Notification?.permission !== 'granted') return null
  try {
    const supported = await isSupported()
    if (!supported) return null
    if (!messagingInstance) messagingInstance = getMessaging(app)
    const token = await getToken(messagingInstance, { vapidKey })
    return token
  } catch (e) {
    console.warn('FCM getToken failed:', e)
    return null
  }
}

/**
 * Subscribe to foreground messages; shows a notification when app is open.
 * Call once when app loads and permission is granted.
 */
export function onForegroundMessage(callback) {
  if (!hasVapidKey()) return () => {}
  if (!messagingInstance) messagingInstance = getMessaging(app)
  return onMessage(messagingInstance, (payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Reminder'
    const body = payload.notification?.body || payload.data?.body || ''
    showNotification(title, { body })
    callback?.(payload)
  })
}
