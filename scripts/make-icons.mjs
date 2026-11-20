// Generates the PWA PNG icons without image dependencies: a dark red tile with a
// parchment shield outline and a brass sword (same motif as favicon.svg).
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const distToSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax,
    dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
function icon(size, maskable) {
  const s = size / 64
  const scale = maskable ? 0.72 : 1
  const off = (64 - 64 * scale) / 2
  const P = (x, y) => [(off + x * scale) * s, (off + y * scale) * s]
  const shield = [
    [14, 10],
    [50, 10],
    [50, 32],
    [32, 56],
    [14, 32],
  ].map(([x, y]) => P(x, y))
  const blade = [P(21, 45), P(42, 20)]
  const guard = [P(20, 36), P(30, 46)]
  const w = 2.2 * s * scale
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let col = [90, 20, 20]
      let dsh = Infinity
      for (let i = 0; i < shield.length; i++)
        dsh = Math.min(dsh, distToSeg(x, y, ...shield[i], ...shield[(i + 1) % shield.length]))
      const db = distToSeg(x, y, ...blade[0], ...blade[1])
      const dg = distToSeg(x, y, ...guard[0], ...guard[1])
      if (dsh < w) col = [239, 230, 210]
      if (db < w * 1.1 || dg < w) col = [201, 160, 74]
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = col[0]
      raw[o + 1] = col[1]
      raw[o + 2] = col[2]
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
writeFileSync('public/icons/icon-192.png', icon(192, false))
writeFileSync('public/icons/icon-512.png', icon(512, false))
writeFileSync('public/icons/icon-512-maskable.png', icon(512, true))
writeFileSync('public/apple-touch-icon.png', icon(180, false))
console.log('icons written')
