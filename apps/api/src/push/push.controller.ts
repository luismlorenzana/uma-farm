import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Post, Put, UseGuards } from '@nestjs/common'
import { placeById, PUSH_SCHEDULE_MAX, type PushEntry } from '@farm/domain'
import { CurrentUid, Public } from '@luismlorenzana/uma-server/auth'
import type { Subscription } from './push.repository'
import { PushSender } from './push.sender'
import { PushService } from './push.service'
import { SchedulerGuard } from './scheduler.guard'

export function parseSubscription(body: unknown): Subscription {
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  const ok = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max
  if (!b || !ok(b.endpoint, 1000) || !b.endpoint.startsWith('https://') || !ok(b.keys?.p256dh, 200) || !ok(b.keys?.auth, 100)) {
    throw new BadRequestException('expected a push subscription')
  }
  return { endpoint: b.endpoint, keys: { p256dh: b.keys.p256dh as string, auth: b.keys.auth as string } }
}

/** `{ entries: [{ at, place, badge }] }`: a Wilds place, a time in ms, a badge no bigger than the slots. */
export function parseSchedule(body: unknown): PushEntry[] {
  const entries = (body as { entries?: unknown } | null)?.entries
  if (!Array.isArray(entries) || entries.length > PUSH_SCHEDULE_MAX) throw new BadRequestException('expected a push schedule')
  return entries.map((e: unknown) => {
    const { at, place, badge } = (e ?? {}) as { at?: unknown; place?: unknown; badge?: unknown }
    if (typeof at !== 'number' || !Number.isSafeInteger(at) || at < 0 || typeof place !== 'string' || !placeById(place)
      || typeof badge !== 'number' || !Number.isInteger(badge) || badge < 0 || badge > PUSH_SCHEDULE_MAX) {
      throw new BadRequestException('expected a push schedule')
    }
    return { at, place, badge }
  })
}

// "Work done" notifications (copied from uma-rpg's D63 at 30a322a, F6). Every route but the tick sits behind the owner
// guard; the tick is public at that guard and checked by its own (Cloud Scheduler's OIDC token).
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService, private readonly sender: PushSender) {}

  /** The VAPID public key the app subscribes with; 404 while push is off (no keys). */
  @Get('key')
  key(): { publicKey: string } {
    if (!this.sender.enabled) throw new NotFoundException('push is off')
    return { publicKey: this.sender.publicKey! }
  }

  @Post('subscription')
  @HttpCode(204)
  async subscribe(@CurrentUid() uid: string, @Body() body: unknown): Promise<void> {
    await this.push.subscribe(uid, parseSubscription(body))
  }

  @Put('schedule')
  @HttpCode(204)
  async schedule(@CurrentUid() uid: string, @Body() body: unknown): Promise<void> {
    await this.push.schedule(uid, parseSchedule(body))
  }

  @Post('test')
  @HttpCode(200)
  async test(@CurrentUid() uid: string): Promise<{ devices: number }> {
    return { devices: await this.push.test(uid) }
  }

  @Public()
  @UseGuards(SchedulerGuard)
  @Post('tick')
  @HttpCode(200)
  tick(): Promise<{ accounts: number; sent: number }> {
    return this.push.tick()
  }
}
