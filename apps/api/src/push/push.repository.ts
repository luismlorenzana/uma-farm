import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, type CollectionReference, type DocumentData } from 'firebase-admin/firestore'
import type { PushEntry } from '@farm/domain'

// Copied from uma-rpg's apps/api/src/push at 30a322a and cut: the farm's server never reads a save, so the
// record also keeps the schedule the app sends, and each write sets only its own fields.

/** A browser's push subscription, as `PushSubscription.toJSON()` gives it. */
export interface Subscription { endpoint: string; keys: { p256dh: string; auth: string } }

/** `push/{uid}`: where to push, when each slot goes idle (the app's last schedule), and up to when the tick has announced
 * it. */
export interface PushRecord { uid: string; subscriptions: Subscription[]; schedule: PushEntry[]; checkedAt: number }

export type PushFields = Partial<Omit<PushRecord, 'uid'>>

export interface PushRepository {
  get(uid: string): Promise<PushRecord | null>
  /** Accounts with at least one subscription. */
  active(): Promise<PushRecord[]>
  /** Sets only the fields given, creating the record if needed: a sync's schedule and a tick never undo each other. */
  patch(uid: string, fields: PushFields): Promise<void>
}

export const PUSH_REPOSITORY = Symbol('PUSH_REPOSITORY')

const record = (uid: string, data: DocumentData | undefined): PushRecord => ({
  uid,
  subscriptions: Array.isArray(data?.subscriptions) ? (data.subscriptions as Subscription[]) : [],
  schedule: Array.isArray(data?.schedule) ? (data.schedule as PushEntry[]) : [],
  checkedAt: typeof data?.checkedAt === 'number' ? data.checkedAt : 0,
})

/** Production: `push/{uid}` in the `farm` database (FIRESTORE_DATABASE; never `(default)`, which is uma-rpg's). */
export class FirestorePushRepository implements PushRepository {
  constructor(private readonly databaseId: string) {}

  private col(): CollectionReference {
    return getFirestore(getApps()[0] ?? initializeApp(), this.databaseId).collection('push')
  }

  async get(uid: string): Promise<PushRecord | null> {
    const snap = await this.col().doc(uid).get()
    return snap.exists ? record(uid, snap.data()) : null
  }

  async active(): Promise<PushRecord[]> {
    const snap = await this.col().where('active', '==', true).get()
    return snap.docs.map((d) => record(d.id, d.data()))
  }

  async patch(uid: string, fields: PushFields): Promise<void> {
    // A merge replaces each array whole, so `subscriptions` and `schedule` are always exactly what was sent.
    const active = fields.subscriptions ? { active: fields.subscriptions.length > 0 } : {}
    await this.col().doc(uid).set({ ...fields, ...active, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  }
}

/** Local development: kept in memory (nothing can be pushed without VAPID keys anyway). */
export class MemoryPushRepository implements PushRepository {
  private readonly records = new Map<string, PushRecord>()

  async get(uid: string): Promise<PushRecord | null> {
    return this.records.get(uid) ?? null
  }

  async active(): Promise<PushRecord[]> {
    return [...this.records.values()].filter((r) => r.subscriptions.length > 0)
  }

  async patch(uid: string, fields: PushFields): Promise<void> {
    this.records.set(uid, { ...record(uid, undefined), ...this.records.get(uid), ...fields, uid })
  }
}
