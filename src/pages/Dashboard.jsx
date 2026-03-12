import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificationScheduler } from '../hooks/useNotificationScheduler'
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
  getScheduledNotifications,
  addScheduledNotification,
  removeScheduledNotification,
  showNotification,
  formatTime,
} from '../utils/notifications'
import { getFCMToken, hasVapidKey, onForegroundMessage } from '../firebase/messaging'
import { addScheduledPush, removeScheduledPush, listScheduledPush } from '../firebase/scheduledPush'
import './Dashboard.css'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [permission, setPermission] = useState(getNotificationPermission())
  const [schedules, setSchedules] = useState(getScheduledNotifications())
  const [pushSchedules, setPushSchedules] = useState([])
  const [pushLoading, setPushLoading] = useState(false)
  const [time, setTime] = useState('09:00')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [repeatDaily, setRepeatDaily] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState(null)
  const [toast, setToast] = useState(null)

  const usePush = hasVapidKey()
  useNotificationScheduler()

  useEffect(() => {
    if (!usePush || !user) return
    onForegroundMessage()
  }, [usePush, user])

  const loadPushSchedules = useCallback(async () => {
    if (!usePush || !user?.uid) return
    setPushLoading(true)
    try {
      const list = await listScheduledPush(user.uid)
      setPushSchedules(list)
    } catch (e) {
      console.warn('Load push schedules failed:', e)
    } finally {
      setPushLoading(false)
    }
  }, [usePush, user?.uid])

  useEffect(() => {
    loadPushSchedules()
  }, [loadPushSchedules])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const refreshSchedules = useCallback(() => setSchedules(getScheduledNotifications()), [])

  useEffect(() => {
    setSchedules(getScheduledNotifications())
  }, [])

  // Keep permission in sync (e.g. user allowed in another tab)
  useEffect(() => {
    const p = getNotificationPermission()
    setPermission(p)
  }, [])

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      showNotification('Notifications enabled', { body: 'You’ll get reminders at the times you set.' })
      setNotificationMessage('Enabled! Try “Send test now” below.')
    } else if (result === 'denied') {
      setNotificationMessage('Notifications were blocked. Allow them in your browser settings for this site, then refresh.')
    }
  }

  async function handleAddSchedule(e) {
    e.preventDefault()
    const id = generateId()
    addScheduledNotification({ id, time, title: title || 'Reminder', body, repeatDaily })
    setTitle('')
    setBody('')
    refreshSchedules()

    if (usePush && user?.uid && permission === 'granted') {
      try {
        const token = await getFCMToken()
        if (token) {
          await addScheduledPush({
            userId: user.uid,
            fcmToken: token,
            time,
            title: title || 'Reminder',
            body,
            repeatDaily,
          })
          await loadPushSchedules()
          setNotificationMessage('Scheduled. You’ll get a push even when the app is closed (after you deploy the Cloud Function).')
        } else {
          setNotificationMessage('Push when closed: run "npm run generate:sw", then reload. Deploy the Cloud Function to send at scheduled times.')
        }
      } catch (err) {
        setNotificationMessage('Could not save for push when closed: ' + (err?.message || err))
      }
    }
  }

  function handleRemoveSchedule(id) {
    removeScheduledNotification(id)
    refreshSchedules()
  }

  async function handleRemovePushSchedule(docId) {
    try {
      await removeScheduledPush(docId)
      await loadPushSchedules()
    } catch (e) {
      setNotificationMessage('Failed to remove: ' + (e?.message || e))
    }
  }

  async function handleTestNotification() {
    setNotificationMessage(null)
    let p = getNotificationPermission()
    if (p !== 'granted') {
      p = await requestNotificationPermission()
      setPermission(p)
    }
    if (p !== 'granted') {
      setNotificationMessage(p === 'denied' ? 'Notifications are blocked. Allow them in your browser (e.g. lock icon → Site settings → Notifications).' : 'Please allow notifications when the browser asks.')
      return
    }
    const result = showNotification('Test notification', { body: 'If you see this, notifications work.' })
    if (result.ok) {
      setNotificationMessage('Notification sent!')
      setToast(true)
    } else {
      setNotificationMessage(`Failed: ${result.error}. Try enabling notifications above or check browser settings.`)
    }
  }

  function handleTestInOneMinute() {
    const inOneMin = new Date(Date.now() + 60 * 1000)
    const time = formatTime(inOneMin)
    const id = generateId()
    addScheduledNotification({
      id,
      time,
      title: 'Test in 1 minute',
      body: 'This was scheduled to fire about 1 minute after you clicked.',
      repeatDaily: false,
    })
    refreshSchedules()
    showNotification('Scheduled', { body: `You’ll get a notification at ${time} (in ~1 min).` })
    setNotificationMessage(`Scheduled for ${time}. Keep this tab open for ~1 min to receive it.`)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const supported = isNotificationSupported()

  return (
    <div className="dashboard">
      {toast && (
        <div className="notifications-toast" role="status">
          <strong>Notification was sent</strong>
          <p>If you don’t see a popup:</p>
          <ol>
            <li>Minimize this browser window, then click “Send test now” again.</li>
            <li>Look at the <strong>bottom-right</strong> of your screen (Windows) or the <strong>top-right</strong> (Mac).</li>
            <li>Or click the <strong>date/time</strong> in the taskbar to open the action center.</li>
            <li>Turn off <strong>Focus Assist</strong> (Windows) or <strong>Do Not Disturb</strong>.</li>
          </ol>
          <button type="button" className="notifications-toast-dismiss" onClick={() => setToast(null)}>Dismiss</button>
        </div>
      )}
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-user">
          <span className="dashboard-email">{user?.email}</span>
          <button type="button" className="dashboard-logout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>You’re signed in</h2>
          <p>
            Your account is stored in Firebase Authentication. Manage users in the{' '}
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
              Firebase Console
            </a>{' '}
            under Authentication → Users.
          </p>
        </div>

        <div className="dashboard-card notifications-card">
          <h2>Push notifications</h2>
          <p className="notifications-desc">
            Schedule reminders by time. Works on desktop and when installed as PWA on your phone.
          </p>

          {!supported && (
            <p className="notifications-unsupported">Notifications are not supported in this browser.</p>
          )}

          {supported && (
            <>
              {permission !== 'granted' && (
                <div className="notifications-enable">
                  <button type="button" className="dashboard-btn dashboard-btn-primary" onClick={handleEnableNotifications}>
                    Enable notifications
                  </button>
                  {permission === 'denied' && (
                    <p className="notifications-hint">You previously blocked notifications. Allow them in your browser settings for this site.</p>
                  )}
                </div>
              )}
              <div className="notifications-test-buttons">
                <button type="button" className="dashboard-btn dashboard-btn-secondary" onClick={handleTestNotification}>
                  Send test now
                </button>
                <button type="button" className="dashboard-btn dashboard-btn-secondary" onClick={handleTestInOneMinute}>
                  Notify me in 1 minute
                </button>
              </div>
              {notificationMessage && (
                <p className={`notifications-feedback ${notificationMessage.startsWith('Notification sent') || notificationMessage.startsWith('Enabled') ? 'notifications-feedback-success' : ''}`}>
                  {notificationMessage}
                </p>
              )}
              <p className="notifications-test-hint">
                “Send test now” asks for permission if needed, then shows a notification. Check your taskbar or system tray. “Notify me in 1 minute” tests the scheduler (keep this tab open).
              </p>
              <div className="notifications-troubleshoot">
                <strong>Why you might not see the system notification:</strong>
                <ul>
                  <li>Browser is in focus — <strong>minimize the window</strong> and click “Send test now” again.</li>
                  <li>Focus Assist / Do Not Disturb is on — turn it off in Windows settings or the action center.</li>
                  <li>Site not allowed — Chrome: lock icon → Site settings → Notifications → Allow.</li>
                  <li>Look in the action center (click date/time in taskbar) — notifications sometimes appear there without a popup.</li>
                </ul>
              </div>

              {permission === 'granted' && (
                <>
                  <form onSubmit={handleAddSchedule} className="notifications-form">
                    <h3>Schedule by time</h3>
                    <div className="notifications-form-row">
                      <label>
                        Time
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="dashboard-input"
                          required
                        />
                      </label>
                      <label className="notifications-checkbox">
                        <input type="checkbox" checked={repeatDaily} onChange={(e) => setRepeatDaily(e.target.checked)} />
                        Repeat daily
                      </label>
                    </div>
                    <label>
                      Title
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="dashboard-input"
                        placeholder="Reminder"
                      />
                    </label>
                    <label>
                      Message (optional)
                      <input
                        type="text"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="dashboard-input"
                        placeholder="Optional message"
                      />
                    </label>
                    <button type="submit" className="dashboard-btn dashboard-btn-primary">
                      Add scheduled notification
                    </button>
                  </form>

                  {(schedules.length > 0 || pushSchedules.length > 0) && (
                    <div className="notifications-list">
                      <h3>Scheduled</h3>
                      {pushLoading && <p className="notifications-loading">Loading…</p>}
                      <ul>
                        {schedules.map((n) => (
                          <li key={'local-' + n.id}>
                            <span className="notifications-list-time">{n.time}</span>
                            <span className="notifications-list-title">{n.title}</span>
                            {n.repeatDaily && <span className="notifications-list-badge">daily</span>}
                            <button
                              type="button"
                              className="notifications-list-remove"
                              onClick={() => handleRemoveSchedule(n.id)}
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                        {pushSchedules.map((n) => (
                          <li key={'push-' + n.id}>
                            <span className="notifications-list-time">{n.time}</span>
                            <span className="notifications-list-title">{n.title}</span>
                            {n.repeatDaily && <span className="notifications-list-badge">daily</span>}
                            <span className="notifications-list-badge">push</span>
                            <button
                              type="button"
                              className="notifications-list-remove"
                              onClick={() => handleRemovePushSchedule(n.id)}
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                      {usePush && (
                        <p className="notifications-test-hint" style={{ marginTop: '0.5rem' }}>
                          Items with “push” are sent even when the app is closed (deploy the Cloud Function first).
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
