import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'scheduledPush'

/** Compute next trigger timestamp for time "HH:mm" (today or tomorrow) */
function nextTriggerAt(time) {
  const [h, m] = time.split(':').map(Number)
  const next = new Date()
  next.setHours(h, m, 0, 0)
  if (next <= new Date()) next.setDate(next.getDate() + 1)
  return Timestamp.fromDate(next)
}

/**
 * Add a scheduled push. Delivered by Cloud Function when app may be closed.
 * @param {{ userId: string, fcmToken: string, time: string, title: string, body: string, repeatDaily: boolean }}
 */
export async function addScheduledPush({ userId, fcmToken, time, title, body, repeatDaily }) {
  const at = nextTriggerAt(time)
  await addDoc(collection(db, COLLECTION), {
    userId,
    fcmToken,
    time,
    title: title || 'Reminder',
    body: body || '',
    repeatDaily: !!repeatDaily,
    nextTriggerAt: at,
    createdAt: Timestamp.now(),
  })
}

/**
 * Remove a scheduled push by doc id
 */
export async function removeScheduledPush(docId) {
  await deleteDoc(doc(db, COLLECTION, docId))
}

/**
 * List scheduled pushes for the current user (by fcmToken or userId)
 */
export async function listScheduledPush(userId) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    limit(100)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), nextTriggerAt: d.data().nextTriggerAt?.toDate?.() }))
  list.sort((a, b) => (a.nextTriggerAt?.getTime?.() ?? 0) - (b.nextTriggerAt?.getTime?.() ?? 0))
  return list
}

export { nextTriggerAt }
