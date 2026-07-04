export type Role = 'member' | 'manager'

export type WorkType = 'office' | 'remote' | 'field'

export type AbsenceType =
  | 'annual'      // 연차(종일)
  | 'half_am'     // 반차(오전)
  | 'half_pm'     // 반차(오후)
  | 'business'    // 출장
  | 'official'    // 공가
  | 'sick'        // 병가

export interface User {
  id: string
  /** 사번 5~6자리 (로그인 ID) */
  empId: string
  name: string
  teamId: string
  role: Role
  color: string
  /** 근무 지역 (기본 출퇴근시각을 결정) */
  region: string
  /** 개인 평소 출근시각 HH:mm (지역 기본값 기반) */
  defaultCheckIn: string
  /** 개인 평소 퇴근시각 HH:mm (지역 기본값 기반) */
  defaultCheckOut: string
}

export interface Team {
  id: string
  name: string
  region: string
}

export interface Attendance {
  id: string
  userId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm | null */
  checkIn: string | null
  /** HH:mm | null */
  checkOut: string | null
  /** 퇴근시각이 예정(true)인지 실제(false)인지 */
  checkOutPlanned: boolean
  workType: WorkType
  note?: string
  updatedAt: string
}

export interface Absence {
  id: string
  userId: string
  /** YYYY-MM-DD */
  startDate: string
  endDate: string
  type: AbsenceType
  reason?: string
}

export interface Holiday {
  /** YYYY-MM-DD */
  date: string
  name: string
}
