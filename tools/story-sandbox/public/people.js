// F40's story in the sandbox: the world bible, the cast in arrival order, each Uma's page with her route as a visible
// ladder (27 rungs: her arrival, friendship 1–10, the confession, romance 1–10, the proposal, the wedding, spouse 1, 3 and
// 5; F46), and
// the ties as one graph.
// Every name, picture and line comes from the private content/story/ at run time.
import { D, h, reviewDot, reviewPanel, stat } from './views.js'

const SVG = 'http://www.w3.org/2000/svg'
function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v))
  for (const kid of kids.flat(Infinity)) if (kid) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)))
  return el
}

export function indexStory(story) {
  D.story = story
  D.uma = new Map((story?.umas ?? []).map((u) => [u.id, u]))
  D.castOf = new Map((story?.cast?.data?.umas ?? []).map((u, i) => [u.characterId, { ...u, order: i + 1 }]))
  D.bibleOf = new Map((story?.bibles ?? []).map((b) => [b.data.characterId, b]))
  D.routeOf = new Map((story?.routes ?? []).map((r) => [r.data.characterId, r]))
  D.tiesOf = new Map()
  for (const t of story?.ties?.data?.ties ?? []) for (const id of [t.a, t.b]) D.tiesOf.set(id, [...(D.tiesOf.get(id) ?? []), t])
}
export const umaName = (id) => D.uma.get(id)?.name ?? id
export function face(id, cls = '') {
  const u = D.uma.get(id)
  if (u?.images?.face) return h('img', { class: `face ${cls}`, src: u.images.face, alt: u.name, loading: 'lazy' })
  return h('span', { class: `face initials ${cls}`, title: u?.name ?? id, text: (u?.name ?? '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2) })
}
const CALLING_COLOR = { farming: '#5f9a3c', foraging: '#2f6a34', fishing: '#3a7aa0', mining: '#6a5a4a', quarry: '#8a7a9a' }
const KIND_COLOR = { friends: '#4f8a3c', rivals: '#c4573a', mentor: '#7a5ac4', teammates: '#3a7aa0', sisters: '#c08a22', other: '#8a8478' }
const calling = (c) => h('span', { class: 'chip dot', vars: { '--c': CALLING_COLOR[c] }, text: c })
const FESTIVAL = { 'flower-show': 'the Flower Show', 'fishing-derby': 'the Fishing Derby', 'cooking-contest': 'the Cooking Contest', 'animal-show': 'the Animal Show', 'harvest-cup': 'the Harvest Cup' }
export function arrivalWords(a) {
  if (!a) return ''
  if (a.kind === 'opening') return 'The opening: one of the first three'
  if (a.kind === 'chapter') return `Chapter ${a.chapter}’s recruit`
  if (a.kind === 'festival') return `At ${FESTIVAL[a.festival] ?? a.festival}${a.year ? `, year ${a.year}` : ''}`
  if (a.kind === 'beds') return `When the Dorm reaches level ${a.dormLevel}`
  return `After ${a.after}`
}
const issuesList = (issues) => (issues?.length ? h('ul', { class: 'issues' }, issues.map((i) => h('li', { text: i }))) : null)
const noStory = () => h('div', { class: 'note-box' }, h('b', { text: 'No story yet. ' }), 'F40’s private files go in content/story/: world.md, cast.json, ties.json, then umas/, routes/ and pairs/.')

/** Where the story stands, layer by layer (RS17). */
function layers() {
  const st = D.story, n = st.umas.length
  const count = (list) => list.reduce((k, x) => k + x.issues.length, 0)
  const l1 = [st.world, st.cast, st.ties].filter(Boolean).length
  return h('div', { class: 'summary' },
    stat(`${l1}/3`, `layer 1: the world, the cast, the ties${st.cast || st.ties ? ` · ${count([st.cast, st.ties].filter(Boolean))} checks` : ''}`),
    stat(`${st.bibles.length}/${n}`, `layer 2: bibles${st.bibles.length ? ` · ${count(st.bibles)} checks` : ''}`),
    stat(`${st.routes.length}/3`, `layer 3: pilot routes${st.routes.length ? ` · ${count(st.routes)} checks` : ''}`),
    stat(st.pairs.length, 'pair conversations'),
    stat(st.ties?.data?.ties?.length ?? 0, 'ties'),
    stat(n, `Umas in the export (pack ${st.pack?.id ?? '—'})`),
  )
}

// ── Characters ───────────────────────────────────────────────────────────────
export function charactersView() {
  const st = D.story
  if (!st?.cast) return h('div', {}, h('h1', { text: 'Characters' }), noStory())
  const cast = st.cast.data
  return h('div', {},
    h('h1', { text: 'Characters' }),
    h('p', { class: 'muted', text: 'F40’s cast: the SS Umas of the Playable Umas board, in the order they arrive on the farm. Each is a grown woman with a life of her own (RS3); click one for her page, her ties and her route.' }),
    layers(),
    st.cast.issues.length ? h('div', { class: 'error-box' }, h('b', { text: 'cast.json' }), issuesList(st.cast.issues)) : null,
    h('div', { class: 'cast-list' }, cast.umas.map((u, i) => {
      const ties = D.tiesOf.get(u.characterId) ?? []
      return h('a', { class: `cast-row ${u.arrives.kind === 'opening' ? 'opening' : ''}`, href: `#/c/${encodeURIComponent(u.characterId)}` },
        h('span', { class: 'order', text: i + 1 }), face(u.characterId, 'lg'),
        h('div', { class: 'cast-text' },
          h('div', { class: 'row' }, h('b', { text: umaName(u.characterId) }), calling(u.calling), h('span', { class: 'muted small', text: arrivalWords(u.arrives) }), reviewDot(`cast/${u.characterId}`)),
          h('p', { class: 'small', text: u.paragraph }),
          h('div', { class: 'row tiny' }, ties.map((t) => { const other = t.a === u.characterId ? t.b : t.a; return h('span', { class: 'tie-chip', vars: { '--c': KIND_COLOR[t.kind] }, title: `${t.kind}, strength ${t.strength}` }, face(other, 'xs'), `${umaName(other)} ${'●'.repeat(t.strength)}`) })),
        ))
    })),
  )
}

// ── One Uma ──────────────────────────────────────────────────────────────────
export function characterView(id, onReview) {
  const st = D.story
  if (!st?.cast) return noStory()
  const entry = D.castOf.get(id), uma = D.uma.get(id)
  if (!entry) return h('p', { class: 'empty', text: 'Not in the cast.' })
  const bible = D.bibleOf.get(id), ties = [...(D.tiesOf.get(id) ?? [])].sort((a, b) => b.strength - a.strength)
  const list = st.cast.data.umas, prev = list[entry.order - 2], next = list[entry.order]
  return h('div', {},
    h('div', { class: 'char' },
      h('div', { class: 'char-art' }, uma?.images?.art ? h('img', { src: uma.images.art, alt: uma.name }) : face(id, 'xl')),
      h('div', { class: 'stack' },
        h('div', { class: 'row' }, h('span', { class: 'chip', text: `#${entry.order} to arrive` }), calling(entry.calling), h('span', { class: 'chip', text: arrivalWords(entry.arrives) }), entry.outfitId ? h('span', { class: 'chip', text: `Outfit ${entry.outfitId}${uma?.outfit?.title ? ` · ${uma.outfit.title}` : ''}` }) : null),
        h('h1', { text: umaName(id) }),
        h('p', { class: 'logline', text: entry.paragraph }),
        h('div', { class: 'row small' }, prev ? h('a', { href: `#/c/${prev.characterId}`, text: `← ${umaName(prev.characterId)}` }) : null, next ? h('a', { href: `#/c/${next.characterId}`, text: `${umaName(next.characterId)} →` }) : null),
        h('div', { class: 'panel' }, h('div', { class: 'row' }, h('h3', { text: 'Her route' }), h('span', { class: 'muted small', text: bible ? `umas/${id}.json` : 'The bible (layer 2) writes these rungs' })), ladder(id, bible)),
        bible ? biblePanel(bible) : null,
        h('div', { class: 'panel' }, h('h3', { text: `Her ties · ${ties.length}` }),
          ties.length ? h('div', { class: 'stack' }, ties.map((t) => {
            const other = t.a === id ? t.b : t.a
            return h('div', { class: 'rel' },
              h('a', { class: 'rel-who', href: `#/c/${other}` }, face(other), h('div', {}, h('b', { text: umaName(other) }), h('span', { class: 'muted small', text: `${t.kind} · ${'●'.repeat(t.strength)}${'○'.repeat(3 - t.strength)}` }))),
              h('div', { class: 'rel-body' }, h('p', { text: t.line }), h('p', { class: 'small muted', text: t.history })))
          })) : h('p', { class: 'muted', text: 'No ties yet.' })),
      ),
    ),
    h('div', { class: 'section-head' }, h('h2', { text: 'Review' })),
    reviewPanel(`cast/${id}`, [...(bible?.issues ?? [])], bible ? bible.file : 'content/story/cast.json', onReview, 'No problems.'),
  )
}

/** Her 27 rungs as a ladder you can see (D42, D43, F46): her arrival scene, friendship 1–10, the confession, romance 1–10,
 * the proposal, the wedding, and the spouse ladder's three after it. */
function ladder(id, bible) {
  const beats = new Map((bible?.data.route ?? []).map((b) => [b.id, b]))
  const route = D.routeOf.get(id)
  const scripted = new Set((route?.data.events ?? []).map((e) => e.id))
  const rung = (rid, label, cls) => {
    const b = beats.get(rid)
    return h('div', { class: `rung ${cls} ${b ? 'set' : ''} ${scripted.has(rid) ? 'scripted' : ''}`, title: b ? `${b.beat}` : 'To author' },
      h('span', { class: 'rung-label', text: label }),
      h('span', { class: 'rung-text', text: b ? b.beat : 'To author' }),
      b ? h('span', { class: 'rung-meta', text: [b.place, b.together?.kind === 'date' ? `date: ${b.together.game}` : b.together?.kind === 'work' ? `work: ${b.together.activity}` : b.together?.kind, b.unlock ? `unlocks ${b.unlock.good ?? b.unlock.place ?? b.unlock.perk}` : ''].filter(Boolean).join(' · ') }) : null,
      b?.hint ? h('span', { class: 'rung-meta', text: `Opens: ${b.hint}` }) : null)
  }
  return h('div', {},
    h('div', { class: 'ladder-arrival' }, rung('arrival', 'Arrival', 'key')),
    h('div', { class: 'ladder' },
      h('div', { class: 'ladder-col' }, h('h4', { text: 'Friendship ♥ 1–10' }), Array.from({ length: 10 }, (_, i) => rung(`f${i + 1}`, `♥ ${i + 1}`, 'friend'))),
      h('div', { class: 'ladder-mid' }, rung('confession', 'Confession', 'key'), rung('proposal', 'Proposal', 'key'), rung('wedding', 'Wedding', 'key')),
      h('div', { class: 'ladder-col' }, h('h4', { text: 'Romance ❤ 1–10' }), Array.from({ length: 10 }, (_, i) => rung(`r${i + 1}`, `❤ ${i + 1}`, 'romance'))),
    ),
    h('h4', { class: 'spouse-head', text: 'Spouse ✦ after the wedding' }),
    h('div', { class: 'ladder-spouse' }, ['s1', 's3', 's5'].map((rid) => rung(rid, `✦ ${rid.slice(1)}`, 'spouse'))),
  )
}

function biblePanel(bible) {
  const b = bible.data
  return h('div', { class: 'panel' }, h('h3', { text: 'Her bible' }),
    h('dl', { class: 'kv' },
      ...[['Now', b.now], ['Why the farm', b.whyTheFarm], ['Dream', b.dream], ['Blurb', b.blurb], ['Favourite work', b.favouriteLine], ['Season, festival', `${b.season}, ${b.festival}`],
        ['Loved', b.gifts?.loved], ['Liked', b.gifts?.liked?.join(', ')], ['Disliked', b.gifts?.disliked?.join(', ')], ['Laughs at', b.laughs], ['Hurt by', b.hurts]]
        .flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v ?? '—' })])),
    issuesList(bible.issues))
}

