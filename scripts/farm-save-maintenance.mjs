// Owner-operated Firestore maintenance. The game and API do not expose this tool.
import { execFileSync } from 'node:child_process'
import { isDeepStrictEqual } from 'node:util'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const database = 'projects/uma-rpg/databases/farm/documents'
const origin = `https://firestore.googleapis.com/v1/${database}`
const production = 'https://uma-farm.web.app'

export function adjustment(raw, operation, rules, at) {
  const save = rules.parseSave(raw)
  let next
  if (operation.kind === 'restart') {
    if (save.calendar.start) throw Error('This farm already has a Spring 1 restart.')
    if (save.calendar.day > rules.DAYS_PER_SEASON) throw Error('This restart is for a farm still in its first Spring.')
    if (save.calendar.day === 1) return raw
    if (save.workshops.festival?.active || save.workshops.current?.play === 'contest'
      || Object.values(save.love).some(love => love.wed || love.weddingDay)) {
      throw Error('Finish current contest play and resolve weddings before restarting the calendar.')
    }
    next = { ...raw, calendar: { ...raw.calendar, start: raw.calendar.day } }
  } else if (operation.kind === 'gold') {
    next = { ...raw, gold: operation.gold }
  } else {
    const key = rules.parseStockKey(operation.key)
    if (!key) throw Error('Expected a Warehouse item and stars, such as carrot@1.')
    const stock = save.items[key.id] ?? [0, 0, 0, 0, 0]
    const difference = operation.count - stock[key.stars - 1]
    const items = difference >= 0 ? rules.addGoods(save.items, key.id, key.stars, difference)
      : rules.takeGoods(save.items, key.id, key.stars, -difference)
    next = { ...raw, items: { ...raw.items, ...(items[key.id] ? { [key.id]: items[key.id] } : {}) } }
    if (!items[key.id]) delete next.items[key.id]
  }
  if (isDeepStrictEqual(next, raw)) return raw
  next.account = { ...raw.account, updatedAt: at }
  rules.parseSave(next)
  return next
}

export function maintenanceWrites(doc, next) {
  const revision = Number(doc.fields.revision.integerValue)
  const uid = next.account.uid
  if (doc.name !== `${database}/saves/${uid}` || !doc.updateTime || !Number.isSafeInteger(revision + 1) || revision < 1) {
    throw Error('The cloud save’s identity or revision is unexpected.')
  }
  const stamp = fieldPath => [{ fieldPath, setToServerValue: 'REQUEST_TIME' }]
  return [
    {
      update: { name: `${database}/saveBackups/${uid}-maintenance-r${revision}`, fields: doc.fields },
      currentDocument: { exists: false },
      updateTransforms: stamp('backedUpAt'),
    },
    {
      update: { name: doc.name, fields: { save: { stringValue: JSON.stringify(next) }, revision: { integerValue: String(revision + 1) } } },
      updateMask: { fieldPaths: ['save', 'revision'] },
      currentDocument: { updateTime: doc.updateTime },
      updateTransforms: stamp('updatedAt'),
    },
  ]
}

function whole(text) {
  if (!/^\d+$/.test(text ?? '') || !Number.isSafeInteger(Number(text))) throw Error('Expected a non-negative whole number.')
  return Number(text)
}

function options(args) {
  const [kind, ...rest] = args
  let operation
  switch (kind) {
    case 'spring-1': operation = { kind: 'restart' }; break
    case 'gold': operation = { kind, gold: whole(rest.shift()) }; break
    case 'stock': operation = { kind, key: rest.shift(), count: whole(rest.shift()) }; break
    default: throw Error('Use spring-1, gold <amount>, or stock <item>@<stars> <count>. Add --apply <revision> <deployed-commit> to write.')
  }
  if (!rest.length) return { operation }
  const [flag, revision, build] = rest
  if (flag !== '--apply' || !/^[0-9a-f]{40}$/.test(build ?? '') || rest.length !== 3) throw Error('Expected --apply <revision> <deployed-commit>.')
  return { operation, apply: { revision: whole(revision), build } }
}

async function cloudJson(url, headers, body) {
  const response = await fetch(url, { headers, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000) })
  if (!response.ok) throw Error(`Cloud request returned HTTP ${response.status}.`)
  return response.json()
}

async function main(args) {
  const { operation, apply } = options(args)
  const rules = require('../packages/domain/dist/cjs/index.js')
  const tokenArgs = ['--configuration=default', 'auth', 'print-access-token', '--quiet']
  const windows = process.platform === 'win32'
  const token = execFileSync(windows ? 'cmd.exe' : 'gcloud',
    windows ? ['/d', '/c', 'gcloud.cmd', ...tokenArgs] : tokenArgs, { encoding: 'utf8' }).trim()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const list = await cloudJson(`${origin}/saves?pageSize=2`, headers)
  if (list.documents?.length !== 1 || list.nextPageToken) throw Error('Expected exactly one owner save in the farm database.')
  const [doc] = list.documents
  const revision = Number(doc.fields.revision.integerValue)
  const raw = JSON.parse(doc.fields.save.stringValue)
  const next = adjustment(raw, operation, rules, new Date().toISOString())
  const writes = maintenanceWrites(doc, next)
  const before = rules.dateOf(raw.calendar.day, raw.calendar)
  const after = rules.dateOf(next.calendar.day, next.calendar)
  const resource = operation.kind === 'gold' ? { gold: { before: raw.gold, after: next.gold } }
    : operation.kind === 'stock' ? { stock: { key: operation.key, count: operation.count } } : {}
  if (!apply || next === raw) {
    console.log(JSON.stringify({ preview: !apply, changed: next !== raw, kind: operation.kind, revision, before, after, ...resource }))
    return
  }
  if (revision !== apply.revision) throw Error('The save changed. Inspect the new revision before applying.')
  const health = await cloudJson(`${production}/api/health`, {})
  if (!health.ok || health.build !== apply.build) throw Error('The verified maintenance build is not live.')
  await cloudJson(`${origin}:commit`, headers, { writes })
  const uid = encodeURIComponent(raw.account.uid)
  const [stored, backup] = await Promise.all([
    cloudJson(`${origin}/saves/${uid}`, headers),
    cloudJson(`${origin}/saveBackups/${uid}-maintenance-r${revision}`, headers),
  ])
  if (backup.fields.save.stringValue !== doc.fields.save.stringValue) throw Error('The write committed, but the backup could not be verified.')
  if (Number(stored.fields.revision.integerValue) !== revision + 1 || stored.fields.save.stringValue !== JSON.stringify(next)) {
    throw Error('The write committed, but the save changed again before verification. Inspect it before retrying.')
  }
  console.log(JSON.stringify({ applied: true, kind: operation.kind, revision: revision + 1, before, after, backedUp: true, ...resource }))
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === pathToFileURL(fileURLToPath(import.meta.url)).href) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
