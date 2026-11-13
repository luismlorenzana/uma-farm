// The tick (copied from uma-rpg's push.service.test.ts at 30a322a and cut): it never reads a save, only the schedule
// the app sent. Due, not due, a dead subscription, and what a tick writes. Invented data only.
import { newSaveV2, pushSchedule, startJob, type PushEntry } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { MemoryPushRepository, type PushRepository, type Subscription } from './push.repository'
import type { PushSender, SendResult } from './push.sender'
import { PushService } from './push.service'

const T0 = Date.parse('2026-11-08T12:00:00.000Z')
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const sub = (endpoint: string): Subscription => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } })
const entry = (place: string, at: number, badge = 1): PushEntry => ({ at, place, badge })

function setup() {
  const sent: { endpoint: string; payload: object }[] = []
  const sender = { enabled: true, send: async (s: Subscription, payload: object): Promise<SendResult> => {
    sent.push({ endpoint: s.endpoint, payload })
    return s.endpoint.endsWith('/gone') ? 'gone' : 'sent'
  } } as unknown as PushSender
  const records = new MemoryPushRepository()
  const writes: string[] = []
  const counted: PushRepository = { get: (uid) => records.get(uid), active: () => records.active(), patch: (uid, fields) => { writes.push(Object.keys(fields).join()); return records.patch(uid, fields) } }
  return { sent, records, writes, push: new PushService(counted, sender) }
}

describe('push tick (uma-rpg D63, the farm F6)', () => {
  it('sends each entry once when it comes due, and nothing before', async () => {
    const { push, sent } = setup()
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.schedule('u', [entry('mine', T0 + 7 * MINUTE)])

    expect(await push.tick(T0 + 5 * MINUTE)).toEqual({ accounts: 1, sent: 0 })
    expect(await push.tick(T0 + 10 * MINUTE)).toEqual({ accounts: 1, sent: 1 })
    expect(sent[0]!.payload).toEqual({ title: 'Work done', body: 'Mine: 1 job done', tag: 'work-mine', url: '/wilds/mine', badge: 1 })
    expect(await push.tick(T0 + 15 * MINUTE)).toEqual({ accounts: 1, sent: 0 })
    expect(sent).toHaveLength(1)
  })

  it('makes one notification of everything due in a tick, with the latest badge', async () => {
    const { push, sent } = setup()
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.schedule('u', [entry('mine', T0 + MINUTE, 1), entry('fields', T0 + 2 * MINUTE, 2), entry('mine', T0 + 3 * MINUTE, 3), entry('forest', T0 + HOUR, 4)])
    expect(await push.tick(T0 + 5 * MINUTE)).toEqual({ accounts: 1, sent: 1 })
    expect(sent.map((s) => s.payload)).toEqual([{ title: 'Work done', body: 'Mine: 2 jobs done\nFields: 1 job done', tag: 'work', url: '/', badge: 3 }])
  })

  it('pushes to every live device and forgets a dead subscription', async () => {
    const { push, sent, records } = setup()
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.subscribe('u', sub('https://push.example/gone'), T0)
    await push.schedule('u', [entry('mine', T0 + MINUTE), entry('mine', T0 + 7 * MINUTE)])
    expect(await push.tick(T0 + 5 * MINUTE)).toEqual({ accounts: 1, sent: 1 })
    expect(sent.map((s) => s.endpoint)).toEqual(['https://push.example/phone', 'https://push.example/gone'])
    expect((await records.get('u'))!.subscriptions.map((s) => s.endpoint)).toEqual(['https://push.example/phone'])
    await push.tick(T0 + 10 * MINUTE)
    expect(sent.map((s) => s.endpoint).slice(2)).toEqual(['https://push.example/phone'])
  })

  it('stops ticking an account whose last device is gone', async () => {
    const { push, records } = setup()
    await push.subscribe('u', sub('https://push.example/gone'), T0)
    await push.schedule('u', [entry('mine', T0 + MINUTE)])
    expect(await push.tick(T0 + 5 * MINUTE)).toEqual({ accounts: 1, sent: 1 })
    expect(await records.active()).toEqual([])
    expect(await push.tick(T0 + 10 * MINUTE)).toEqual({ accounts: 0, sent: 0 })
  })

  it('never announces what finished before the first subscription, or more than six hours back', async () => {
    const { push, sent } = setup()
    await push.schedule('u', [entry('mine', T0 - MINUTE)])
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    expect(await push.tick(T0 + 5 * MINUTE)).toEqual({ accounts: 1, sent: 0 })
    await push.schedule('u', [entry('fields', T0 + 10 * MINUTE), entry('forest', T0 + 7 * HOUR)])
    expect(await push.tick(T0 + 7 * HOUR)).toEqual({ accounts: 1, sent: 1 })
    expect(sent.map((s) => (s.payload as { body: string }).body)).toEqual(['Forest: 1 job done'])
  })

  it('writes only when it sent, and then only when it checked and who is left', async () => {
    const { push, writes } = setup()
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.schedule('u', [entry('mine', T0 + 7 * MINUTE)])
    writes.length = 0
    await push.tick(T0 + 5 * MINUTE)
    expect(writes).toEqual([])
    await push.tick(T0 + 10 * MINUTE)
    expect(writes).toEqual(['checkedAt'])
  })

  it('takes a new schedule whole, so a collected job is never announced', async () => {
    const { push, sent } = setup()
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.schedule('u', [entry('mine', T0 + 7 * MINUTE)])
    await push.schedule('u', [entry('fields', T0 + 8 * MINUTE)])
    await push.tick(T0 + 10 * MINUTE)
    expect(sent.map((s) => (s.payload as { body: string }).body)).toEqual(['Fields: 1 job done'])
  })

  it("announces the app's own schedule from a real job, when its slot goes idle", async () => {
    // An invented outfit at Craft Lv1 mining one ore: the schedule the app would send on its next sync.
    const save = startJob(newSaveV2('u', new Date(T0).toISOString()), 'mine', 0, { outfitId: '101' }, 'copper-ore', 1, new Date(T0).toISOString())
    const schedule = pushSchedule(save, T0)
    expect(schedule).toHaveLength(1)
    const { push, sent } = setup()
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.schedule('u', schedule)
    expect(await push.tick(schedule[0]!.at - 1)).toEqual({ accounts: 1, sent: 0 })
    expect(await push.tick(schedule[0]!.at)).toEqual({ accounts: 1, sent: 1 })
    expect(sent[0]!.payload).toMatchObject({ title: 'Work done', body: 'Mine: 1 job done', badge: 1 })
  })
})

describe('subscriptions and the test push', () => {
  it('keeps the newest five devices, one record per endpoint, and starts the clock on the first', async () => {
    const { push, records } = setup()
    for (let i = 0; i < 7; i++) await push.subscribe('u', sub(`https://push.example/${i}`), T0 + i)
    await push.subscribe('u', sub('https://push.example/4'), T0 + 9)
    const record = (await records.get('u'))!
    expect(record.subscriptions.map((s) => s.endpoint.slice(-1))).toEqual(['2', '3', '5', '6', '4'])
    expect(record.checkedAt).toBe(T0)
  })

  it('sends a test to each device and says how many are still there', async () => {
    const { push, sent } = setup()
    expect(await push.test('u')).toBe(0)
    await push.subscribe('u', sub('https://push.example/phone'), T0)
    await push.subscribe('u', sub('https://push.example/gone'), T0)
    expect(await push.test('u')).toBe(1)
    expect(sent[0]!.payload).toMatchObject({ title: 'Notifications are on', tag: 'test' })
  })
})