// ── Relationships ────────────────────────────────────────────────────────────
export function relationshipsView(onReview) {
  const st = D.story
  if (!st?.ties) return h('div', {}, h('h1', { text: 'Relationships' }), noStory())
  const ties = st.ties.data.ties
  const kinds = [...new Set(ties.map((t) => t.kind))]
  return h('div', {},
    h('h1', { text: 'Relationships' }),
    h('p', { class: 'muted', text: 'The cast’s ties as one graph (RS11): who are friends, rivals, mentor and protégée, teammates or sisters in all but name, drawn from their real careers or born on the farm. The thicker the line, the stronger the tie; each Uma’s two strongest get authored pair conversations (RS12).' }),
    h('div', { class: 'two' },
      h('div', { class: 'panel' }, ring(ties), h('div', { class: 'row small' }, kinds.map((k) => h('span', { class: 'chip dot', vars: { '--c': KIND_COLOR[k] }, text: `${k} · ${ties.filter((t) => t.kind === k).length}` })))),
      h('div', { class: 'panel' }, h('h3', { text: 'Each Uma’s closest two' }), h('table', { class: 'table' },
        st.cast.data.umas.map((u) => {
          const two = [...(D.tiesOf.get(u.characterId) ?? [])].sort((a, b) => b.strength - a.strength).slice(0, 2)
          return h('tr', {}, h('td', {}, h('a', { href: `#/c/${u.characterId}` }, face(u.characterId, 'sm'), umaName(u.characterId))),
            h('td', { class: 'small' }, two.map((t) => { const o = t.a === u.characterId ? t.b : t.a; return h('div', {}, `${umaName(o)} `, h('span', { class: 'muted', text: `${t.kind} ${'●'.repeat(t.strength)}` })) })))
        }))),
    ),
    st.ties.issues.length ? h('div', { class: 'error-box' }, h('b', { text: 'ties.json' }), issuesList(st.ties.issues)) : null,
    h('div', { class: 'section-head' }, h('h2', { text: `Every tie · ${ties.length}` })),
    h('div', { class: 'panel' }, h('table', { class: 'table rels' },
      h('tr', {}, ['Between', 'Kind', 'Strength', 'On the farm', 'From'].map((x) => h('th', { text: x }))),
      [...ties].sort((a, b) => b.strength - a.strength).map((t) => h('tr', {},
        h('td', {}, h('div', { class: 'pair' }, h('a', { href: `#/c/${t.a}` }, face(t.a, 'sm'), umaName(t.a)), h('span', { class: 'muted', text: '↔' }), h('a', { href: `#/c/${t.b}` }, face(t.b, 'sm'), umaName(t.b)))),
        h('td', {}, h('span', { class: 'chip dot', vars: { '--c': KIND_COLOR[t.kind] }, text: t.kind })),
        h('td', { text: '●'.repeat(t.strength) + '○'.repeat(3 - t.strength) }),
        h('td', { class: 'small', text: t.line }), h('td', { class: 'small muted', text: t.history }))))),
    h('div', { class: 'section-head' }, h('h2', { text: 'Review' })),
    reviewPanel('ties', st.ties.issues, st.ties.file, onReview, 'No problems: every tie between two Umas of the cast, each Uma with at least two.'),
  )
}

