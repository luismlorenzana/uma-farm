import { UnauthorizedException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PingController, type PingVerifier } from './ping.controller'

const AUD = 'https://farm-api.example.run.app'
const QUEST = 'quest-api-runtime@uma-rpg.iam.gserviceaccount.com'
// No network: the verifier is injected. It accepts only "good", for AUD.
const verifier: PingVerifier = async (token, audience) => {
  if (audience !== AUD) throw new Error('wrong audience')
  if (token === 'good') return { email: QUEST, email_verified: true }
  if (token === 'stranger') return { email: 'someone@example.com', email_verified: true }
  throw new Error('bad signature')
}
const ping = (header?: string) => new PingController(verifier).ping(header)

describe('POST /api/post/ping', () => {
  beforeEach(() => { process.env.FARM_API_URL = AUD; process.env.POST_CALLERS = `${QUEST}, other@x.iam.gserviceaccount.com` })
  afterEach(() => { delete process.env.FARM_API_URL; delete process.env.POST_CALLERS })

  it('answers ok for a listed caller with the right audience', async () => expect(await ping('Bearer good')).toEqual({ ok: true }))
  it('refuses no token', async () => expect(ping()).rejects.toBeInstanceOf(UnauthorizedException))
  it('refuses a bad signature', async () => expect(ping('Bearer forged')).rejects.toBeInstanceOf(UnauthorizedException))
  it('refuses an account off the list', async () => expect(ping('Bearer stranger')).rejects.toBeInstanceOf(UnauthorizedException))
  it('refuses the wrong audience', async () => {
    process.env.FARM_API_URL = 'https://elsewhere.example'
    await expect(ping('Bearer good')).rejects.toBeInstanceOf(UnauthorizedException)
  })
  it('refuses everyone while POST_CALLERS is unset', async () => {
    delete process.env.POST_CALLERS
    await expect(ping('Bearer good')).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
