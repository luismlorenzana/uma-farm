import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, type DocumentSnapshot, type Firestore } from 'firebase-admin/firestore'
import { parseStored, versionOf, type SaveEnvelope, type SaveV4 } from '@farm/domain'
import { EMPTY_ENVELOPE, RevisionConflict, type SaveRepository } from './save.repository'

// Production persistence in the `farm` database (FIRESTORE_DATABASE; never `(default)`, which is uma-rpg's):
// `saves/{uid}` = { revision, save }, revision-checked inside a transaction. Copied from uma-rpg at 30a322a. `save` is
// JSON text: Firestore refuses a list inside a list. When a newer save version first replaces a stored one (the farm's
// v4 over a save from before it), the stored document is copied whole to `saveBackups/{uid}-v{n}`, so the older farm
// can be read back by hand. A refused upload waits in `saveRescues/{uid}`, newest only. The server never changes a save;
// it stores what the app sent.
const storedSave = (data: { save?: unknown } | undefined): unknown => (typeof data?.save === 'string' ? JSON.parse(data.save) as unknown : data?.save)

export class FirestoreSaveRepository implements SaveRepository {
  constructor(private readonly databaseId: string) {}

  private db(): Firestore {
    return getFirestore(getApps()[0] ?? initializeApp(), this.databaseId)
  }

  private static envelope(snapshot: DocumentSnapshot): SaveEnvelope {
    if (!snapshot.exists) return EMPTY_ENVELOPE
    const data = snapshot.data() as { revision?: unknown; save?: unknown }
    return { revision: Number(data.revision ?? 0), save: parseStored(storedSave(data)) }
  }

  async load(uid: string): Promise<SaveEnvelope> {
    return FirestoreSaveRepository.envelope(await this.db().collection('saves').doc(uid).get())
  }

  put(uid: string, baseRevision: number, save: SaveV4): Promise<SaveEnvelope> {
    const db = this.db()
    const ref = db.collection('saves').doc(uid)
    return db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref)
      const current = FirestoreSaveRepository.envelope(snapshot)
      const storedVersion = snapshot.exists ? versionOf(storedSave(snapshot.data() as { save?: unknown })) : 0
      if (current.revision !== baseRevision || save.version < storedVersion) throw new RevisionConflict(current)
      if (snapshot.exists && save.version > storedVersion) {
        tx.set(db.collection('saveBackups').doc(`${uid}-v${storedVersion}`), { ...snapshot.data(), backedUpAt: FieldValue.serverTimestamp() })
      }
      const next = { revision: baseRevision + 1, save }
      tx.set(ref, { revision: next.revision, save: JSON.stringify(save), updatedAt: FieldValue.serverTimestamp() })
      return next
    })
  }

  async rescue(uid: string, upload: unknown, reason: string): Promise<void> {
    await this.db().collection('saveRescues').doc(uid).set({ upload: JSON.stringify(upload), reason, rescuedAt: FieldValue.serverTimestamp() })
  }
}