/** The cast in a ring, in arrival order, their ties drawn between them. */
function ring(ties) {
  const umas = D.story.cast.data.umas.map((u) => u.characterId)
  const W = 600, C = W / 2, R = 240, F = 42
  const at = new Map(umas.map((id, i) => { const t = (i / umas.length) * Math.PI * 2 - Math.PI / 2; return [id, [C + R * Math.cos(t), C + R * Math.sin(t)]] }))
  return s('svg', { viewBox: `0 0 ${W} ${W}`, class: 'ring', role: 'img', 'aria-label': `${umas.length} Umas and ${ties.length} ties` },
    s('circle', { cx: C, cy: C, r: R, class: 'orbit' }),
    ties.filter((t) => at.has(t.a) && at.has(t.b)).map((t) => {
      const [x1, y1] = at.get(t.a), [x2, y2] = at.get(t.b)
      return s('path', { d: `M${x1},${y1} Q${C},${C} ${x2},${y2}`, class: 'edge', stroke: KIND_COLOR[t.kind], 'stroke-width': 1 + t.strength * 1.3 }, s('title', {}, `${umaName(t.a)} and ${umaName(t.b)}: ${t.kind}. ${t.line}`))
    }),
    umas.map((id) => {
      const [x, y] = at.get(id), u = D.uma.get(id)
      return s('a', { href: `#/c/${id}` },
        s('clipPath', { id: `clip-${id}` }, s('circle', { cx: x, cy: y, r: F / 2 })),
        s('circle', { cx: x, cy: y, r: F / 2 + 2, class: 'node' }),
        u?.images?.face ? s('image', { href: u.images.face, x: x - F / 2, y: y - F / 2, width: F, height: F, 'clip-path': `url(#clip-${id})` }) : null,
        s('title', {}, umaName(id)))
    }),
  )
}

