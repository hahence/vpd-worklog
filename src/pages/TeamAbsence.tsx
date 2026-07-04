import React from 'react'
import { useApp } from '../store/AppStore'
import { Avatar } from '../components/ui'
import { ABSENCE_LABEL } from '../domain/policy'
import { fmtDateKr, todayStr } from '../domain/time'

export function TeamAbsence() {
  const app = useApp()
  const today = todayStr()

  const rows = app.absences
    .filter((a) => a.endDate >= today)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))

  const userById = (id: string) => app.users.find((u) => u.id === id)!

  const ongoing = rows.filter((a) => a.startDate <= today && a.endDate >= today)
  const upcoming = rows.filter((a) => a.startDate > today)

  const Item = ({ a }: { a: (typeof rows)[number] }) => {
    const u = userById(a.userId)
    return (
      <div className="rrow">
        <Avatar user={u} size={34} />
        <div className="rtimes">
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{u.name}</div>
          <div className="small muted">
            {a.startDate === a.endDate
              ? fmtDateKr(a.startDate)
              : `${fmtDateKr(a.startDate)} ~ ${fmtDateKr(a.endDate)}`}
            {a.reason && ` · ${a.reason}`}
          </div>
        </div>
        <span className="chip absent">{ABSENCE_LABEL[a.type]}</span>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">팀 부재 예정</h1>
        <p className="page-sub">이번 주 이후 팀원의 연차·출장·부재 현황</p>
      </div>

      <div className="section-title">진행 중</div>
      <div className="card">
        {ongoing.length === 0 ? (
          <div className="empty">오늘 부재 중인 팀원이 없어요</div>
        ) : (
          <div className="rowlist">{ongoing.map((a) => <Item key={a.id} a={a} />)}</div>
        )}
      </div>

      <div className="section-title">예정</div>
      <div className="card">
        {upcoming.length === 0 ? (
          <div className="empty">예정된 부재가 없어요</div>
        ) : (
          <div className="rowlist">{upcoming.map((a) => <Item key={a.id} a={a} />)}</div>
        )}
      </div>
    </>
  )
}
