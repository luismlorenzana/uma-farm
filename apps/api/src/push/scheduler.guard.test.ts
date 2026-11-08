import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PUSH_SCHEDULER, SchedulerGuard, type TickVerifier } from './scheduler.guard'

const AUD = 'https://farm-api.example.run.app'
// No network: the verifier is injected, as the ping's is. It accepts only "good" and "stranger", for AUD.
const verifier: TickVerifier = async (token, audience) => {
  if (audience !== AUD) throw new Error('wrong audience')
  if (token === 'good') return { email: PUSH_SCHEDULER, email_verified: true }
  if (token === 'stranger') return { email: 'rpg-push-scheduler@uma-rpg.iam.gserviceaccount.com', email_verified: true }
  throw new Error('bad signature')
}
const check = (header?: string) => new SchedulerGuard(verifier).check(header)

describe('POST /api/push/tick: its own guard', () => {
  beforeEach(() => { process.env.PUSH_AUDIENCE = AUD })
  afterEach(() => { delete process.env.PUSH_AUDIENCE; delete process.env.PUSH_SCHEDULER_EMAIL })

  it('lets farm-push-scheduler in with the right audience', async () => expect(await check('Bearer good')).toBe(true))
  it('answers 401 with no token', async () => expect(check()).rejects.toBeInstanceOf(UnauthorizedException))
  it('answers 401 with a bad signature', async () => expect(check('Bearer forged')).rejects.toBeInstanceOf(UnauthorizedException))
  it('answers 401 for the wrong audience', async () => {
    process.env.PUSH_AUDIENCE = 'https://elsewhere.example'
    await expect(check('Bearer good')).rejects.toBeInstanceOf(UnauthorizedException)
  })
  it('answers 401 while PUSH_AUDIENCE is unset, as in local development', async () => {
    delete process.env.PUSH_AUDIENCE
    await expect(check('Bearer good')).rejects.toBeInstanceOf(UnauthorizedException)
  })
  it('answers 403 for a good token from another account', async () => expect(check('Bearer stranger')).rejects.toBeInstanceOf(ForbiddenException))
  it('takes PUSH_SCHEDULER_EMAIL over the default', async () => {
    process.env.PUSH_SCHEDULER_EMAIL = 'rpg-push-scheduler@uma-rpg.iam.gserviceaccount.com'
    await expect(check('Bearer stranger')).resolves.toBe(true)
    await expect(check('Bearer good')).rejects.toBeInstanceOf(ForbiddenException)
  })
})
