import React, { useState } from 'react'
import { useApp } from '../store/AppStore'
import { Avatar, Progress } from '../components/ui'
import { getPeriod, monthSummary, shiftPeriod } from '../domain/calc'
import { fmtHours, todayStr } from '../domain/time'

export function MonthlyBoard() {
  const app = useApp()
  const today = todayStr()
  const [period, setPeriod] = useState(getPeriod(new Date()))
  const members = app.users.filter((u) => u.role === 'member')

  const rows = members
    .map((m) => ({
      m,
      s: monthSummary(period, m.id, app.holidays, app.absences, app.attendance, today),
    }))
    .sort((a, b) => b.s.progress - a.s.progress)

  const avg =
    rows.reduce((sum, r) => sum + r.s.progress, 0) / (rows.length || 1)

  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">월 누적 현황</h1>
          <p className="page-sub">
            각자 목표시간이 다르므로 <b>진척률(%)</b> 기준 비교 · {period.label}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn btn-sm" onClick={() => setPeriod(shiftPeriod(period, -1))}>← 이전</button>
          <button className="btn btn-sm" onClick={() => setPeriod(getPeriod(new Date()))}>이번 달</button>
          <button className="btn btn-sm" onClick={() => setPeriod(shiftPeriod(period, 1))}>다음 →</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="stat-row">
          <div className="stat">
            <div className="k">팀 평균 진척률</div>
            <div className="v">{Math.round(avg * 100)}<small>%</small></div>
          </div>
          <div className="stat">
            <div className="k">인원</div>
            <div className="v">{members.length}<small>명</small></div>
          </div>
          <div className="stat">
            <div className="k">목표 달성</div>
            <div className="v" style={{ color: 'var(--green)' }}>
              {rows.filter((r) => r.s.progress >= 1).length}<small>명</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad-lg">
        {rows.map(({ m, s }) => (
          <div className="rank" key={m.id}>
            <div className="who">
              <Avatar user={m} size={34} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                <div className="small muted">
                  {fmtHours(s.worked)} / {fmtHours(s.target)}
                </div>
              </div>
            </div>
            <div className="bar">
              <Progress
                value={s.progress}
                variant={s.progress >= 1 ? 'over' : s.progress < 0.5 ? 'low' : undefined}
              />
              <div className="small muted" style={{ marginTop: 5 }}>
                {s.workdaysLeft > 0
                  ? `남은 ${s.workdaysLeft}일 · 하루 ${fmtHours(s.neededPerDay)} 필요`
                  : `근무일 종료 · ${s.overtime >= 0 ? '목표 달성' : `${fmtHours(-s.overtime)} 부족`}`}
              </div>
            </div>
            <div className="pct" style={{ color: s.progress >= 1 ? 'var(--green)' : undefined }}>
              {Math.round(s.progress * 100)}%
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
