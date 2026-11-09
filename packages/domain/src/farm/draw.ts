// Seeded draws (F17; core spec CS1, CS8): every random number in the loop is a draw of the account, the day and what's
// drawn, so a night settles the same way however often, and on whichever device, it's replayed. The save holds no random
// state. FNV-1a (32-bit) over the UTF-8 of `uid|day|what|n`, then one mulberry32 step. Its test pins vectors: once v3 is
// live this function never changes, or every saved night would replay differently.

/** The UTF-8 bytes of a string. */
function* utf8(text: string): Generator<number> {
  for (const ch of text) {
    const c = ch.codePointAt(0)!
    if (c < 0x80) yield c
    else if (c < 0x800) { yield 0xc0 | (c >> 6); yield 0x80 | (c & 0x3f) }
    else if (c < 0x10000) { yield 0xe0 | (c >> 12); yield 0x80 | ((c >> 6) & 0x3f); yield 0x80 | (c & 0x3f) }
    else { yield 0xf0 | (c >> 18); yield 0x80 | ((c >> 12) & 0x3f); yield 0x80 | ((c >> 6) & 0x3f); yield 0x80 | (c & 0x3f) }
  }
}

/** FNV-1a, 32-bit. */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (const byte of utf8(text)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0
  return hash
}

/** One mulberry32 step from a 32-bit seed: a number in [0, 1). */
export function mulberry32(seed: number): number {
  let a = (seed + 0x6d2b79f5) | 0
  a = Math.imul(a ^ (a >>> 15), a | 1)
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61)
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296
}

/** The account's draw for `what` on `day`, the `n`th of its kind: a number in [0, 1), the same every time it's asked. */
export const draw = (uid: string, day: number, what: string, n: number): number => mulberry32(fnv1a(`${uid}|${day}|${what}|${n}`))
