// The API client (copied from uma-rpg at 30a322a): same-origin `/api`, proxied by Vite in dev and rewritten to Cloud Run by
// Firebase Hosting in production, with the kit's ID token.
import type { PushEntry, Save, SaveEnvelope } from '@farm/domain'

let tokenProvider: () => Promise<string | null> = async () => null
export function setTokenProvider(fn: () => Promise<string | null>): void {
  tokenProvider = fn
}

export class ApiError extends Error {
  readonly path: string
  readonly status: number
  readonly body: unknown
  constructor(path: string, status: number, body: unknown) {
    super(`API ${status} on ${path}`)
    this.name = 'ApiError'
    this.path = path
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await tokenProvider()
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  })
  const text = await res.text()
  const body: unknown = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(path, res.status, body)
  return body as T
}

export const saveApi = {
  load: () => request<SaveEnvelope>('/api/save'),
  put: (baseRevision: number, save: Save) => request<SaveEnvelope>('/api/save', { method: 'PUT', body: JSON.stringify({ baseRevision, save }) }),
}

/** "Work done" notifications (F6). The schedule is a few dozen bytes, so it may outlive the page (`keepalive`): it's sent as
 * the app goes to the background too. */
export const pushApi = {
  key: () => request<{ publicKey: string }>('/api/push/key'),
  subscribe: (subscription: PushSubscriptionJSON) => request<null>('/api/push/subscription', { method: 'POST', body: JSON.stringify(subscription) }),
  schedule: (entries: readonly PushEntry[]) => request<null>('/api/push/schedule', { method: 'PUT', body: JSON.stringify({ entries }), keepalive: true }),
  test: () => request<{ devices: number }>('/api/push/test', { method: 'POST' }),
}

/** The stored envelope a 409 carries, or null when the error isn't a revision conflict. */
export function conflictEnvelope(error: unknown): SaveEnvelope | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null
  const current = (error.body as { current?: SaveEnvelope } | null)?.current
  return current && typeof current.revision === 'number' ? current : null
}
