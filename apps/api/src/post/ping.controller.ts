import { Public } from '@luismlorenzana/uma-server/auth'
import { Controller, Headers, HttpCode, Inject, Post, UnauthorizedException } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'

/** Checks a Google-signed ID token for this audience and returns its email, or throws. */
export type PingVerifier = (token: string, audience: string) => Promise<{ email?: string; email_verified?: boolean }>
export const PING_VERIFIER = Symbol('PING_VERIFIER')

export function googleVerifier(): PingVerifier {
  const client = new OAuth2Client()
  return async (token, audience) => {
    const ticket = await client.verifyIdToken({ idToken: token, audience })
    return ticket.getPayload() ?? {}
  }
}

const callers = (): string[] => (process.env.POST_CALLERS ?? '').split(',').map((s) => s.trim()).filter(Boolean)

// The parcel ping (IN18): outside the owner guard, checked by its own token instead. Only a Google-signed ID token whose
// audience is FARM_API_URL (this service's own URL) and whose email is on POST_CALLERS gets { ok: true }.
@Controller('post')
export class PingController {
  constructor(@Inject(PING_VERIFIER) private readonly verify: PingVerifier) {}

  @Public()
  @Post('ping')
  @HttpCode(200)
  async ping(@Headers('authorization') authorization?: string): Promise<{ ok: true }> {
    const token = /^Bearer\s+(.+)$/i.exec(authorization ?? '')?.[1]
    const audience = process.env.FARM_API_URL
    const allowed = callers()
    if (!token || !audience || allowed.length === 0) throw new UnauthorizedException()
    let payload: { email?: string; email_verified?: boolean }
    try {
      payload = await this.verify(token, audience)
    } catch {
      throw new UnauthorizedException()
    }
    if (!payload.email || payload.email_verified === false || !allowed.includes(payload.email)) throw new UnauthorizedException()
    return { ok: true }
  }
}
