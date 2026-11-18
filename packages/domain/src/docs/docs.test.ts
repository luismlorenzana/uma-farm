// Copied from uma-rpg packages/domain/src/docs/docs.test.ts at 30a322a, with its Wilds-only parts cut.
// Keeps the live docs (docs/game-mechanics.md) true to the rules: every `<!-- live:<key> -->` block must equal what `render.ts`
// makes of the code today. When a rule changes, run `pnpm docs:update` (UPDATE_DOCS=1) to rewrite the blocks.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderBlock } from './render'

const ROOT = join(__dirname, '..', '..', '..', '..')
/** The documents with live blocks. */
const DOCS = [join(ROOT, 'docs', 'game-mechanics.md')]
const BLOCK = /<!-- live:([a-z0-9-]+) -->\n[\s\S]*?<!-- \/live -->/g

/** A doc with every live block rendered fresh; unknown keys are reported. */
function refresh(text: string, unknown: string[]): string {
  return text.replace(BLOCK, (_, key: string) => {
    const body = renderBlock(key)
    if (body === null) { unknown.push(key); return `<!-- live:${key} -->\n<!-- /live -->` }
    return `<!-- live:${key} -->\n${body}\n<!-- /live -->`
  })
}

describe('live docs', () => {
  const files = DOCS

  it('has a game manual with live blocks', () => {
    expect(files.length).toBeGreaterThanOrEqual(1)
    expect(files.some((f) => readFileSync(f, 'utf8').includes('<!-- live:'))).toBe(true)
  })

  it.each(files.map((f) => [relative(ROOT, f), f]))('%s matches the rules (run `pnpm docs:update` to update)', (_, file) => {
    const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
    const unknown: string[] = []
    const fresh = refresh(text, unknown)
    expect(unknown, 'unknown live blocks').toEqual([])
    if (process.env.UPDATE_DOCS && fresh !== text) writeFileSync(file, fresh)
    else expect(fresh === text, `${relative(ROOT, file)} is stale: run \`pnpm docs:update\``).toBe(true)
  })
})
