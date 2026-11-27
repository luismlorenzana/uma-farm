// @vitest-environment node
import { expect, it } from 'vitest'
import { boundedContentCache } from './cache'

function testCache() {
  const entries = new Map<string, Response>()
  const keyOf = (input: RequestInfo | URL) => typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return {
    keys: async () => [...entries.keys()].map(key => new Request(key)),
    match: async (key: RequestInfo | URL) => entries.get(keyOf(key))?.clone(),
    put: async (key: RequestInfo | URL, response: Response) => { entries.set(keyOf(key), response.clone()) },
    delete: async (key: RequestInfo | URL) => entries.delete(keyOf(key)),
  } satisfies Pick<Cache, 'keys' | 'match' | 'put' | 'delete'>
}

const art = () => new Response('RIFF0000WEBP')
const key = (path: string) => `https://uma-kit.invalid/release/${path}`

it('reuses verified art, coalesces replacements, and evicts by bytes without removing boot data', async () => {
  const disk = testCache()
  await disk.put(key('verified-legacy-art'), art())
  await disk.put(key('master-data'), Response.json({ boot: true }))
  const cache = boundedContentCache(disk, 24)

  expect(await (await cache.match(key('verified-legacy-art')))?.text()).toBe('RIFF0000WEBP')
  await cache.put(key('newer-art'), art())
  expect(await cache.match(key('verified-legacy-art'))).toBeDefined()

  await Promise.all([cache.put(key('newer-art'), art()), cache.put(key('latest-art'), art())])
  expect(await cache.match(key('verified-legacy-art'))).toBeUndefined()
  expect(await cache.match(key('newer-art'))).toBeDefined()
  expect(await cache.match(key('latest-art'))).toBeDefined()
  expect(await (await cache.match(key('master-data')))?.json()).toEqual({ boot: true })

  const restarted = boundedContentCache(disk, 24)
  await restarted.put(key('another-art'), art())
  expect(await restarted.match(key('newer-art'))).toBeUndefined()
  expect(await restarted.match(key('latest-art'))).toBeDefined()
  expect(await restarted.match(key('another-art'))).toBeDefined()
})
