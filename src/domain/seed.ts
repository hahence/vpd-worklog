import { getPeriod } from './calc'
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

export const teams: Team[] = [{ id: 't1', name: '프로덕트 1팀' }]

export const users: User[] = [
  { id: 'u0', name: '김서준', teamId: 't1', role: 'manager', color: '#4f46e5', defaultCheckIn: '09:00', defaultCheckOut: '18:00' },
  { id: 'u1', name: '이도현', teamId: 't1', role: 'member', color: '#0ea5e9', defaultCheckIn: '09:30', defaultCheckOut: '18:30' },
  { id: 'u2', name: '박서연', teamId: 't1', role: 'member', color: '#10b981', defaultCheckIn: '08:30', defaultCheckOut: '17:30' },
  { id: 'u3', name: '최지우', teamId: 't1', role: 'member', color: '#f59e0b', defaultCheckIn: '10:00', defaultCheckOut: '19:00' },
  { id: 'u4', name: '정하윤', teamId: 't1', role: 'member', color: '#ec4899', defaultCheckIn: '09:00', defaultCheckOut: '18:00' },
  { id: 'u5', name: '강민재', teamId: 't1', role: 'member', color: '#8b5cf6', defaultCheckIn: '09:45', defaultCheckOut: '18:45' },
]

// 대한민국 2026 공휴일 (기준월 구간과 무관한 것 포함 — 인프라 데모용)
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

// 부재 기록 (개인별 목표시간 차이를 보여주기 위한 시드)
export const absences: Absence[] = [
  { id: 'a1', userId: 'u2', startDate: dateInPeriod(6), endDate: dateInPeriod(7), type: 'annual', reason: '가족 여행' },
  { id: 'a2', userId: 'u4', startDate: dateInPeriod(4), endDate: dateInPeriod(4), type: 'half_pm', reason: '병원' },
  { id: 'a3', userId: 'u3', startDate: futureWorkday(1), endDate: futureWorkday(1), type: 'business', reason: '고객사 미팅' },
]

/** 구간 시작 + n번째 평일의 날짜 문자열 */
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

/** 오늘 이후 n번째 평일 (미래 부재 데모용) */
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

// 결정적 의사난수 (index 기반) — 매번 같은 시드 생성
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

/** 과거 근무 기록 생성 (구간 시작 ~ 어제) + 오늘 일부 */
function buildAttendance(): Attendance[] {
  const out: Attendance[] = []
  let seed = 1

  for (const u of users) {
    if (u.role === 'manager') continue
    const days = eachDate(parseDate(period.start), parseDate(TODAY))
    for (const d of days) {
      const date = toDateStr(d)
      const isToday = date === TODAY
      // 오늘은 주말이어도 현황판 시연을 위해 기록 생성, 과거 주말은 건너뜀
      if (isWeekend(d) && !isToday) continue
      if (hasFullAbsence(u.id, date)) continue

      const base = hmToMin(u.defaultCheckIn) + jitter(seed++, 18)
      const half = halfAbsence(u.id, date)

      let checkIn = minToHm(base)
      let outMin: number
      if (half === 'am') {
        // 오전 반차 → 오후 출근
        checkIn = minToHm(hmToMin('13:00') + jitter(seed++, 10))
        outMin = hmToMin(checkIn) + 4 * 60 + 30
      } else if (half === 'pm') {
        outMin = hmToMin('14:00') + jitter(seed++, 15)
      } else {
        outMin = base + (8 + 1) * 60 + jitter(seed++, 25)
      }

      const wt = workTypes[(seed + u.id.length) % workTypes.length]

      if (isToday) {
        // 오늘: u1(=기본 로그인 사용자)은 미입력 상태로 남겨 입력 흐름 시연
        if (u.id === 'u1') continue
        // 일부는 아직 퇴근 전(예정), 일부는 퇴근 완료
        const stillWorking = seed % 3 !== 0
        out.push({
          id: `at-${u.id}-${date}`,
          userId: u.id,
          date,
          checkIn,
          checkOut: minToHm(outMin),
          checkOutPlanned: stillWorking,
          workType: wt,
          updatedAt: `${date}T${checkIn}:00`,
        })
      } else {
        out.push({
          id: `at-${u.id}-${date}`,
          userId: u.id,
          date,
          checkIn,
          checkOut: minToHm(outMin),
          checkOutPlanned: false,
          workType: wt,
          updatedAt: `${date}T${checkIn}:00`,
        })
      }
    }
  }
  return out
}

export const attendance: Attendance[] = buildAttendance()

export const seedPeriodLabel = period.label
