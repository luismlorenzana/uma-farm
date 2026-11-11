#!/usr/bin/env node
// Copies the cast pack into the farm's private content so the sandbox can show the Umas' faces and art beside F40's
// files: the newest pack uma-quest made from the Studio's tier export, and the images it lists (never downloaded again).
//
//   node tools/story-sandbox/import-pack.mjs [uma-quest's content/stories folder]
//
// The default source is ../uma-quest/content/stories (or UMA_QUEST_STORIES); the target is content/story/pack/ here (or
// UMA_FARM_CONTENT). Both are ignored by git.
import { copyFile, mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCastPack } from './lib/pack.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const source = resolve(process.argv[2] ?? process.env.UMA_QUEST_STORIES ?? join(repo, '../uma-quest/content/stories'))
const target = resolve(process.env.UMA_FARM_CONTENT ?? join(repo, 'content/story'))

const packs = []
for (const name of await readdir(join(source, 'packs')).catch(() => [])) {
  try { packs.push({ name, pack: parseCastPack(JSON.parse(await readFile(join(source, 'packs', name, 'pack.json'), 'utf8'))) }) } catch { /* not a pack */ }
}
if (!packs.length) throw new Error(`No cast pack in ${join(source, 'packs')}: import the Studio's tier export in uma-quest first (pnpm stories:import).`)
packs.sort((a, b) => String(b.pack.exportedAt).localeCompare(String(a.pack.exportedAt)))
const { name, pack } = packs[0]

const dir = join(target, 'pack', pack.id)
await mkdir(join(dir, 'images'), { recursive: true })
let copied = 0, missing = 0
for (const path of new Set(pack.characters.flatMap((c) => Object.values(c.images ?? {})))) {
  try { await copyFile(join(source, 'packs', name, path), join(dir, path)); copied++ } catch { missing++ }
}
await writeFile(join(dir, 'pack.json.part'), JSON.stringify(pack, null, 2) + '\n')
await rename(join(dir, 'pack.json.part'), join(dir, 'pack.json'))
console.log(`Cast pack ${pack.id}: ${pack.characters.length} characters, ${copied} images${missing ? ` (${missing} missing)` : ''} → ${dir}`)
