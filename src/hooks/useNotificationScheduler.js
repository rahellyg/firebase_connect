import { useEffect, useRef } from 'react'
import {
  getScheduledNotifications,
  getNextTriggerDate,
  showNotification,
  removeScheduledNotification,
  setScheduledNotifications,
} from '../utils/notifications'

const CHECK_INTERVAL_MS = 15_000 // every 15 seconds

export function useNotificationScheduler() {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || Notification?.permission !== 'granted') return

    function check() {
      const now = Date.now()
      const list = getScheduledNotifications()
      let changed = false
      const remaining = list.filter((n) => {
        const next = getNextTriggerDate(n.time)
        if (next.getTime() <= now) {
          showNotification(n.title, { body: n.body })
          if (n.repeatDaily) {
            // keep it, next trigger is tomorrow
            return true
          }
          changed = true
          return false
        }
        return true
      })
      if (changed) setScheduledNotifications(remaining)
    }

    check()
    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
}
