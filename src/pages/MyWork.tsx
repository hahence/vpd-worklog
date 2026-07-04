import React, { useState } from 'react'
import { useApp } from '../store/AppStore'
import { Progress, WorkTypeChip } from '../components/ui'
import { ABSENCE_LABEL } from '../domain/policy'
import {
  getPeriod,
  monthSummary,
  restInfo,
  shiftPeriod,
  workedHours,
} from '../domain/calc'
import { fmtDateKr, fmtHours, todayStr } from '../domain/time'

export function MyWork({ embed = false }: { embed?: boolean }) {
  const app = useApp()
  const currentUser = app.currentUser!
  const today = todayStr()
  const [period, setPeriod] = useState(getPeriod(new Date()))

  const summary = monthSummary(
    period,
    currentUser.id,
    app.holidays,
    app.absences,
    app.attendance,
    today,
  )

  const records = app.attendance
    .filter(
      (a) =>
        a.userId === currentUser.id &&
        a.date >= period.start &&
        a.date <= period.end,
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const myAbsences = app.absences.filter(
    (a) =>
      a.userId === currentUser.id &&
      a.startDate <= period.end &&
      a.endDate >= period.start,
  )

  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        <div>
          {!embed && <h1 className="page-title">내 근무</h1>}
          <p className="page-sub" style={embed ? { marginTop: 0 } : undefined}>
            {currentUser.name} · 기준월 {period.label}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn btn-sm" onClick={() => setPeriod(shiftPeriod(period, -1))}>← 이전</button>
          <button className="btn btn-sm" onClick={() => setPeriod(getPeriod(new Date()))}>이번 달</button>
          <button className="btn btn-sm" onClick={() => setPeriod(shiftPeriod(period, 1))}>다음 →</button>
        </div>
      </div>

      <div className="card card-pad-lg" style={{ marginBottom: 18 }}>
        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="stat">
            <div className="k">누적 근무</div>
            <div className="v">{fmtHours(summary.worked)}</div>
          </div>
          <div className="stat">
            <div className="k">월 목표</div>
            <div className="v">{fmtHours(summary.target)}</div>
          </div>
          <div className="stat">
            <div className="k">근무일</div>
            <div className="v">
              {summary.workdaysPassed}<small>/{summary.workdaysTotal}일</small>
            </div>
          </div>
          <div className="stat">
            <div className="k">진척률</div>
            <div className="v" style={{ color: summary.progress >= 1 ? 'var(--green)' : undefined }}>
              {Math.round(summary.progress * 100)}<small>%</small>
            </div>
          </div>
        </div>
        <Progress
          value={summary.progress}
          variant={summary.progress >= 1 ? 'over' : summary.progress < 0.5 ? 'low' : undefined}
        />
      </div>

      {myAbsences.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 8 }}>부재 · 연차</div>
          <div className="card">
            <div className="rowlist">
              {myAbsences.map((a) => (
                <div className="rrow" key={a.id}>
                  <span className="chip absent">{ABSENCE_LABEL[a.type]}</span>
                  <div className="rtimes">
                    {a.startDate === a.endDate
                      ? fmtDateKr(a.startDate)
                      : `${fmtDateKr(a.startDate)} ~ ${fmtDateKr(a.endDate)}`}
                    {a.reason && <span className="muted"> · {a.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-title">일별 기록</div>
      <div className="card">
        {records.length === 0 ? (
          <div className="empty">이 기준월의 근무 기록이 없어요</div>
        ) : (
          <div className="rowlist">
            {records.map((r) => {
              const rest = restInfo(app.holidays, r.date)
              return (
                <div className="rrow" key={r.id}>
                  <span className={`rdate ${rest.isRest ? 'wknd' : ''}`}>{fmtDateKr(r.date)}</span>
                  <span className="rtimes">
                    {r.checkIn ?? '—'} – {r.checkOut ?? '—'}
                    {rest.isRest && (
                      <span className="chip rest" style={{ marginLeft: 8 }}>{rest.label}</span>
                    )}
                    {r.checkOutPlanned && r.date === today && (
                      <span className="chip planned" style={{ marginLeft: 8 }}>예정</span>
                    )}
                  </span>
                  <WorkTypeChip type={r.workType} />
                  <span className="rh" style={{ width: 62, textAlign: 'right' }}>
                    {fmtHours(workedHours(r))}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
