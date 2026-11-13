// Renders the kept docs to desktop HTML pages in docs/pages/: each page is its Markdown with a contents column, so a page
// never drifts from its doc. `pnpm docs:update` runs it after the live blocks; `node scripts/docs-pages.mjs` runs it alone.
// No dependencies: it reads the Markdown the docs use (headings, paragraphs, lists, tables, code, quotes, links).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(ROOT, 'docs')
const OUT = join(DOCS, 'pages')

/** Each doc with a page: its path under docs/, the page's name, and its title in the bar. */
export const PAGES = [
  { doc: 'roadmap.md', page: 'roadmap.html', title: 'Roadmap' },
  { doc: 'game-mechanics.md', page: 'game-mechanics.html', title: 'Game mechanics' },
  { doc: 'technical/architecture.md', page: 'architecture.html', title: 'Architecture' },
  { doc: 'technical/infrastructure.md', page: 'infrastructure.html', title: 'Infrastructure' },
  { doc: 'handoff/README.md', page: 'handoff.html', title: 'Open work' },
  { doc: 'design/progression.md', page: 'progression.html', title: 'Progression' },
  { doc: 'design/kit-farm.md', page: 'kit-farm.html', title: 'Farm kit' },
]

const REPO = 'https://github.com/luismlorenzana/uma-farm/blob/main/'

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** GitHub's heading anchors: lower case, punctuation dropped, spaces to hyphens. */
export function slug(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-')
}

/** A link from a doc, as the page should hold it: a doc with a page goes to that page, any other repo path to GitHub. */
function linkTarget(href, fromDoc) {
  if (/^[a-z]+:/i.test(href) || href.startsWith('#')) return href
  const [path, hash] = href.split('#')
  const target = posix.normalize(posix.join(posix.dirname(fromDoc), path))
  const page = PAGES.find((p) => p.doc === target)
  if (page) return page.page + (hash ? `#${hash}` : '')
  if (target.startsWith('pages/')) return target.slice('pages/'.length) + (hash ? `#${hash}` : '')
  return REPO + posix.normalize(posix.join('docs', target)) + (hash ? `#${hash}` : '')
}

/** Inline Markdown: code, links, bold, italics. Code spans are kept apart so nothing inside them is read. */
export function inline(text, fromDoc = 'x.md') {
  const codes = []
  let s = text.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`)
  s = escape(s)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${escape(linkTarget(href.replace(/&amp;/g, '&'), fromDoc))}">${label}</a>`)
  s = s.replace(/\*\*((?:[^*]|\*[^*\s][^*]*\*)+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^\w*])\*([^*\s][^*]*)\*(?!\w)/g, '$1<em>$2</em>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escape(codes[Number(i)])}</code>`)
}

const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'))

/** Markdown to HTML, and the headings for the contents column. */
export function render(md, fromDoc = 'x.md') {
  const lines = md.replace(/<!--[\s\S]*?-->\n?/g, '').split('\n')
  const out = []
  const headings = []
  const seen = new Map()
  let i = 0
  const para = []
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '), fromDoc)}</p>`); para.length = 0 } }

  /** A list starting at line i, indented `indent` spaces: its items, each with its own nested lists and lines. */
  const list = (indent) => {
    const ordered = /^\s*\d+\.\s/.test(lines[i])
    const marker = ordered ? '\\d+\\.' : '[-*]'
    const html = [ordered ? '<ol>' : '<ul>']
    while (i < lines.length) {
      const m = lines[i].match(new RegExp(`^(\\s*)(${marker})\\s+(.*)$`))
      if (!m || m[1].length !== indent) break
      const text = [m[3]]
      const inner = []
      i++
      while (i < lines.length && lines[i].trim() !== '') {
        const sub = lines[i].match(/^(\s*)([-*]|\d+\.)\s+/)
        if (sub && sub[1].length > indent) { inner.push(list(sub[1].length)); continue }
        if (sub && sub[1].length <= indent) break
        if (/^\s+/.test(lines[i])) { text.push(lines[i].trim()); i++; continue }
        break
      }
      // A blank line followed by more of the same list keeps it going.
      if (i < lines.length - 1 && lines[i].trim() === '' && new RegExp(`^\\s{${indent}}${marker}\\s`).test(lines[i + 1])) i++
      html.push(`<li>${inline(text.join(' '), fromDoc)}${inner.join('')}</li>`)
    }
    html.push(ordered ? '</ol>' : '</ul>')
    return html.join('')
  }

  while (i < lines.length) {
    const line = lines[i]
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flush()
      const level = h[1].length
      const base = slug(h[2])
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      const id = n ? `${base}-${n}` : base
      headings.push({ level, id, text: inline(h[2], fromDoc) })
      out.push(`<h${level} id="${id}">${inline(h[2], fromDoc)}</h${level}>`)
      i++
      continue
    }
    if (line.startsWith('```')) {
      flush()
      const body = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++])
      i++
      out.push(`<pre><code>${escape(body.join('\n'))}</code></pre>`)
      continue
    }
    if (/^\|.*\|\s*$/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      flush()
      const head = cells(line)
      i += 2
      const rows = []
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]))
      out.push(`<div class="table"><table><thead><tr>${head.map((c) => `<th>${inline(c, fromDoc)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, fromDoc)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    if (/^>\s?/.test(line)) {
      flush()
      const body = []
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''))
      out.push(`<blockquote>${render(body.join('\n'), fromDoc).html}</blockquote>`)
      continue
    }
    if (/^(\s*)([-*]|\d+\.)\s+/.test(line) && para.length === 0) {
      out.push(list(line.match(/^(\s*)/)[1].length))
      continue
    }
    if (/^---+\s*$/.test(line)) { flush(); out.push('<hr>'); i++; continue }
    if (line.trim() === '') { flush(); i++; continue }
    para.push(line.trim())
    i++
  }
  flush()
  return { html: out.join('\n'), headings }
}

