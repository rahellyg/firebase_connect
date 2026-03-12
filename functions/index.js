import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { initializeApp } from 'firebase-admin/app'

initializeApp()
const db = getFirestore()
const messaging = getMessaging()

/**
 * Runs every minute. Finds scheduledPush docs where nextTriggerAt <= now,
 * sends FCM to each, then updates nextTriggerAt (tomorrow if repeatDaily) or deletes.
 */
export const sendScheduledPush = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'UTC' },
  async () => {
    const now = Timestamp.fromDate(new Date())
    const snapshot = await db.collection('scheduledPush')
      .where('nextTriggerAt', '<=', now)
      .limit(100)
      .get()

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const { fcmToken, title, body, repeatDaily, time, userId } = data

      try {
        await messaging.send({
          token: fcmToken,
          notification: { title: title || 'Reminder', body: body || '' },
          data: { title: title || 'Reminder', body: body || '' },
          webpush: {
            fcmOptions: { link: '/' },
          },
        })
      } catch (e) {
        console.warn('FCM send failed for', docSnap.id, e.message)
        await docSnap.ref.delete()
        continue
      }

      if (repeatDaily) {
        const nextTrigger = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000)
        await docSnap.ref.update({ nextTriggerAt: nextTrigger })
      } else {
        await docSnap.ref.delete()
      }
    }
  }
)
