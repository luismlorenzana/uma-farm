import { Inject, Injectable, Logger } from '@nestjs/common'
import { scheduleNotice, type PushEntry, type PushNotice } from '@farm/domain'
import { PUSH_REPOSITORY, type PushRepository, type Subscription } from './push.repository'
import { PushSender } from './push.sender'

// Copied from uma-rpg's apps/api/src/push at 30a322a and cut for the farm: uma-rpg's tick reads each save;
// the farm's never does. The app sends when each slot goes idle on every sync, and the tick sends what came due.

/** How far back a tick looks when the last one was long ago: older finishes aren't news. */
const LOOKBACK_MS = 6 * 3600 * 1000
const MAX_SUBSCRIPTIONS = 5

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name)

  constructor(
    @Inject(PUSH_REPOSITORY) private readonly records: PushRepository,
    private readonly sender: PushSender,
  ) {}

  /** Keeps this device's subscription (the newest five). A first one starts the clock: what finished before isn't news. */
  async subscribe(uid: string, sub: Subscription, now = Date.now()): Promise<void> {
    const current = (await this.records.get(uid))?.subscriptions ?? []
    const others = current.filter((s) => s.endpoint !== sub.endpoint)
    await this.records.patch(uid, { subscriptions: [...others, sub].slice(-MAX_SUBSCRIPTIONS), ...(current.length === 0 ? { checkedAt: now } : {}) })
  }

  /** The app's schedule replaces the last one, whichever device sent it. */
  async schedule(uid: string, entries: PushEntry[]): Promise<void> {
    await this.records.patch(uid, { schedule: entries })
  }

  /** Sends one notification to every device of an account; returns the devices still subscribed. */
  private async deliver(subscriptions: Subscription[], payload: PushNotice | object): Promise<Subscription[]> {
    const results = await Promise.all(subscriptions.map((s) => this.sender.send(s, payload)))
    return subscriptions.filter((_, i) => results[i] !== 'gone')
  }

  /** Account's "Send a test": how many devices are still subscribed. */
  async test(uid: string): Promise<number> {
    const record = await this.records.get(uid)
    if (!record || record.subscriptions.length === 0) return 0
    const kept = await this.deliver(record.subscriptions, { title: 'Notifications are on', body: 'You’ll hear when work is done.', tag: 'test', url: '/' })
    if (kept.length !== record.subscriptions.length) await this.records.patch(uid, { subscriptions: kept })
    return kept.length
  }

  /** Cloud Scheduler's tick, every five minutes: for each subscribed account, one notification for every entry that came
   * due since the last tick (six hours back at most). It writes only when it sent something or a device was gone. */
  async tick(now = Date.now()): Promise<{ accounts: number; sent: number }> {
    let sent = 0
    let gone = 0
    const records = await this.records.active()
    for (const record of records) {
      const from = Math.max(record.checkedAt, now - LOOKBACK_MS)
      const notice = scheduleNotice(record.schedule.filter((e) => e.at > from && e.at <= now))
      if (!notice) continue
      const kept = await this.deliver(record.subscriptions, notice)
      sent++
      gone += record.subscriptions.length - kept.length
      await this.records.patch(record.uid, { checkedAt: now, ...(kept.length !== record.subscriptions.length ? { subscriptions: kept } : {}) })
    }
    if (sent > 0) this.logger.log(`tick: ${sent} sent, ${records.length} accounts, ${gone} devices gone`)
    return { accounts: records.length, sent }
  }
}
