// Keep original-game content out of Git, including forced additions (copied from uma-rpg's guard).
// Master data, art, stories and review work live in the ignored content/ folder locally and in private buckets.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const git = (cwd, args, options = {}) => execFileSync('git', args, { cwd, encoding: 'utf8', ...options })
const privateContentIsUntracked = cwd => assert.equal(git(cwd, ['ls-files', '-z', '--', 'content']), '',
  'Original content must never be tracked. Remove content/ from the index; preserve the local files.')

test('no private content is tracked in the repository index', () => privateContentIsUntracked(root))

test('master data, art, review work and private content all remain ignored', () => {
  const paths = [
    'content/release/cast/unit.png',
    'content/release/data/art.0a1b2c3d.json',
    'content/review/sample/key.png',
    'content/authoring/private/notes.json',
    'content/parcels/fixtures/real-outfit.json',
  ]
  const ignored = git(root, ['check-ignore', '--no-index', '--stdin'], { input: paths.join('\n') + '\n' }).trimEnd().split('\n')
  assert.deepEqual(ignored, paths, 'Private content must stay under the ignored content/ folder')
})

test('the guard detects even a forced private-image addition', async t => {
  const folder = await mkdtemp(join(tmpdir(), 'private-content-guard-'))
  t.after(() => rm(folder, { recursive: true, force: true }))
  git(folder, ['init', '-q'])
  await writeFile(join(folder, '.gitignore'), '/content/\n')
  await mkdir(join(folder, 'content'))
  await writeFile(join(folder, 'content/synthetic.png'), 'Synthetic fixture, not actual art')
  privateContentIsUntracked(folder)
  git(folder, ['add', '-f', '--', 'content/synthetic.png'])
  assert.throws(() => privateContentIsUntracked(folder), /Original content must never be tracked/)
})
