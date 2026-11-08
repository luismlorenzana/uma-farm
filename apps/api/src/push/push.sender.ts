import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import webpush from 'web-push'
import type { Subscription } from './push.repository'

// Copied from uma-rpg's apps/api/src/push at 30a322a (F6).

export type SendResult = 'sent' | 'gone' | 'failed'

const SITE = 'https://uma-farm.web.app'

/**
 * Web Push with the farm's VAPID keys (Secret Manager `farm-vapid`, given to Cloud Run as VAPID_KEYS =
 * {"publicKey","privateKey"}). Without them push is off: the key route answers 404 and the app's switch stays off.
 */
@Injectable()
export class PushSender {
  readonly publicKey: string | null
  private readonly privateKey: string | null
  private readonly subject: string

  constructor(config: ConfigService) {
    let keys: { publicKey?: string; privateKey?: string } = {}
    try {
      keys = JSON.parse(config.get<string>('VAPID_KEYS') ?? '{}') as typeof keys
    } catch {
      keys = {}
    }
    this.publicKey = keys.publicKey ?? null
    this.privateKey = keys.privateKey ?? null
    // Push services want a contact: the site itself, not anyone's address (an https URL, so never localhost).
    const origin = (config.get<string>('ALLOWED_ORIGIN') ?? SITE).split(',')[0]!.trim()
    this.subject = origin.startsWith('https://') ? origin : SITE
  }

  get enabled(): boolean {
    return !!this.publicKey && !!this.privateKey
  }

  async send(sub: Subscription, payload: object): Promise<SendResult> {
    if (!this.enabled) return 'failed'
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), {
        TTL: 6 * 3600,
        urgency: 'normal',
        vapidDetails: { subject: this.subject, publicKey: this.publicKey!, privateKey: this.privateKey! },
      })
      return 'sent'
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      // 404 and 410: the subscription is gone (the app was removed, or notifications turned off).
      return status === 404 || status === 410 ? 'gone' : 'failed'
    }
  }
}