const STYLE = `
:root{--bg:#f7f5f0;--panel:#fff;--ink:#23211c;--muted:#6b665c;--line:#e3ddd1;--accent:#2f6b4f;--accent-soft:#e6f0ea;--code:#f1ede4}
@media (prefers-color-scheme:dark){:root{--bg:#171a17;--panel:#1f231f;--ink:#e8e6df;--muted:#a19d92;--line:#333a33;--accent:#7fc29b;--accent-soft:#223329;--code:#2a2f2a}}
*{box-sizing:border-box}html{scroll-padding-top:72px}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif}
header{position:sticky;top:0;z-index:2;display:flex;gap:20px;align-items:center;padding:12px 28px;background:var(--panel);border-bottom:1px solid var(--line)}
header b{font-size:15px;margin-right:8px}header nav{display:flex;gap:4px;flex-wrap:wrap}
header a{color:var(--muted);text-decoration:none;font-size:14px;padding:4px 10px;border-radius:999px}
header a.on{background:var(--accent-soft);color:var(--accent);font-weight:600}
.wrap{display:grid;grid-template-columns:280px minmax(0,1fr);gap:40px;max-width:1320px;margin:0 auto;padding:28px}
aside{position:sticky;top:76px;align-self:start;max-height:calc(100vh - 100px);overflow:auto;font-size:13.5px;padding-right:8px}
aside a{display:block;color:var(--muted);text-decoration:none;padding:3px 0;line-height:1.35}aside a:hover{color:var(--accent)}
aside .l2{font-weight:600;color:var(--ink);margin-top:10px}aside .l3{padding-left:12px}aside .l4{padding-left:24px;font-size:12.5px}
main{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:36px 48px;max-width:980px}
h1{font-size:30px;margin:0 0 18px}h2{font-size:23px;margin:44px 0 12px;padding-top:18px;border-top:2px solid var(--line)}
h3{font-size:18.5px;margin:30px 0 8px}h4{font-size:16px;margin:22px 0 6px;color:var(--muted)}
h5{font-size:14.5px;margin:18px 0 4px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
a{color:var(--accent)}code{background:var(--code);padding:1px 5px;border-radius:5px;font-size:.9em}
pre{background:var(--code);padding:14px 16px;border-radius:10px;overflow:auto}pre code{background:none;padding:0}
.table{overflow:auto;margin:14px 0}table{border-collapse:collapse;width:100%;font-size:14.5px}
th{background:var(--accent-soft);text-align:left}th,td{border:1px solid var(--line);padding:7px 10px;vertical-align:top}
blockquote{margin:16px 0;padding:10px 18px;border-left:4px solid var(--accent);background:var(--accent-soft);border-radius:0 10px 10px 0}
li{margin:3px 0}
@media (max-width:900px){.wrap{grid-template-columns:1fr;padding:16px}aside{display:none}main{padding:22px 18px}header{padding:10px 16px}}
`

/** One doc's page. */
export function page(entry, md) {
  const { html, headings } = render(md, entry.doc)
  const nav = PAGES.map((p) => `<a href="${p.page}"${p === entry ? ' class="on"' : ''}>${p.title}</a>`).join('')
  const toc = headings.filter((h) => h.level >= 2 && h.level <= 4).map((h) => `<a class="l${h.level}" href="#${h.id}">${h.text.replace(/<[^>]+>/g, '')}</a>`).join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>uma-farm · ${entry.title}</title><style>${STYLE}</style></head>
<body><header><b>uma-farm</b><nav>${nav}</nav></header>
<div class="wrap"><aside>${toc}</aside><main>
${html}
<p style="color:var(--muted);font-size:13px;margin-top:48px">Made from <a href="${REPO}docs/${entry.doc}">docs/${entry.doc}</a> by <code>scripts/docs-pages.mjs</code>. Edit the Markdown, then run <code>pnpm docs:update</code>.</p>
</main></div></body></html>
`
}

export function writePages() {
  mkdirSync(OUT, { recursive: true })
  for (const entry of PAGES) {
    const md = readFileSync(join(DOCS, entry.doc), 'utf8')
    writeFileSync(join(OUT, entry.page), page(entry, md))
  }
  return PAGES.map((p) => relative(ROOT, join(OUT, p.page)))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const file of writePages()) console.log(`wrote ${file}`)
}
