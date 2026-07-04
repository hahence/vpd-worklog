import rosterData from '../data/roster.json'
import holidayData from '../data/holidays.json'
import { getPeriod } from './calc'
import { regionDefault } from './policy'
import type { Absence, Attendance, Holiday, Team, User, WorkType } from './types'
import {
  addDays,
  eachDate,
  hmToMin,
  isWeekend,
  minToHm,
  parseDate,
  toDateStr,
  todayStr,
} from './time'

interface RosterEntry {
  no: number
  organization: string
  name: string
  employeeId: string
  role: string[]
  location: string
}

const roster = rosterData as RosterEntry[]

const PALETTE = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#0891b2', '#e11d48', '#16a34a', '#d97706', '#7c3aed', '#059669',
  '#dc2626', '#2563eb', '#db2777', '#0d9488',
]

// 조직(=팀)을 첫 등장 순서대로 도출
const orgNames: string[] = []
for (const r of roster) if (!orgNames.includes(r.organization)) orgNames.push(r.organization)

export const teams: Team[] = orgNames.map((name, i) => ({ id: `t${i + 1}`, name }))
const teamIdByOrg = new Map(orgNames.map((n, i) => [n, `t${i + 1}`]))

// 사번을 그대로 사용자 id 로 사용 (유일)
export const users: User[] = roster.map((r, i) => {
  const region = r.location
  const def = regionDefault(region)
  return {
    id: r.employeeId,
    empId: r.employeeId,
    name: r.name,
    teamId: teamIdByOrg.get(r.organization)!,
    role: r.role.length > 0 ? 'manager' : 'member',
    title: r.role[0],
    region,
    color: PALETTE[i % PALETTE.length],
    defaultCheckIn: def.checkIn,
    defaultCheckOut: def.checkOut,
  }
})

// 대한민국 2026 공휴일 (대체공휴일 포함) — src/data/holidays.json 관리
export const holidays: Holiday[] = holidayData as Holiday[]
const holidaySet = new Set(holidays.map((h) => h.date))

const period = getPeriod(new Date())
const TODAY = todayStr()

/** 로그인 시연용: 이 사번으로 로그인하면 오늘 미입력 상태(입력 흐름 시연) */
export const DEMO_EMPTY_TODAY_USER = '271472' // 이효승 (MBD플랫폼Project)

// 데모용 부재 기록 (개인별 목표시간 차이 시연 · 로컬 전용 임시 데이터)
export const absences: Absence[] = [
  { id: 'a1', userId: '137002', startDate: dateInPeriod(6), endDate: dateInPeriod(7), type: 'annual', reason: '연차' },
  { id: 'a2', userId: '243120', startDate: dateInPeriod(4), endDate: dateInPeriod(4), type: 'half_pm', reason: '반차' },
  { id: 'a3', userId: '261379', startDate: futureWorkday(1), endDate: futureWorkday(1), type: 'business', reason: '출장' },
]

function dateInPeriod(nWeekday: number): string {
  let count = 0
  for (const d of eachDate(parseDate(period.start), parseDate(period.end))) {
    if (!isWeekend(d)) {
      if (count === nWeekday) return toDateStr(d)
      count++
    }
  }
  return period.start
}

function futureWorkday(n: number): string {
  let cur = parseDate(TODAY)
  let count = 0
  while (true) {
    cur = addDays(cur, 1)
    if (!isWeekend(cur)) {
      count++
      if (count === n) return toDateStr(cur)
    }
  }
}

function jitter(seed: number, spread: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return Math.round((x - Math.floor(x) - 0.5) * 2 * spread)
}

const workTypes: WorkType[] = ['office', 'office', 'office', 'office', 'remote', 'field']

function hasFullAbsence(userId: string, date: string): boolean {
  return absences.some(
    (a) =>
      a.userId === userId &&
      date >= a.startDate &&
      date <= a.endDate &&
      (a.type === 'annual' || a.type === 'sick'),
  )
}

function halfAbsence(userId: string, date: string): 'am' | 'pm' | null {
  const a = absences.find(
    (x) => x.userId === userId && date >= x.startDate && date <= x.endDate,
  )
  if (a?.type === 'half_am') return 'am'
  if (a?.type === 'half_pm') return 'pm'
  return null
}

/** 데모용 근무 기록 생성 (구간 시작 ~ 오늘). 실제 사용 시 각자 입력으로 대체됨. */
function buildAttendance(): Attendance[] {
  const out: Attendance[] = []
  let seed = 1

  for (const u of users) {
    const def = regionDefault(u.region)
    const days = eachDate(parseDate(period.start), parseDate(TODAY))
    for (const d of days) {
      const date = toDateStr(d)
      const isToday = date === TODAY
      if (isWeekend(d) && !isToday) continue
      if (holidaySet.has(date) && !isToday) continue // 공휴일은 근무 기록 생성 안 함
      if (hasFullAbsence(u.id, date)) continue

      const base = hmToMin(def.checkIn) + jitter(seed++, 18)
      const half = halfAbsence(u.id, date)

      let checkIn = minToHm(base)
      let outMin: number
      if (half === 'am') {
        checkIn = minToHm(hmToMin('13:00') + jitter(seed++, 10))
        outMin = hmToMin(checkIn) + 4 * 60 + 30
      } else if (half === 'pm') {
        outMin = hmToMin('13:00') + jitter(seed++, 15)
      } else {
        outMin = base + (8 + 1) * 60 + jitter(seed++, 25)
      }

      const wt = workTypes[(seed + u.name.length) % workTypes.length]

      if (isToday && u.id === DEMO_EMPTY_TODAY_USER) continue

      out.push({
        id: `at-${u.id}-${date}`,
        userId: u.id,
        date,
        checkIn,
        checkOut: minToHm(outMin),
        checkOutPlanned: isToday ? seed % 3 !== 0 : false,
        workType: wt,
        updatedAt: `${date}T${checkIn}:00`,
      })
    }
  }
  return out
}

export const attendance: Attendance[] = buildAttendance()
export const seedPeriodLabel = period.label
