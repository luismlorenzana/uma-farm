// The farm's app icons: the letter F as a pixel glyph in uma-kit's accent ink on its accent, the cheapest mark that
// looks fine. Real art is ChatGPT's, later. Run `node scripts/draw-icons.mjs` to redraw apps/web/public/icons; iOS keeps
// the icon it saw at Add to Home Screen, so change them only with a reinstall in mind.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const ACCENT = [0xd3, 0x9a, 0x2b, 0xff] // --color-accent (light)
const INK = [0x1b, 0x14, 0x06, 0xff] // --color-accent-ink
const GLYPH = ['#####', '#....', '#....', '####.', '#....', '#....', '#....']

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (bytes) => {
  let c = 0xffffffff
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

/** A `size`-square PNG: the accent, with the glyph centred at about half the height (inside the maskable safe zone). */
export function iconPng(size) {
  const cell = Math.max(1, Math.floor((size * 0.5) / GLYPH.length))
  const w = GLYPH[0].length * cell, h = GLYPH.length * cell
  const x0 = Math.floor((size - w) / 2) + Math.floor(cell / 2), y0 = Math.floor((size - h) / 2)
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - x0) / cell), gy = Math.floor((y - y0) / cell)
      const on = x >= x0 && y >= y0 && GLYPH[gy]?.[gx] === '#'
      const px = on ? INK : ACCENT
      const at = y * (size * 4 + 1) + 1 + x * 4
      raw[at] = px[0]; raw[at + 1] = px[1]; raw[at + 2] = px[2]; raw[at + 3] = px[3]
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

export const ICONS = { 'icon-64.png': 64, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/icons')
  mkdirSync(dir, { recursive: true })
  for (const [name, size] of Object.entries(ICONS)) writeFileSync(join(dir, name), iconPng(size))
  console.log(`Drew ${Object.keys(ICONS).length} icons in ${dir}`)
}
