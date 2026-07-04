// PWA 아이콘 생성: SVG 시계 로고 → PNG 여러 사이즈
// 실행: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('public', { recursive: true })

const icon = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6d5cf0"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  <g fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round">
    <circle cx="256" cy="256" r="132"/>
    <line x1="256" y1="256" x2="256" y2="158"/>
    <line x1="256" y1="256" x2="332" y2="300"/>
  </g>
  <circle cx="256" cy="256" r="17" fill="#ffffff"/>
</svg>`

const rounded = Buffer.from(icon(true))
const square = Buffer.from(icon(false))

async function main() {
  await sharp(rounded).resize(192, 192).png().toFile('public/pwa-192x192.png')
  await sharp(rounded).resize(512, 512).png().toFile('public/pwa-512x512.png')
  // maskable: 전체 배경 채움(라운드 없음) — OS가 마스크 적용
  await sharp(square).resize(512, 512).png().toFile('public/maskable-512x512.png')
  // apple-touch: 불투명 전체 배경
  await sharp(square).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(rounded).resize(48, 48).png().toFile('public/favicon-48.png')
  writeFileSync('public/favicon.svg', icon(true))
  console.log('icons generated → public/')
}
main()
