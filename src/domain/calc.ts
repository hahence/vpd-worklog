import { ABSENCE_RULE, POLICY } from './policy'
import type { Absence, Attendance, Holiday } from './types'
import {
  addDays,
  eachDate,
  hmToMin,
  isWeekend,
  parseDate,
  toDateStr,
} from './time'

export interface Period {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
  label: string // "2026.06.20 ~ 07.19"
}

/**
 * 기준 날짜가 속한 기준월 구간(전월 20일 ~ 당월 19일)을 구한다.
 * 20일 이상이면 [당월20 ~ 익월19], 19일 이하면 [전월20 ~ 당월19].
 */
export function getPeriod(ref: Date = new Date()): Period {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const d = ref.getDate()

  let start: Date
  let end: Date
  if (d >= POLICY.periodStartDay) {
    start = new Date(y, m, POLICY.periodStartDay)
    end = new Date(y, m + 1, POLICY.periodEndDay)
  } else {
    start = new Date(y, m - 1, POLICY.periodStartDay)
    end = new Date(y, m, POLICY.periodEndDay)
  }
  const p2 = (n: number) => String(n).padStart(2, '0')
  const label = `${start.getFullYear()}.${p2(start.getMonth() + 1)}.${p2(
    start.getDate(),
  )} ~ ${p2(end.getMonth() + 1)}.${p2(end.getDate())}`
  return { start: toDateStr(start), end: toDateStr(end), label }
}

export function shiftPeriod(period: Period, dir: -1 | 1): Period {
  const start = parseDate(period.start)
  // 이전/다음 달의 같은 규칙 구간
  const ref =
    dir === 1 ? addDays(parseDate(period.end), 5) : addDays(start, -5)
  return getPeriod(ref)
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

/** 특정 날짜에 대한 사용자의 부재 기록(있으면) */
function absenceOnDate(
  absences: Absence[],
  userId: string,
  date: string,
): Absence | undefined {
  return absences.find(
    (a) =>
      a.userId === userId && inRange(date, a.startDate, a.endDate),
  )
}

export interface DayTarget {
  date: string
  isWorkday: boolean       // 평일이고 공휴일 아님
  holidayName?: string
  targetHours: number      // 이 날의 목표 근무시간
  absenceType?: string
}

/**
 * 기준월 구간의 날짜별 목표시간 배열.
 * 목표 = 평일 8h, 단 공휴일 0h, 연차 0h, 반차 4h, 병가 0h.
 * (출장/공가는 목표 유지 + 근무 인정)
 */
export function dayTargets(
  period: Period,
  userId: string,
  holidays: Holiday[],
  absences: Absence[],
): DayTarget[] {
  const holidayMap = new Map(holidays.map((h) => [h.date, h.name]))
  return eachDate(parseDate(period.start), parseDate(period.end)).map((d) => {
    const date = toDateStr(d)
    const weekend = isWeekend(d)
    const holidayName = holidayMap.get(date)
    if (weekend || holidayName) {
      return {
        date,
        isWorkday: false,
        holidayName,
        targetHours: 0,
      }
    }
    // 평일
    const ab = absenceOnDate(absences, userId, date)
    if (ab) {
      const rule = ABSENCE_RULE[ab.type]
      const targetHours =
        rule.reducesTargetTo === null
          ? POLICY.dailyWorkHours
          : rule.reducesTargetTo
      return {
        date,
        isWorkday: true,
        targetHours,
        absenceType: ab.type,
      }
    }
    return { date, isWorkday: true, targetHours: POLICY.dailyWorkHours }
  })
}

/** 개인 월 목표시간 (동적 계산) */
export function monthlyTarget(
  period: Period,
  userId: string,
  holidays: Holiday[],
  absences: Absence[],
): number {
  return dayTargets(period, userId, holidays, absences).reduce(
    (sum, d) => sum + d.targetHours,
    0,
  )
}

/** 근무일수 (목표시간 > 0 인 평일 수, 반차는 0.5로 환산) */
export function workingDays(
  period: Period,
  userId: string,
  holidays: Holiday[],
  absences: Absence[],
): number {
  return dayTargets(period, userId, holidays, absences).reduce((sum, d) => {
    if (!d.isWorkday) return sum
    return sum + d.targetHours / POLICY.dailyWorkHours
  }, 0)
}

/** 한 근무기록의 실제 근무시간(휴게 제외, h). checkOut 없으면 0. */
export function workedHours(a: Attendance): number {
  if (!a.checkIn || !a.checkOut) return 0
  const presenceMin = hmToMin(a.checkOut) - hmToMin(a.checkIn)
  if (presenceMin <= 0) return 0
  const breakMin = presenceMin >= 4 * 60 ? POLICY.breakHours * 60 : 0
  return Math.max(0, presenceMin - breakMin) / 60
}

/** 출근시각 + (근무8h + 휴게1h)으로 예상 퇴근시각 'HH:mm' */
export function expectedCheckOut(checkIn: string): string {
  const min = hmToMin(checkIn) + (POLICY.dailyWorkHours + POLICY.breakHours) * 60
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface MonthSummary {
  target: number
  worked: number          // 실제 근무 + 인정시간 합
  progress: number        // 0~1+
  remaining: number       // target - worked (양수면 부족)
  workdaysTotal: number
  workdaysPassed: number  // 오늘까지 지난 근무일
  workdaysLeft: number
  neededPerDay: number    // 남은 근무일 하루평균 필요시간
  overtime: number        // worked - target (양수면 초과)
}

/** 개인 월 누적/진척 요약 */
export function monthSummary(
  period: Period,
  userId: string,
  holidays: Holiday[],
  absences: Absence[],
  attendances: Attendance[],
  today: string,
): MonthSummary {
  const target = monthlyTarget(period, userId, holidays, absences)

  // 실제 근무시간
  let worked = 0
  for (const a of attendances) {
    if (a.userId !== userId) continue
    if (!inRange(a.date, period.start, period.end)) continue
    worked += workedHours(a)
  }
  // 인정시간 (출장/공가)
  const targets = dayTargets(period, userId, holidays, absences)
  for (const dt of targets) {
    if (!dt.absenceType) continue
    const rule = ABSENCE_RULE[dt.absenceType as keyof typeof ABSENCE_RULE]
    worked += rule.recognizedHours
  }

  const workdaysTotal = targets.filter((d) => d.isWorkday).length
  const workdaysPassed = targets.filter(
    (d) => d.isWorkday && d.date <= today,
  ).length
  const workdaysLeft = targets.filter(
    (d) => d.isWorkday && d.date > today,
  ).length

  const remaining = Math.max(0, target - worked)
  const neededPerDay = workdaysLeft > 0 ? remaining / workdaysLeft : 0

  return {
    target,
    worked,
    progress: target > 0 ? worked / target : 0,
    remaining,
    workdaysTotal,
    workdaysPassed,
    workdaysLeft,
    neededPerDay,
    overtime: worked - target,
  }
}

/** 코어타임(10:00~15:00) 재석 여부 */
export function coversCoreTime(a: Attendance): boolean {
  if (!a.checkIn || !a.checkOut) return false
  const cs = hmToMin(POLICY.coreStart)
  const ce = hmToMin(POLICY.coreEnd)
  return hmToMin(a.checkIn) <= cs && hmToMin(a.checkOut) >= ce
}
