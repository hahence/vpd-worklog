import React from 'react'
import type { User, WorkType } from '../domain/types'
import { WORK_TYPE_ICON, WORK_TYPE_LABEL } from '../domain/policy'

export function Avatar({ user, size = 38 }: { user: User; size?: number }) {
  // 테마(레드/블랙/화이트): 리더·직책자는 레드, 일반 구성원은 블랙
  const bg = user.title ? '#e34955' : '#17171a'
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}
    >
      {user.name.slice(0, 1)}
    </div>
  )
}

export function Progress({
  value,
  variant,
  thin,
}: {
  value: number
  variant?: 'over' | 'low'
  thin?: boolean
}) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div className={`progress ${thin ? 'thin' : ''}`}>
      <span
        className={variant ?? ''}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function WorkTypeChip({ type }: { type: WorkType }) {
  return (
    <span className={`chip ${type}`}>
      {WORK_TYPE_ICON[type]} {WORK_TYPE_LABEL[type]}
    </span>
  )
}
