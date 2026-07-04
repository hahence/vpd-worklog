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

export const teams: Team[] = [
  { id: 't1', name: '프로덕트 1팀', region: '판교' },
  { id: 't2', name: '프로덕트 2팀', region: '대전' },
]

// 명단은 추후 실제 데이터로 교체 예정 (사번 5~6자리 / 팀 / 지역)
// 색상·이름은 데모용. region 이 기본 출퇴근값을 결정.
const roster: Array<Omit<User, 'defaultCheckIn' | 'defaultCheckOut' | 'region'>> = [
  // 프로덕트 1팀 (판교)
  { id: 'u1', empId: '210034', name: '김서준', teamId: 't1', role: 'manager', color: '#4f46e5' },
  { id: 'u2', empId: '221145', name: '박서연', teamId: 't1', role: 'member', color: '#10b981' },
  { id: 'u3', empId: '190872', name: '이도현', teamId: 't1', role: 'member', color: '#0ea5e9' },
  { id: 'u4', empId: '230210', name: '정하윤', teamId: 't1', role: 'member', color: '#ec4899' },
  { id: 'u5', empId: '205511', name: '최지우', teamId: 't1', role: 'member', color: '#f59e0b' },
  // 프로덕트 2팀 (대전)
  { id: 'u6', empId: '180903', name: '강민재', teamId: 't2', role: 'manager', color: '#8b5cf6' },
  { id: 'u7', empId: '224417', name: '김하늘', teamId: 't2', role: 'member', color: '#0891b2' },
  { id: 'u8', empId: '231002', name: '문지오', teamId: 't2', role: 'member', color: '#e11d48' },
  { id: 'u9', empId: '209988', name: '서다은', teamId: 't2', role: 'member', color: '#16a34a' },
  { id: 'u10', empId: '215566', name: '한예린', teamId: 't2', role: 'member', color: '#d97706' },
]

const teamRegion = new Map(teams.map((t) => [t.id, t.region]))

export const users: User[] = roster.map((r) => {
  const region = teamRegion.get(r.teamId) ?? '판교'
  const def = regionDefault(region)
  return {
    ...r,
    region,
    defaultCheckIn: def.checkIn,
    defaultCheckOut: def.checkOut,
  }
})

// 대한민국 2026 공휴일 (인프라 데모용)
export const holidays: Holiday[] = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-12-25', name: '성탄절' },
]

const period = getPeriod(new Date())
const TODAY = todayStr()

// 부재 기록 (개인별 목표시간 차이 시연)
export const absences: Absence[] = [
  { id: 'a1', userId: 'u2', startDate: dateInPeriod(6), endDate: dateInPeriod(7), type: 'annual', reason: '가족 여행' },
  { id: 'a2', userId: 'u4', startDate: dateInPeriod(4), endDate: dateInPeriod(4), type: 'half_pm', reason: '병원' },
  { id: 'a3', userId: 'u5', startDate: futureWorkday(1), endDate: futureWorkday(1), type: 'business', reason: '고객사 미팅' },
  { id: 'a4', userId: 'u8', startDate: dateInPeriod(5), endDate: dateInPeriod(5), type: 'annual', reason: '개인 사유' },
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

const workTypes: WorkType[] = ['office', 'office', 'office', 'remote', 'field']

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

/** 로그인 시연용: 이 사번으로 로그인하면 오늘 미입력 상태(입력 흐름 시연) */
export const DEMO_EMPTY_TODAY_USER = 'u3' // 이도현

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
      if (hasFullAbsence(u.id, date)) continue

      const base = hmToMin(def.checkIn) + jitter(seed++, 18)
      const half = halfAbsence(u.id, date)

      let checkIn = minToHm(base)
      let outMin: number
      if (half === 'am') {
        checkIn = minToHm(hmToMin('13:00') + jitter(seed++, 10))
        outMin = hmToMin(checkIn) + 4 * 60 + 30
      } else if (half === 'pm') {
        outMin = hmToMin('13:30') + jitter(seed++, 15)
      } else {
        outMin = base + (8 + 1) * 60 + jitter(seed++, 25)
      }

      const wt = workTypes[(seed + u.id.length) % workTypes.length]

      // 오늘: 데모용 특정 사용자는 미입력으로 남김
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
