const STORAGE_KEY = 'firebase_connect_scheduled_notifications'

export function getScheduledNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setScheduledNotifications(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function addScheduledNotification({ id, time, title, body, repeatDaily }) {
  const list = getScheduledNotifications()
  list.push({ id, time, title: title || 'Reminder', body: body || '', repeatDaily: !!repeatDaily })
  setScheduledNotifications(list)
  return list
}

export function removeScheduledNotification(id) {
  const list = getScheduledNotifications().filter((n) => n.id !== id)
  setScheduledNotifications(list)
  return list
}

/** time: "HH:mm" (24h), returns next Date for that time today or tomorrow */
export function getNextTriggerDate(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)
  if (next <= new Date()) next.setDate(next.getDate() + 1)
  return next
}

/** Return "HH:mm" for a date (e.g. for scheduling 1 min from now) */
export function formatTime(date) {
  const h = date.getHours()
  const m = date.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission() {
  return isNotificationSupported() ? Notification.permission : 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Show a local notification (main thread).
 * @returns {{ ok: boolean, error?: string }}
 */
export function showNotification(title, options = {}) {
  if (!isNotificationSupported()) return { ok: false, error: 'Notifications not supported' }
  if (Notification.permission !== 'granted') return { ok: false, error: 'Permission not granted' }
  try {
    const { body: b, ...rest } = options
    const opts = { body: b ?? '', tag: 'firebase-connect', ...rest }
    new Notification(title, opts)
    return { ok: true }
  } catch (e) {
    const msg = e?.message || String(e)
    console.warn('Notification failed:', e)
    return { ok: false, error: msg }
  }
}
