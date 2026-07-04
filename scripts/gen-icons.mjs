// PWA 아이콘 생성: SVG 시계 로고 → PNG 여러 사이즈
// 실행: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('public', { recursive: true })

// 브랜드: 레드(#E34955) 배경 + 화이트 시계 + 블랙 분침
const icon = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="#e34955"/>
  <g fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round">
    <circle cx="256" cy="256" r="132"/>
    <line x1="256" y1="256" x2="256" y2="158"/>
  </g>
  <line x1="256" y1="256" x2="332" y2="300" fill="none" stroke="#000000" stroke-width="26" stroke-linecap="round"/>
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
