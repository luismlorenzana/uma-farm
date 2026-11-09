// "Work done" notifications (copied from uma-rpg's apps/web/src/push at 30a322a, its D63; the farm's F6). iOS delivers Web
// Push only to the Home Screen app (16.4+); the server pushes from Cloud Scheduler's tick, so nothing runs on the phone
// until a notification arrives. The farm's server never reads the save (FM10): the app sends when each slot goes idle.
import { pushSchedule, type Save, type StoredSave } from '@farm/domain'
import { pushApi } from '../api/client'

export type PushState = 'loading' | 'unsupported' | 'install' | 'unavailable' | 'denied' | 'off' | 'on'

const standalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export async function pushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) && !standalone() ? 'install' : 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  // No service worker in development: push only works in a production build.
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'unavailable'
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off'
}

/** The server's VAPID public key, or null when push is off there. Fetch it before the tap: iOS wants the permission
 * prompt straight from the gesture. */
export async function pushKey(): Promise<string | null> {
  try {
    return (await pushApi.key()).publicKey
  } catch {
    return null
  }
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** Call from the tap itself: the owner allows notifications, then this phone subscribes. */
export async function enablePush(publicKey: string): Promise<void> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them for Uma Farm in Settings.')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }))
  try {
    await pushApi.subscribe(sub.toJSON())
  } catch {
    throw new Error('Couldn’t reach the server. Try again.')
  }
}

/** Off on this phone. The server forgets the device the next time a push finds it gone. */
export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  await (await reg?.pushManager.getSubscription())?.unsubscribe()
}

export async function testPush(): Promise<number> {
  try {
    return (await pushApi.test()).devices
  } catch {
    return 0
  }
}

/** Opening the app clears the badge a push set. */
export function clearBadgeOnOpen(): void {
  const clear = () => {
    if (document.visibilityState === 'visible') void (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(() => {})
  }
  clear()
  document.addEventListener('visibilitychange', clear)
}

// --- The schedule ---------------------------------------------------------------------------------------------------

let sentFor: Save | null = null

/** Sends when each slot goes idle (F4's notify rules), once per save: after every sync, and as the app goes to the
 * background, so a job started just before closing the app is announced. Every device sends it, subscribed or not: the
 * newest save is the one that knows what's running. A failure waits for the next sync. The loop's v3 sends nothing:
 * with days as turns there is nothing to announce (D25). */
export async function sendSchedule(save: StoredSave | null, now = Date.now()): Promise<void> {
  if (!save || save.version !== 2 || save === sentFor) return
  sentFor = save
  try {
    await pushApi.schedule(pushSchedule(save, now))
  } catch {
    if (sentFor === save) sentFor = null
  }
}

/** Forgets what was sent (tests, and a new sign-in). */
export function resetSchedule(): void {
  sentFor = null
}