// ── The world bible ──────────────────────────────────────────────────────────
export function worldView(onReview) {
  const st = D.story
  if (!st?.world) return h('div', {}, h('h1', { text: 'The world' }), noStory())
  return h('div', {}, layers(), h('div', { class: 'panel prose md' }, markdown(st.world)),
    h('div', { class: 'section-head' }, h('h2', { text: 'Review' })),
    reviewPanel('world', [], 'content/story/world.md', onReview, 'The world bible has no automatic checks: your read is the check.'))
}

/** A small Markdown reader for the world bible: headings, quotes, lists, tables, bold, italics and code. */
function markdown(text) {
  const inline = (line) => {
    const out = []
    for (const part of line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)) {
      if (!part) continue
      if (part.startsWith('**')) out.push(h('b', { text: part.slice(2, -2) }))
      else if (part.startsWith('`')) out.push(h('code', { text: part.slice(1, -1) }))
      else if (part.startsWith('*') && part.length > 2) out.push(h('i', { text: part.slice(1, -1) }))
      else out.push(part)
    }
    return out
  }
  const lines = text.split(/\r?\n/), out = []
  for (let i = 0; i < lines.length;) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    const head = line.match(/^(#{1,3}) (.*)/)
    if (head) { out.push(h(`h${head[1].length}`, {}, inline(head[2]))); i++; continue }
    if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) { if (!/^\|[\s|:-]+\|$/.test(lines[i])) rows.push(lines[i].slice(1, -1).split('|').map((c) => c.trim())); i++ }
      out.push(h('table', { class: 'table' }, rows.map((r, k) => h('tr', {}, r.map((c) => h(k ? 'td' : 'th', {}, inline(c)))))))
      continue
    }
    if (/^\s*([-*]|\d+\.) /.test(line)) {
      const ordered = /^\s*\d+\. /.test(line), items = []
      while (i < lines.length && (/^\s*([-*]|\d+\.) /.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*([-*]|\d+\.) /.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.) /, ''))
        else items[items.length - 1] += ' ' + lines[i].trim()
        i++
      }
      out.push(h(ordered ? 'ol' : 'ul', { class: 'list' }, items.map((x) => h('li', {}, inline(x)))))
      continue
    }
    if (line.startsWith('>')) {
      const quote = []
      while (i < lines.length && lines[i].startsWith('>')) { quote.push(lines[i].replace(/^>\s?/, '')); i++ }
      out.push(h('blockquote', {}, quote.join(' ').split(/\s{2,}/).map((p) => h('p', {}, inline(p)))))
      continue
    }
    const para = []
    while (i < lines.length && lines[i].trim() && !/^(#|\||>|\s*([-*]|\d+\.) )/.test(lines[i])) { para.push(lines[i].trim()); i++ }
    out.push(h('p', {}, inline(para.join(' '))))
  }
  return out
}
