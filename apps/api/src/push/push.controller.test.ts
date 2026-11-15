import { PUSH_SCHEDULE_MAX } from '@farm/domain'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { parseSchedule, parseSubscription, PushController } from './push.controller'
import type { PushSender } from './push.sender'
import type { PushService } from './push.service'

const SUB = { endpoint: 'https://push.example/phone', keys: { p256dh: 'p', auth: 'a' } }

describe('the push routes', () => {
  it('takes a browser subscription, and nothing else', () => {
    expect(parseSubscription({ ...SUB, expirationTime: null })).toEqual(SUB)
    for (const bad of [null, {}, { ...SUB, endpoint: 'http://push.example/phone' }, { ...SUB, keys: { p256dh: 'p' } }]) {
      expect(() => parseSubscription(bad)).toThrow(BadRequestException)
    }
  })

  it('takes a schedule of the farm\'s work places and times, never a save', () => {
    const at = Date.parse('2026-11-08T12:00:00.000Z')
    expect(parseSchedule({ entries: [] })).toEqual([])
    expect(parseSchedule({ entries: [{ at, place: 'mine', badge: 1, outfitId: '101' }] })).toEqual([{ at, place: 'mine', badge: 1 }])
    const refused = [
      null, [], { entries: {} }, { save: {} },
      { entries: Array.from({ length: PUSH_SCHEDULE_MAX + 1 }, () => ({ at, place: 'mine', badge: 1 })) },
      { entries: [{ at, place: 'forge', badge: 1 }] },
      { entries: [{ at: 'soon', place: 'mine', badge: 1 }] },
      { entries: [{ at: 1.5, place: 'mine', badge: 1 }] },
      { entries: [{ at, place: 'mine', badge: -1 }] },
      { entries: [{ at, place: 'mine', badge: PUSH_SCHEDULE_MAX + 1 }] },
      { entries: [{ at, place: 'fields', badge: 1 }] },
      { entries: [null] },
    ]
    for (const bad of refused) expect(() => parseSchedule(bad)).toThrow(BadRequestException)
  })

  it('answers the key 404 while push is off', () => {
    const off = new PushController({} as PushService, { enabled: false, publicKey: null } as unknown as PushSender)
    expect(() => off.key()).toThrow(NotFoundException)
    const on = new PushController({} as PushService, { enabled: true, publicKey: 'BKey' } as unknown as PushSender)
    expect(on.key()).toEqual({ publicKey: 'BKey' })
  })
})
