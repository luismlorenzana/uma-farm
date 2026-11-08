import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

/** Checks a Google-signed ID token for this audience and returns its claims, or throws (the ping's `googleVerifier`). */
export type TickVerifier = (token: string, audience: string) => Promise<{ email?: string; email_verified?: boolean }>
export const TICK_VERIFIER = Symbol('TICK_VERIFIER')

/** The scheduler's account (F2, IN17); PUSH_SCHEDULER_EMAIL overrides it. */
export const PUSH_SCHEDULER = 'farm-push-scheduler@uma-rpg.iam.gserviceaccount.com'

/**
 * Lets only Cloud Scheduler's tick in (copied from uma-rpg's scheduler guard at 30a322a, F6): a Google-signed OIDC token
 * minted for PUSH_AUDIENCE (this API's URL) for `farm-push-scheduler`. No token, a bad one, or no audience set: 401. A good
 * token from anyone else: 403. Unlike uma-rpg's, nothing lets an unsigned tick in, not even locally.
 */
@Injectable()
export class SchedulerGuard implements CanActivate {
  constructor(@Inject(TICK_VERIFIER) private readonly verify: TickVerifier) {}

  canActivate(ctx: ExecutionContext): Promise<boolean> {
    return this.check(ctx.switchToHttp().getRequest<Request>().headers.authorization)
  }

  async check(authorization?: string): Promise<true> {
    const token = /^Bearer\s+(.+)$/i.exec(authorization ?? '')?.[1]
    const audience = process.env.PUSH_AUDIENCE
    if (!token || !audience) throw new UnauthorizedException()
    let payload: { email?: string; email_verified?: boolean }
    try {
      payload = await this.verify(token, audience)
    } catch {
      throw new UnauthorizedException()
    }
    const scheduler = process.env.PUSH_SCHEDULER_EMAIL || PUSH_SCHEDULER
    if (payload.email !== scheduler || payload.email_verified === false) throw new ForbiddenException()
    return true
  }
}
