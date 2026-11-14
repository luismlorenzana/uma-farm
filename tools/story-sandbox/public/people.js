// The authored story in the sandbox: the world bible, the cast in its order, each Uma's page with her route as a
// visible ladder (27 rungs: her arrival, friendship 1–10, the confession, romance 1–10, the proposal, the wedding,
// spouse 1, 3 and 5), her trigger to meet and her chapters, and the ties as one graph. What the game's reader found shows
// as errors (skipped: the game can't read them) and notes (they block nothing), each with a count.
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
  D.tagOf = new Map((story?.tags?.data?.tags ?? []).filter((t) => t && typeof t === 'object').map((t) => [t.characterId, t]))
  D.welcome = new Set(story?.welcome ?? [])
}
export const umaName = (id) => D.uma.get(id)?.name ?? id
export function face(id, cls = '') {
  const u = D.uma.get(id)
  if (u?.images?.face) return h('img', { class: `face ${cls}`, src: u.images.face, alt: u.name, loading: 'lazy' })
  return h('span', { class: `face initials ${cls}`, title: u?.name ?? id, text: (u?.name ?? '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2) })
}
const CALLING_COLOR = { farming: '#5f9a3c', foraging: '#2f6a34', fishing: '#3a7aa0', mining: '#6a5a4a', quarry: '#8a7a9a' }
const KIND_COLOR = { friends: '#4f8a3c', rivals: '#c4573a', mentor: '#7a5ac4', teammates: '#3a7aa0', sisters: '#c08a22', other: '#8a8478' }
const calling = (c) => (c ? h('span', { class: 'chip dot', vars: { '--c': CALLING_COLOR[c] }, text: c }) : null)
/** A tie's kind and strength as the game reads them: "other" ("Close") and 1 when the pack gives none. */
const kindOf = (t) => t.kind ?? 'other'
const strengthOf = (t) => t.strength ?? 1
const FESTIVAL = { 'flower-show': 'the Flower Show', 'fishing-derby': 'the Fishing Derby', 'cooking-contest': 'the Cooking Contest', 'animal-show': 'the Animal Show', 'harvest-cup': 'the Harvest Cup' }
export function arrivalWords(a) {
  if (!a) return ''
  if (a.kind === 'opening') return 'The opening'
  if (a.kind === 'chapter') return `Chapter ${a.chapter}’s recruit`
  if (a.kind === 'festival') return `At ${FESTIVAL[a.festival] ?? a.festival}${a.year ? `, year ${a.year}` : ''}`
  if (a.kind === 'beds') return `When the Dorm reaches level ${a.dormLevel}`
  return `After ${a.after}`
}
const issuesList = (issues) => (issues?.length ? h('ul', { class: 'issues' }, issues.map((i) => h('li', { text: i }))) : null)
const noStory = () => h('div', { class: 'note-box' }, h('b', { text: 'No story yet. ' }), 'The private story files go in content/story/: any of world.md, cast.json, ties.json, umas/, routes/, pairs/ and household.json. Every part is optional (docs/story-pack.md).')

/** What the game's reader found: errors, which skip only their part (the rest plays), and notes, which block nothing. */
export function findingsBox(found, title = '') {
  const errors = found?.errors ?? [], notes = found?.notes ?? []
  if (!errors.length && !notes.length) return null
  const head = (words) => `${title ? `${title} · ` : ''}${words}`
  return h('div', { class: 'stack' },
    errors.length ? h('div', { class: 'error-box' }, h('b', { text: head(`Skipped · ${errors.length}`) }),
      h('p', { class: 'small', text: 'The game can’t read these, so each skips only its own part: the rest of the pack plays.' }), issuesList(errors)) : null,
    notes.length ? h('details', { class: 'note-box' }, h('summary', {}, h('b', { text: head(`Notes · ${notes.length}`) }), ' They block nothing: open to read them.'), h('ul', { class: 'list small' }, notes.map((n) => h('li', { text: n })))) : null)
}

/** Where the story stands: the cast, what's written of it, and what the game's reader found. */
function layers() {
  const st = D.story, n = st.cast?.data?.umas?.length ?? 0
  return h('div', { class: 'summary' },
    stat(n, 'characters in the cast'),
    stat(`${st.bibles.length}/${n}`, 'bibles'),
    stat(`${st.routes.length}/${n}`, 'routes'),
    stat(st.pairs.length, 'pair conversations'),
    stat(st.ties?.data?.ties?.length ?? 0, 'ties'),
    stat(st.check?.notes?.length ?? 0, 'notes · they block nothing'),
    stat(st.check?.errors?.length ?? 0, 'skipped · the game can’t read them'),
    st.pack ? stat(st.umas.length, `Umas in the export (pack ${st.pack.id})`) : null,
  )
}

/** Her trigger to meet in words: the pack's, or the default. */
function meetWords(m) {
  switch (m?.kind) {
    case 'talks': return `Talk with her on ${m.days} different days`
    case 'gift': return m.good ? `Give her ${m.good}` : 'Give her a gift she likes'
    case 'spot': return `Talk with her at ${m.spot}`
    case 'season': return `Talk with her in ${m.season}`
    case 'festival': return `Talk with her on ${FESTIVAL[m.festival] ?? m.festival}`
    case 'farm-rank': return `Reach Farm Rank ${m.rank}`
    case 'built': return `Build the ${m.place}`
    case 'shipped': return `Ship ${m.count} ${m.good}`
    case 'event': return `After ${m.after}`
    default: return '—'
  }
}

// ── Characters ───────────────────────────────────────────────────────────────
export function charactersView() {
  const st = D.story
  if (!st?.cast) return h('div', {}, h('h1', { text: 'Characters' }), st?.error ? h('div', { class: 'error-box', text: st.error }) : null, noStory())
  const cast = st.cast.data
  return h('div', {},
    h('h1', { text: 'Characters' }),
    h('p', { class: 'muted', text: 'The cast, in its order: as many characters as the story wants, each with as much as is written. Click one for her page, her ties, her route, her trigger to meet and her chapters. Nothing here blocks writing or releasing.' }),
    layers(),
    findingsBox(st.check, 'The pack'),
    cast.umas.length ? null : noStory(),
    h('div', { class: 'cast-list' }, cast.umas.map((u, i) => {
      const ties = D.tiesOf.get(u.characterId) ?? []
      const own = st.own?.[u.characterId]
      return h('a', { class: `cast-row ${u.arrives?.kind === 'opening' ? 'opening' : ''}`, href: `#/c/${encodeURIComponent(u.characterId)}` },
        h('span', { class: 'order', text: i + 1 }), face(u.characterId, 'lg'),
        h('div', { class: 'cast-text' },
          h('div', { class: 'row' }, h('b', { text: umaName(u.characterId) }), calling(u.calling), D.welcome.has(u.characterId) ? h('span', { class: 'chip', text: 'welcome list' }) : null,
            u.arrives ? h('span', { class: 'muted small', text: arrivalWords(u.arrives) }) : null, reviewDot(`cast/${u.characterId}`),
            own?.errors?.length ? h('span', { class: 'warn-text', text: `${own.errors.length} skipped` }) : null,
            own?.notes?.length ? h('span', { class: 'muted small', text: `${own.notes.length} notes` }) : null),
          u.paragraph ? h('p', { class: 'small', text: u.paragraph }) : null,
          h('div', { class: 'row tiny' }, ties.map((t) => { const other = t.a === u.characterId ? t.b : t.a; return h('span', { class: 'tie-chip', vars: { '--c': KIND_COLOR[kindOf(t)] }, title: `${kindOf(t)}, strength ${strengthOf(t)}` }, face(other, 'xs'), `${umaName(other)} ${'●'.repeat(strengthOf(t))}`) })),
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
        h('div', { class: 'row' }, h('span', { class: 'chip', text: `#${entry.order} in the cast` }), calling(entry.calling), D.welcome.has(id) ? h('span', { class: 'chip', text: 'welcome list' }) : null,
          entry.arrives ? h('span', { class: 'chip', text: arrivalWords(entry.arrives) }) : null, entry.outfitId ? h('span', { class: 'chip', text: `Outfit ${entry.outfitId}${uma?.outfit?.title ? ` · ${uma.outfit.title}` : ''}` }) : h('span', { class: 'chip', text: 'No outfit yet' })),
        h('h1', { text: umaName(id) }),
        entry.paragraph ? h('p', { class: 'logline', text: entry.paragraph }) : null,
        h('div', { class: 'row small' }, prev ? h('a', { href: `#/c/${prev.characterId}`, text: `← ${umaName(prev.characterId)}` }) : null, next ? h('a', { href: `#/c/${next.characterId}`, text: `${umaName(next.characterId)} →` }) : null),
        tagPanel(id),
        placeholderPanel(id),
        menuPanel(entry),
        h('div', { class: 'panel' }, h('div', { class: 'row' }, h('h3', { text: 'Her route' }), h('span', { class: 'muted small', text: bible ? `umas/${id}.json` : 'Her bible can name any of these rungs; none is required' }), routeProgress(id)), ladder(id, bible)),
        bible ? biblePanel(bible) : null,
        h('div', { class: 'panel' }, h('h3', { text: `Her ties · ${ties.length}` }),
          ties.length ? h('div', { class: 'stack' }, ties.map((t) => {
            const other = t.a === id ? t.b : t.a
            return h('div', { class: 'rel' },
              h('a', { class: 'rel-who', href: `#/c/${other}` }, face(other), h('div', {}, h('b', { text: umaName(other) }), h('span', { class: 'muted small', text: `${kindOf(t)} · ${'●'.repeat(strengthOf(t))}${'○'.repeat(3 - strengthOf(t))}` }))),
              h('div', { class: 'rel-body' }, t.line ? h('p', { text: t.line }) : null, h('p', { class: 'small muted' }, t.source ? h('span', { class: `chip ${t.source === 'real' ? 'dot' : ''}`, text: t.source === 'real' ? 'real' : 'farm-born' }) : null, ' ', t.history ?? '')))
          })) : h('p', { class: 'muted', text: 'No ties yet.' })),
      ),
    ),
    h('div', { class: 'section-head' }, h('h2', { text: 'Review' })),
    reviewPanel(`cast/${id}`, st.own?.[id] ?? { errors: [], notes: [] }, bible ? bible.file : 'content/story/cast.json', onReview, 'Nothing to note: what’s written of her reads whole.'),
  )
}

/** Her parts as the game plays them: each written by the pack, or a placeholder (what plays instead), marked. */
function placeholderPanel(id) {
  const parts = D.story?.written?.[id] ?? []
  if (!parts.length) return null
  const placeholders = parts.filter((p) => !p.written).length
  return h('div', { class: 'panel', 'data-written': id },
    h('div', { class: 'row' }, h('h3', { text: 'In the game' }),
      h('span', { class: `chip ${placeholders ? '' : 'dot'}`, text: `${parts.length - placeholders} written · ${placeholders} placeholder${placeholders === 1 ? '' : 's'}` })),
    h('p', { class: 'muted small', text: 'What the pack writes of her, and what plays instead where it doesn’t. Placeholders play whole and pay as written: nothing waits on the story.' }),
    h('table', { class: 'written' }, h('tbody', {}, parts.map((p) => h('tr', { class: p.written ? 'is-written' : 'is-placeholder' },
      h('th', { text: p.part }),
      h('td', {}, h('span', { class: `chip ${p.written ? 'dot' : 'placeholder'}`, text: p.written ? 'Written' : 'Placeholder' })),
      h('td', { class: 'small', text: p.plays }))))))
}

/** Her trigger to meet and her chapters: the pack's, else the game's defaults (marked). */
function menuPanel(entry) {
  const defaults = D.data.game.authored?.defaults ?? {}
  const meet = entry.meet ?? defaults.meet
  const chapters = entry.chapters?.length ? entry.chapters : defaults.chapters ?? []
  return h('div', { class: 'panel' }, h('h3', { text: 'Meeting her and her chapters' }),
    h('dl', { class: 'kv' },
      h('dt', { text: 'Her trigger to meet' }), h('dd', { text: `${meetWords(meet)}${entry.meet ? '' : ' (the default)'}` }),
      h('dt', { text: 'Her chapters' }), h('dd', { text: entry.chapters?.length ? `${entry.chapters.length}, the story’s` : `${chapters.length}, the defaults` })),
    h('ol', { class: 'list small' }, chapters.map((c, i) => h('li', {}, h('b', { text: c.title ?? `Chapter ${i + 1}` }), ` · ${(c.events ?? []).join(', ') || 'no events'}`, c.gate ? h('span', { class: 'muted', text: ` · waits for: ${meetWords(c.gate)}` }) : null))),
    h('p', { class: 'muted small', text: 'Read today; meeting her in town and her chapters’ screens act on them.' }))
}

/** Her 27 rungs as a ladder you can see: her arrival scene, friendship 1–10, the confession, romance 1–10,
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
      ...[['Now', b.now], ['Why the farm', b.whyTheFarm], ['Dream', b.dream], ['Blurb', b.blurb], ['Favourite work', b.favouriteLine], ['Season, festival', b.season || b.festival ? `${b.season ?? '—'}, ${b.festival ?? '—'}` : null],
        ['Loved', b.gifts?.loved], ['Liked', b.gifts?.liked?.join(', ')], ['Disliked', b.gifts?.disliked?.join(', ')], ['Laughs at', b.laughs], ['Hurt by', b.hurts],
        ['Her name for you', b.petName], ['Keepsake', b.keepsake ? `${b.keepsake.name}: “${b.keepsake.line}”` : null], ['Wedding places', b.wedding?.places?.join(', ')],
        ['Wishes', b.wishes?.join(', ')], ['Chats', b.chats ? `${b.chats.friend?.length ?? 0} friend · ${b.chats.partner?.length ?? 0} partner · ${b.chats.spouse?.length ?? 0} spouse` : null]]
        .flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v ?? '—' })])),
    b.chats ? h('details', {}, h('summary', { class: 'small', text: 'Her chat lines' }),
      ['friend', 'partner', 'spouse'].map((set) => h('div', {}, h('h4', { text: set }), h('ul', { class: 'list small' }, (b.chats[set] ?? []).map((l) => h('li', { text: l })))))) : null)
}

/** Her tags: favourite line, season, festival and loved gift, each with its reason. */
function tagPanel(id) {
  const t = D.tagOf?.get(id)
  if (!t) return null
  const row = (label, value, reason) => [h('dt', { text: label }), h('dd', {}, h('b', { text: value }), h('div', { class: 'small muted', text: reason }))]
  return h('div', { class: 'panel' }, h('h3', { text: 'Her tags' }),
    h('dl', { class: 'kv' }, row('Favourite work', t.favouriteLine, t.reasons.favouriteLine), row('Season', t.season, t.reasons.season),
      row('Festival', t.festival, t.reasons.festival), row('Loved gift', `${t.loved}${t.proposed ? ' (proposed)' : ''}`, t.reasons.loved)))
}

/** How far her route is scripted: her arrival scene, then her events, any of them in any order. */
function routeProgress(id) {
  const route = D.routeOf.get(id)
  if (!route) return h('span', { class: 'chip', text: 'Arrival scene to write' })
  const of = D.data.game.authored?.rungs?.length ?? 27
  const scripted = route.data.events.length
  const found = (route.errors?.length ?? 0) + (route.notes?.length ?? 0)
  return h('span', { class: `chip ${scripted ? 'dot' : ''}`, text: `${scripted}/${of} scripted${found ? ` · ${found} notes and skips` : ''}` })
}

// ── Counts ─────────────────────────────────────────────────────────────
export function countsView() {
  const c = D.story?.counts
  if (!c) return h('div', {}, h('h1', { text: 'Counts' }), noStory())
  const who = (ids) => h('div', { class: 'row tiny' }, ids.map((id) => h('a', { class: 'tie-chip', href: `#/c/${id}`, vars: { '--c': '#8a8478' } }, face(id, 'xs'), umaName(id))))
  const table = (title, groups, note) => h('div', { class: 'panel' }, h('h3', { text: title }), note ? h('p', { class: 'small muted', text: note }) : null,
    Object.keys(groups).length ? h('table', { class: 'table' }, Object.entries(groups).map(([k, ids]) => h('tr', {}, h('td', {}, h('b', { text: k })), h('td', { text: ids.length }), h('td', {}, who(ids))))) : h('p', { class: 'muted', text: 'Nothing yet.' }))
  return h('div', {},
    h('h1', { text: 'Counts' }),
    h('p', { class: 'muted', text: 'What the cast, the tag sheet, the ties and the bibles add up to, each with the Umas behind it. Nothing is a quota: read it, and say what to balance.' }),
    h('div', { class: 'summary' },
      stat(c.umas, 'Umas'), stat(`${c.tagged}/${c.umas}`, 'tagged'), stat(c.ties.total, `ties · ${c.ties.real} real · ${c.ties.story} farm-born`),
      stat(`${c.bibles}/${c.umas}`, 'bibles'), stat(c.eventsPer.reduce((n, e) => n + e.scripted, 0), `events scripted of ${c.umas * (c.eventsPer[0]?.of ?? 27)}`),
      stat(c.pairsPer.reduce((n, p) => n + Math.min(p.written, p.of), 0), `pair conversations toward ${c.umas * 2}`)),
    h('div', { class: 'two' },
      h('div', { class: 'stack' },
        table('Callings', c.byCalling, 'From her board playstyle.'),
        table('Favourite work', c.byLine), table('Seasons', c.bySeason), table('Festivals', c.byFestival), table('Loved gifts', c.byLoved),
      ),
      h('div', { class: 'stack' },
        table('Arrivals', c.arrivals),
        h('div', { class: 'panel' }, h('h3', { text: 'Ties an Uma, the least tied first' }), h('table', { class: 'table' },
          h('tr', {}, ['', 'Ties', 'Strength 3', 'Real'].map((x) => h('th', { text: x }))),
          c.tiesPer.map((t) => h('tr', {}, h('td', {}, h('a', { href: `#/c/${t.id}` }, face(t.id, 'sm'), umaName(t.id))), h('td', { text: t.ties }), h('td', { text: t.strong }), h('td', { text: t.real }))))),
        c.bibles ? table('Liked gifts', c.liked) : null,
        c.bibles ? table('Disliked gifts', c.disliked) : null,
        h('div', { class: 'panel' }, h('h3', { text: 'Routes and pairs, an Uma' }), h('table', { class: 'table' },
          h('tr', {}, ['', 'Bible', 'Scripted', 'Pairs'].map((x) => h('th', { text: x }))),
          c.eventsPer.map((e) => { const p = c.pairsPer.find((x) => x.id === e.id); return h('tr', {}, h('td', {}, h('a', { href: `#/c/${e.id}` }, face(e.id, 'sm'), umaName(e.id))), h('td', { text: e.bible ? '✓' : '—' }), h('td', { text: `${e.scripted}/${e.of}` }), h('td', { text: `${p?.written ?? 0}/${p?.of ?? 2}` })) }))),
      ),
    ),
  )
}

// ── Relationships ────────────────────────────────────────────────────────────
export function relationshipsView(onReview) {
  const st = D.story
  if (!st?.ties) return h('div', {}, h('h1', { text: 'Relationships' }), noStory())
  const ties = st.ties.data.ties
  const kinds = [...new Set(ties.map(kindOf))]
  return h('div', {},
    h('h1', { text: 'Relationships' }),
    h('p', { class: 'muted', text: 'The cast’s ties as one graph: who are friends, rivals, mentor and protégée, teammates or sisters in all but name, drawn from their real careers or born on the farm. The thicker the line, the stronger the tie; each Uma’s two strongest get authored pair conversations.' }),
    h('div', { class: 'two' },
      h('div', { class: 'panel' }, ring(ties), h('div', { class: 'row small' }, kinds.map((k) => h('span', { class: 'chip dot', vars: { '--c': KIND_COLOR[k] }, text: `${k} · ${ties.filter((t) => kindOf(t) === k).length}` })))),
      h('div', { class: 'panel' }, h('h3', { text: 'Each Uma’s closest two' }), h('table', { class: 'table' },
        st.cast.data.umas.map((u) => {
          const two = [...(D.tiesOf.get(u.characterId) ?? [])].sort((a, b) => strengthOf(b) - strengthOf(a)).slice(0, 2)
          return h('tr', {}, h('td', {}, h('a', { href: `#/c/${u.characterId}` }, face(u.characterId, 'sm'), umaName(u.characterId))),
            h('td', { class: 'small' }, two.map((t) => { const o = t.a === u.characterId ? t.b : t.a; return h('div', {}, `${umaName(o)} `, h('span', { class: 'muted', text: `${kindOf(t)} ${'●'.repeat(strengthOf(t))}` })) })))
        }))),
    ),
    findingsBox(st.ties, 'ties.json'),
    h('div', { class: 'section-head' }, h('h2', { text: `Every tie · ${ties.length}` })),
    h('div', { class: 'panel' }, h('table', { class: 'table rels' },
      h('tr', {}, ['Between', 'Kind', 'Strength', 'On the farm', 'From'].map((x) => h('th', { text: x }))),
      [...ties].sort((a, b) => strengthOf(b) - strengthOf(a)).map((t) => h('tr', {},
        h('td', {}, h('div', { class: 'pair' }, h('a', { href: `#/c/${t.a}` }, face(t.a, 'sm'), umaName(t.a)), h('span', { class: 'muted', text: '↔' }), h('a', { href: `#/c/${t.b}` }, face(t.b, 'sm'), umaName(t.b)))),
        h('td', {}, h('span', { class: 'chip dot', vars: { '--c': KIND_COLOR[kindOf(t)] }, text: kindOf(t) })),
        h('td', { text: '●'.repeat(strengthOf(t)) + '○'.repeat(3 - strengthOf(t)) }),
        h('td', { class: 'small', text: t.line ?? '' }), h('td', { class: 'small muted', text: t.history ?? '' }))))),
    h('div', { class: 'section-head' }, h('h2', { text: 'Review' })),
    reviewPanel('ties', { errors: st.ties.errors, notes: st.ties.notes }, st.ties.file, onReview, 'Nothing to note: every tie reads whole.'),
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
      return s('path', { d: `M${x1},${y1} Q${C},${C} ${x2},${y2}`, class: 'edge', stroke: KIND_COLOR[kindOf(t)], 'stroke-width': 1 + strengthOf(t) * 1.3 }, s('title', {}, `${umaName(t.a)} and ${umaName(t.b)}: ${kindOf(t)}.${t.line ? ` ${t.line}` : ''}`))
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
