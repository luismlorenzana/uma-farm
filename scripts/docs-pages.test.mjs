import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { inline, page, PAGES, render, slug } from './docs-pages.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

test('anchors follow GitHub: lower case, punctuation dropped, spaces to hyphens', () => {
  assert.equal(slug('Part 1 — The farm’s days and work'), 'part-1--the-farms-days-and-work')
  assert.equal(slug('The `night`, step 8'), 'the-night-step-8')
})

test('inline Markdown: code is kept whole, links to docs with a page go to the page', () => {
  assert.equal(inline('`a **b**` and **c**'), '<code>a **b**</code> and <strong>c</strong>')
  assert.equal(inline('[mech](game-mechanics.md#the-fields)', 'roadmap.md'), '<a href="game-mechanics.html#the-fields">mech</a>')
  assert.equal(inline('[pkt](handoff/tasks/F9-kit-farm.md)', 'roadmap.md'), '<a href="https://github.com/luismlorenzana/uma-farm/blob/main/docs/handoff/tasks/F9-kit-farm.md">pkt</a>')
  assert.equal(inline('[site](https://uma-farm.web.app)'), '<a href="https://uma-farm.web.app">site</a>')
})

test('blocks: headings with ids, tables, nested lists, code, quotes; live markers dropped', () => {
  const { html, headings } = render([
    '## A', '', '<!-- live:x -->', '| k | v |', '|---|---|', '| 1 | `a\\|b` |', '<!-- /live -->', '',
    '- one', '  - nested', '- two', '  more', '', '1. first', '2. second', '', '```text', '<x>', '```', '', '> note', '## A', '##### Five',
  ].join('\n'))
  assert.deepEqual(headings.map((h) => h.id), ['a', 'a-1', 'five'])
  assert.match(html, /<h5 id="five">Five<\/h5>/)
  assert.match(html, /<table><thead><tr><th>k<\/th><th>v<\/th><\/tr><\/thead><tbody><tr><td>1<\/td>/)
  assert.match(html, /<ul><li>one<ul><li>nested<\/li><\/ul><\/li><li>two more<\/li><\/ul>/)
  assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/)
  assert.match(html, /<pre><code>&lt;x&gt;<\/code><\/pre>/)
  assert.match(html, /<blockquote><p>note<\/p><\/blockquote>/)
  assert.doesNotMatch(html, /live:/)
})

test('every page has its doc, and each page is current', () => {
  for (const entry of PAGES) {
    const doc = join(ROOT, 'docs', entry.doc)
    assert.ok(existsSync(doc), `docs/${entry.doc} exists`)
    const built = join(ROOT, 'docs', 'pages', entry.page)
    assert.ok(existsSync(built), `docs/pages/${entry.page} exists`)
    assert.equal(readFileSync(built, 'utf8'), page(entry, readFileSync(doc, 'utf8')), `docs/pages/${entry.page} is stale: run \`pnpm docs:update\``)
  }
})
