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
import './Dashboard.css'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [permission, setPermission] = useState(getNotificationPermission())
  const [schedules, setSchedules] = useState(getScheduledNotifications())
  const [time, setTime] = useState('09:00')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [repeatDaily, setRepeatDaily] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState(null)

  useNotificationScheduler()

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

  function handleAddSchedule(e) {
    e.preventDefault()
    const id = generateId()
    addScheduledNotification({ id, time, title: title || 'Reminder', body, repeatDaily })
    setTitle('')
    setBody('')
    refreshSchedules()
  }

  function handleRemoveSchedule(id) {
    removeScheduledNotification(id)
    refreshSchedules()
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
      setNotificationMessage('Notification sent! Check your taskbar or system tray (bottom-right on Windows). If you don’t see it: try minimizing this window, or check Focus Assist / Do Not Disturb.')
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
                <strong>If no notification appears:</strong> On Windows, open the action center (click the date/time). Turn off Focus Assist. In Chrome, lock icon → Site settings → Notifications → Allow. Try minimizing the browser and clicking “Send test now” again.
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

                  {schedules.length > 0 && (
                    <div className="notifications-list">
                      <h3>Scheduled</h3>
                      <ul>
                        {schedules.map((n) => (
                          <li key={n.id}>
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
                      </ul>
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
