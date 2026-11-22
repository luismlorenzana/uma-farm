import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { parseStored, versionOf, type SaveEnvelope, type SaveV4 } from '@farm/domain'
import { EMPTY_ENVELOPE, RevisionConflict, type SaveRepository } from './save.repository'

type FileShape = Record<string, { revision: number; save: unknown }>

// Local dev persistence (copied from uma-rpg at 30a322a): one JSON file written atomically (tmp + rename), with calls
// serialized in-process. It keeps no backups: a v5 over an older save replaces it.
export class LocalSaveRepository implements SaveRepository {
  private queue: Promise<unknown> = Promise.resolve()

  constructor(private readonly file: string) {}

  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn)
    this.queue = run.catch(() => undefined)
    return run
  }

  private async read(): Promise<FileShape> {
    try {
      return JSON.parse(await readFile(this.file, 'utf8')) as FileShape
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {}
      throw err
    }
  }

  private async write(data: FileShape): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true })
    const tmp = `${this.file}.tmp`
    await writeFile(tmp, JSON.stringify(data, null, 2))
    await rename(tmp, this.file)
  }

  load(uid: string): Promise<SaveEnvelope> {
    return this.serialize(async () => {
      const row = (await this.read())[uid]
      return row ? { revision: row.revision, save: parseStored(row.save) } : EMPTY_ENVELOPE
    })
  }

  put(uid: string, baseRevision: number, save: SaveV4): Promise<SaveEnvelope> {
    return this.serialize(async () => {
      const data = await this.read()
      const row = data[uid]
      const current: SaveEnvelope = row ? { revision: row.revision, save: parseStored(row.save) } : EMPTY_ENVELOPE
      if (current.revision !== baseRevision || save.version < versionOf(row?.save) || (current.save?.version === 6 && current.save.forge && !save.forge)) throw new RevisionConflict(current)
      if (current.save && 'calendar' in current.save && save.calendar.start !== current.save.calendar.start) {
        throw new RevisionConflict(current)
      }
      if (current.save?.version === 6 && (save.calendar.expandedAt !== current.save.calendar.expandedAt
        || save.calendar.finishingContest !== current.save.calendar.finishingContest)) throw new RevisionConflict(current)
      const next = { revision: baseRevision + 1, save }
      data[uid] = next
      await this.write(data)
      return next
    })
  }

  rescue(uid: string, upload: unknown, reason: string): Promise<void> {
    return this.serialize(() => writeFile(`${this.file}.rescue.json`, JSON.stringify({ uid, reason, upload }, null, 2)))
  }
}
