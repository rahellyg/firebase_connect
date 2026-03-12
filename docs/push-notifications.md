# Push Notifications Code Guide

## Quick Answer: Where Is The Code?

Main files:
- `src/pages/Dashboard.jsx`
- `src/hooks/useNotificationScheduler.js`
- `src/utils/notifications.js`

## Important Clarification

This project currently uses **browser local notifications** (Web Notifications API), not Firebase Cloud Messaging (FCM) server push.

That means:
- Notifications are created by the browser on the client side.
- Schedules are stored in `localStorage`.
- The scheduler runs while the app/tab is active.

## File-by-File Breakdown

### 1) `src/pages/Dashboard.jsx`
This is the UI and interaction layer.

What it does:
- Shows notification permission state.
- Requests permission (`Enable notifications` button).
- Sends immediate test notification (`Send test now`).
- Adds time-based schedules (`Add scheduled notification`).
- Lists/removes scheduled items.

Key functions in this file:
- `handleEnableNotifications()`
- `handleTestNotification()`
- `handleTestInOneMinute()`
- `handleAddSchedule()`
- `handleRemoveSchedule()`

### 2) `src/hooks/useNotificationScheduler.js`
This is the polling scheduler.

What it does:
- Every 15 seconds (`CHECK_INTERVAL_MS = 15_000`), it:
1. Reads saved schedules.
2. Computes whether each schedule should trigger now.
3. Shows notification when due.
4. Removes one-time notifications after firing.
5. Keeps daily notifications.

Important behavior:
- It only starts if notification permission is `granted`.
- It runs in the browser context via `setInterval`.

### 3) `src/utils/notifications.js`
This is the utility layer.

What it does:
- Local storage persistence:
  - `getScheduledNotifications()`
  - `setScheduledNotifications(list)`
  - `addScheduledNotification(...)`
  - `removeScheduledNotification(id)`
- Time handling:
  - `getNextTriggerDate(time)` for `HH:mm`
  - `formatTime(date)`
- Notification API helpers:
  - `isNotificationSupported()`
  - `getNotificationPermission()`
  - `requestNotificationPermission()`
  - `showNotification(title, options)`

## End-to-End Flow

1. User opens Dashboard.
2. User grants permission.
3. User creates schedule with time/title/body/repeat flag.
4. Schedule is saved to `localStorage`.
5. Scheduler hook checks every 15s.
6. When due, notification is shown.
7. If one-time: removed. If daily: kept for next day.

## Data Shape Used In Storage

Stored under key: `firebase_connect_scheduled_notifications`

Each item:

```json
{
  "id": "string",
  "time": "HH:mm",
  "title": "Reminder",
  "body": "optional text",
  "repeatDaily": true
}
```

## Common Gotchas

- Browser/network console `400` from Firebase auth is unrelated to notification logic.
- Some browser extensions log async message-channel errors unrelated to app code.
- If permission is blocked, notifications cannot appear until allowed in browser site settings.
- On some OS/browser combinations, notifications are easier to see when the browser is not focused.

## If You Want Real Server Push Later

To support true push (background delivery even when app is not open), add Firebase Cloud Messaging (FCM):
- Firebase Messaging SDK
- Service worker messaging handler
- VAPID/web push setup
- Token registration and backend send flow
