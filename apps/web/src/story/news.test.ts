// The release waiting for the morning's "New story arrived": its number kept under its key, replaced by a newer one,
// forgotten once told (only that one), and nothing read from an empty, broken or failing store.
import { describe, expect, it } from 'vitest'
import { arrivedRelease, forgetArrived, keepArrived, STORY_NEWS_KEY } from './news'

function memory() {
  const items = new Map<string, string>()
  return { items, getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v), removeItem: (k: string) => void items.delete(k) }
}

describe('the release waiting for the morning', () => {
  it('keeps the latest under its key, and forgets only the one told', () => {
    const storage = memory()
    expect(arrivedRelease(storage)).toBeNull()
    keepArrived({ number: 2 }, storage)
    expect(JSON.parse(storage.items.get(STORY_NEWS_KEY)!)).toEqual({ number: 2 })
    keepArrived({ number: 3 }, storage)
    expect(arrivedRelease(storage)).toEqual({ number: 3 })
    forgetArrived(2, storage)
    expect(arrivedRelease(storage)).toEqual({ number: 3 })
    forgetArrived(3, storage)
    expect(arrivedRelease(storage)).toBeNull()
    keepArrived({ number: 4 }, storage)
    forgetArrived(undefined, storage)
    expect(arrivedRelease(storage)).toBeNull()
  })

  it('reads nothing the save could not keep, and never throws', () => {
    const storage = memory()
    for (const text of ['{ broken', '{"number":0}', '{"number":2.5}', '{"number":"2"}', '"2"', 'null']) {
      storage.items.set(STORY_NEWS_KEY, text)
      expect(arrivedRelease(storage)).toBeNull()
    }
    const failing = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') }, removeItem: () => { throw new Error('denied') } }
    expect(arrivedRelease(failing)).toBeNull()
    expect(() => keepArrived({ number: 1 }, failing)).not.toThrow()
    expect(() => forgetArrived(undefined, failing)).not.toThrow()
    expect(arrivedRelease(undefined)).toBeNull()
  })
})
