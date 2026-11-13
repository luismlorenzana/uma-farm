// The story pack's route through a real Nest app over HTTP, with the owner guard on and its Firebase
// check replaced: an allowlisted file is served with its cache rule, anything else is a 404, and nobody but the owner
// reads it. The release folder holds invented files only.
import 'reflect-metadata'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AuthModule } from '@luismlorenzana/uma-server/auth'
import { Module, type DynamicModule, type INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { storyFilePath } from '@farm/domain'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { STORY_ALLOW, storyPackModule } from './story-pack'

const OWNER = 'owner@example.com'
const SHA = 'c0ffee12'.padEnd(64, '0')
const CAST = storyFilePath('cast', SHA)

/** The API's guard and the story route, as `AppModule` imports them, serving on a free port. */
async function serve(pack: DynamicModule): Promise<{ app: INestApplication; get: (path: string, token?: string) => Promise<Response> }> {
  class StoryRouteTest {}
  Module({
    imports: [
      AuthModule.forRoot({
        mode: 'enabled', allowedEmail: OWNER,
        verifyIdToken: async (token) => {
          if (token === 'owner-token') return { uid: 'owner', email: OWNER }
          if (token === 'other-token') return { uid: 'other', email: 'other@example.com' }
          throw new Error('invalid')
        },
      }),
      pack,
    ],
  })(StoryRouteTest)
  const app = await NestFactory.create(StoryRouteTest, { logger: false })
  app.setGlobalPrefix('api')
  await app.listen(0, '127.0.0.1')
  const { port } = (app.getHttpServer() as { address(): AddressInfo }).address()
  const get = (path: string, token?: string) => fetch(`http://127.0.0.1:${port}/api/content/${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  return { app, get }
}

let dir: string
let release: Awaited<ReturnType<typeof serve>>
let empty: Awaited<ReturnType<typeof serve>>

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'story-route-'))
  await mkdir(join(dir, 'content/story-release/story'), { recursive: true })
  await writeFile(join(dir, 'content/story-release/story.json'), '{"version":1}\n')
  await writeFile(join(dir, 'content/story-release', CAST), '{"invented":true}')
  await writeFile(join(dir, 'content/story-release/story/notes.json'), '{}')
  await writeFile(join(dir, 'content/story-release/notes.txt'), 'not served')
  // As the dev server runs it: the folder from the API's working directory, an empty bucket variable naming none.
  release = await serve(storyPackModule({ STORY_BUCKET: '' }, join(dir, 'apps/api')))
  // As production runs before the bucket: no bucket named, and no folder in the container.
  empty = await serve(storyPackModule({}, join(dir, 'container/srv/app')))
})
afterAll(async () => {
  await release?.app.close()
  await empty?.app.close()
  await rm(dir, { recursive: true, force: true }) // Only this freshly created folder.
})

describe('the story route, /api/content/… (F56 decision 2)', () => {
  it('serves the index fresh on every read, to the owner', async () => {
    const res = await release.get('story.json', 'owner-token')
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-cache')
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.json()).toEqual({ version: 1 })
  })

  it('serves a hash-named file of the release, cached for good', async () => {
    const res = await release.get(CAST, 'owner-token')
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, max-age=31536000, immutable')
    expect(await res.json()).toEqual({ invented: true })
  })

  it('refuses anything else with a 404: a file not hash-named, outside story/, of another kind or missing', async () => {
    for (const path of ['story/notes.json', 'notes.txt', 'story/cast.c0ffee12.webp', 'story/Cast.c0ffee12.json', 'story/cast.0000000g.json', 'story/ghost.12345678.json', 'story.json.bak', 'master/story.json']) {
      expect((await release.get(path, 'owner-token')).status, path).toBe(404)
    }
  })

  it('lets nobody but the owner in: 401 signed out or with a bad token, 403 for anyone else', async () => {
    for (const path of ['story.json', CAST, 'story/notes.json']) {
      expect((await release.get(path)).status).toBe(401)
      expect((await release.get(path, 'forged')).status).toBe(401)
      expect((await release.get(path, 'other-token')).status).toBe(403)
    }
  })

  it('answers 404 with no bucket and no folder, as production does before the bucket', async () => {
    expect((await empty.get('story.json', 'owner-token')).status).toBe(404)
    expect((await empty.get(CAST, 'owner-token')).status).toBe(404)
    expect((await empty.get('story.json')).status).toBe(401)
  })

  it("allows every name the release writes, and the index's path", () => {
    const allowed = (path: string) => STORY_ALLOW.some((rule) => (typeof rule === 'string' ? rule === path : new RegExp(`^(?:${rule.source})$`).test(path)))
    for (const name of ['cast', 'ties', 'household', 'uma-9000001', 'route-9000001', 'pair-9000001-9000002']) expect(allowed(storyFilePath(name, SHA)), name).toBe(true)
    expect(allowed('story.json')).toBe(true)
  })
})
