/** 날짜/시간 유틸 — 날짜는 'YYYY-MM-DD', 시각은 'HH:mm' 문자열로 다룬다. */

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayStr(): string {
  return toDateStr(new Date())
}

/** 'HH:mm' → 분 */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

/** 분 → 'HH:mm' */
export function minToHm(min: number): string {
  const m = ((min % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

/** 시간(h) → "8h 30m" 표기 */
export function fmtHours(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** [start, end] 사이 모든 날짜(포함) */
export function eachDate(start: Date, end: Date): Date[] {
  const out: Date[] = []
  let cur = new Date(start)
  while (cur <= end) {
    out.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return out
}

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토']

export function weekdayKr(d: Date): string {
  return WEEKDAY_KR[d.getDay()]
}

export function fmtDateKr(s: string): string {
  const d = parseDate(s)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdayKr(d)})`
}
