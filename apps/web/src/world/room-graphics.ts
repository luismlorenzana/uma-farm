export const ROOM_QUALITY = ['saver', 'medium', 'high'] as const
export type RoomQuality = typeof ROOM_QUALITY[number]

const storageKey = 'farm.room-graphics'
let sessionChoice: RoomQuality | undefined

export function readRoomQuality(): RoomQuality {
  if (sessionChoice) return sessionChoice
  try {
    const saved = window.localStorage.getItem(storageKey)
    return ROOM_QUALITY.find(quality => quality === saved) ?? 'medium'
  } catch {
    return 'medium'
  }
}

export function saveRoomQuality(quality: RoomQuality): void {
  sessionChoice = quality
  try {
    window.localStorage.setItem(storageKey, quality)
  } catch { /* The choice still applies during this session when device storage is unavailable. */ }
}
