import { afterEach, beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  window.localStorage.clear()
})

afterEach(() => vi.restoreAllMocks())

it('starts an indoor room in Balanced', async () => {
  const { readRoomQuality } = await import('./room-graphics')
  expect(readRoomQuality()).toBe('medium')
})

it.each(['saver', 'medium', 'high'] as const)('keeps the %s selection after restarting', async quality => {
  const { saveRoomQuality } = await import('./room-graphics')
  saveRoomQuality(quality)
  vi.resetModules()
  const { readRoomQuality } = await import('./room-graphics')
  expect(readRoomQuality()).toBe(quality)
})

it('defaults to Balanced when a saved quality is invalid', async () => {
  window.localStorage.setItem('farm.room-graphics', 'invalid')
  const { readRoomQuality } = await import('./room-graphics')
  expect(readRoomQuality()).toBe('medium')
})

it('keeps the session selection if device storage is unavailable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable') })
  const { readRoomQuality, saveRoomQuality } = await import('./room-graphics')
  expect(readRoomQuality()).toBe('medium')
  saveRoomQuality('saver')
  expect(readRoomQuality()).toBe('saver')
})
