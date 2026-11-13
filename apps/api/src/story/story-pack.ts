// The story pack's route: uma-server's `PrivatePackModule` at `/api/content/…`, where
// uma-kit's content client reads private packs (as uma-rpg's and uma-quest's do), behind the owner guard on its own
// controller. It serves an allowlist only: the index `story.json`, revalidated on every read, and the release's
// hash-named files, cached for good. Production reads the private bucket `STORY_BUCKET`; locally `STORY_DIR`, the ignored
// `content/story-release/` that `pnpm story:release` writes. With no bucket named and no folder there (production before
// the bucket, every container), every path answers 404.
import { resolve } from 'node:path'
import { PrivatePackModule, type PackAllow } from '@luismlorenzana/uma-server/content'
import type { DynamicModule } from '@nestjs/common'

/** What the route serves: `story.json`, and `story/<name>.<hash8>.json` (`scripts/story/release.mjs`'s
 * names). Character art's pattern joins it with that art. */
export const STORY_ALLOW: PackAllow = ['story.json', /story\/[a-z0-9]+(-[a-z0-9]+)*\.[a-f0-9]{8}\.json/]

/** The route's module, read from the environment: the bucket when one is named (an empty variable names none), else the
 * folder, relative to the API's working directory. */
export function storyPackModule(env: Record<string, string | undefined> = process.env, cwd = process.cwd()): DynamicModule {
  return PrivatePackModule.forRoot({
    route: 'content',
    bucket: env.STORY_BUCKET || undefined,
    dir: resolve(cwd, env.STORY_DIR || '../../content/story-release'),
    allow: STORY_ALLOW,
  })
}
