import type { AbsenceType, WorkType } from './types'

export const POLICY = {
  coreStart: '10:00',
  coreEnd: '15:00',
  /** 하루 근무시간(휴게 제외) */
  dailyWorkHours: 8,
  /** 휴게시간 (재석 = 근무 + 휴게) */
  breakHours: 1,
  /** 기준월: 전월 20일 ~ 당월 19일 */
  periodStartDay: 20,
  periodEndDay: 19,
} as const

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  office: '사무실',
  remote: '재택',
  field: '외근',
}

export const WORK_TYPE_ICON: Record<WorkType, string> = {
  office: '🏢',
  remote: '🏠',
  field: '🚗',
}

export const ABSENCE_LABEL: Record<AbsenceType, string> = {
  annual: '연차',
  half_am: '반차(오전)',
  half_pm: '반차(오후)',
  business: '출장',
  official: '공가',
  sick: '병가',
}

/**
 * 부재 유형이 해당일의 "목표 근무시간"에 미치는 영향.
 * - reducesTargetTo: 그날 목표를 이 값(h)으로 대체 (연차 0h, 반차 4h)
 * - null 이면 목표는 그대로 8h 유지하되, recognizedHours 만큼 근무로 인정
 */
export const ABSENCE_RULE: Record<
  AbsenceType,
  { reducesTargetTo: number | null; recognizedHours: number; isHalf: boolean }
> = {
  annual: { reducesTargetTo: 0, recognizedHours: 0, isHalf: false },
  half_am: { reducesTargetTo: 4, recognizedHours: 0, isHalf: true },
  half_pm: { reducesTargetTo: 4, recognizedHours: 0, isHalf: true },
  business: { reducesTargetTo: null, recognizedHours: 8, isHalf: false },
  official: { reducesTargetTo: null, recognizedHours: 8, isHalf: false },
  sick: { reducesTargetTo: 0, recognizedHours: 0, isHalf: false },
}
