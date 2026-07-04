import React, { useState } from 'react'
import { useApp } from '../store/AppStore'
import { useToast } from '../App'
import { Progress, WorkTypeChip } from '../components/ui'
import { WORK_TYPE_ICON, WORK_TYPE_LABEL } from '../domain/policy'
import type { WorkType } from '../domain/types'
import {
  expectedCheckOut,
  getPeriod,
  monthSummary,
} from '../domain/calc'
import { fmtHours, hmToMin, todayStr, weekdayKr } from '../domain/time'

const WORK_TYPES: WorkType[] = ['office', 'remote', 'field']

export function MemberHome() {
  const app = useApp()
  const toast = useToast()
  const { currentUser } = app
  const today = todayStr()
  const rec = app.todayRecord(currentUser.id)

  const now = new Date()
  const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`

  const [workType, setWorkType] = useState<WorkType>(rec?.workType ?? 'office')
  const [editing, setEditing] = useState(false)
  const [inTime, setInTime] = useState(rec?.checkIn ?? currentUser.defaultCheckIn)
  const [outTime, setOutTime] = useState(
    rec?.checkOut ?? expectedCheckOut(currentUser.defaultCheckIn),
  )

  const period = getPeriod(new Date())
  const summary = monthSummary(
    period,
    currentUser.id,
    app.holidays,
    app.absences,
    app.attendance,
    today,
  )

  const doCheckIn = () => {
    app.checkIn(currentUser.id, nowHm, workType)
    app.checkOut(currentUser.id, expectedCheckOut(nowHm), true)
    toast(`출근 기록 완료 · ${nowHm}`)
  }
  const doCheckOut = () => {
    app.checkOut(currentUser.id, nowHm, false)
    toast(`퇴근 기록 완료 · ${nowHm}`)
  }
  const saveEdit = () => {
    app.upsertAttendance({
      userId: currentUser.id,
      date: today,
      checkIn: inTime,
      checkOut: outTime,
      checkOutPlanned: rec?.checkOutPlanned ?? true,
      workType,
    })
    setEditing(false)
    toast('시각을 수정했어요')
  }

  const checkedIn = !!rec?.checkIn
  const checkedOut = !!rec?.checkOut && !rec?.checkOutPlanned
  const expOut = rec?.checkIn ? expectedCheckOut(rec.checkIn) : null
  const lateCore =
    rec?.checkOut && hmToMin(rec.checkOut) >= hmToMin('15:00')

  const progressVariant =
    summary.progress >= 1 ? 'over' : summary.progress < 0.5 ? 'low' : undefined

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">안녕하세요, {currentUser.name}님 👋</h1>
        <p className="page-sub">
          {now.getMonth() + 1}월 {now.getDate()}일 ({weekdayKr(now)}) · 코어타임 10:00–15:00
        </p>
      </div>

      <div className="grid grid-2">
        {/* Check-in hero */}
        <div className="hero">
          <div className="date">오늘</div>
          <div className="clock">{nowHm}</div>
          <div className="status-line">
            {!checkedIn && '아직 출근 기록 전이에요'}
            {checkedIn && !checkedOut && (
              <>출근 {rec!.checkIn} · 예상 퇴근 {expOut} 🕕</>
            )}
            {checkedOut && <>오늘 근무 완료 · {rec!.checkIn}–{rec!.checkOut} 👏</>}
          </div>
          <div className="hero-actions">
            {!checkedIn ? (
              <button className="btn-hero solid" onClick={doCheckIn}>
                지금 출근하기
              </button>
            ) : !checkedOut ? (
              <>
                <button className="btn-hero" onClick={() => setEditing((v) => !v)}>
                  시각 수정
                </button>
                <button className="btn-hero solid" onClick={doCheckOut}>
                  지금 퇴근하기
                </button>
              </>
            ) : (
              <button className="btn-hero" onClick={() => setEditing((v) => !v)}>
                기록 수정
              </button>
            )}
          </div>
        </div>

        {/* Today detail / edit */}
        <div className="card card-pad-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>오늘 근무</strong>
            {checkedIn && (
              <button className="btn-ghost" onClick={() => setEditing((v) => !v)}>
                {editing ? '닫기' : '직접 입력'}
              </button>
            )}
          </div>

          {!editing && (
            <div style={{ marginTop: 14 }}>
              {checkedIn ? (
                <>
                  <div className="mcard-times" style={{ marginBottom: 12 }}>
                    <div>
                      <div className="t">출근</div>
                      <div className="tv">{rec!.checkIn}</div>
                    </div>
                    <div>
                      <div className="t">{rec!.checkOutPlanned ? '예상 퇴근' : '퇴근'}</div>
                      <div className="tv">{rec!.checkOut ?? '—'}</div>
                    </div>
                  </div>
                  <div className="btn-row">
                    <WorkTypeChip type={rec!.workType} />
                    {rec!.checkOutPlanned && <span className="chip planned">예정</span>}
                    {lateCore && <span className="chip core-ok">코어타임 이후 퇴근</span>}
                  </div>
                </>
              ) : (
                <div className="empty" style={{ padding: 20 }}>
                  <b>지금 출근하기</b>를 누르거나
                  <br />
                  <button className="btn-ghost" onClick={() => setEditing(true)}>
                    직접 시각 입력
                  </button>
                </div>
              )}
            </div>
          )}

          {editing && (
            <div style={{ marginTop: 14 }}>
              <div className="row-2">
                <div className="field">
                  <label>출근</label>
                  <input
                    className="time-input"
                    type="time"
                    value={inTime}
                    onChange={(e) => {
                      setInTime(e.target.value)
                      setOutTime(expectedCheckOut(e.target.value))
                    }}
                  />
                </div>
                <div className="field">
                  <label>퇴근(예정)</label>
                  <input
                    className="time-input"
                    type="time"
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>근무 형태</label>
                <div className="segmented">
                  {WORK_TYPES.map((wt) => (
                    <button
                      key={wt}
                      className={`seg ${workType === wt ? 'on' : ''}`}
                      onClick={() => setWorkType(wt)}
                    >
                      {WORK_TYPE_ICON[wt]} {WORK_TYPE_LABEL[wt]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="small muted" style={{ marginBottom: 10 }}>
                예상 퇴근 = 출근 + 근무 8h + 휴게 1h
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveEdit}>
                저장
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Monthly summary */}
      <div className="section-title">이번 기준월 · {period.label}</div>
      <div className="card card-pad-lg">
        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="stat">
            <div className="k">누적 근무</div>
            <div className="v">
              {fmtHours(summary.worked)}
            </div>
          </div>
          <div className="stat">
            <div className="k">월 목표</div>
            <div className="v">
              {fmtHours(summary.target)}
            </div>
          </div>
          <div className="stat">
            <div className="k">진척률</div>
            <div className="v" style={{ color: summary.progress >= 1 ? 'var(--green)' : undefined }}>
              {Math.round(summary.progress * 100)}
              <small>%</small>
            </div>
          </div>
          <div className="stat">
            <div className="k">{summary.overtime >= 0 ? '초과' : '남은 근무'}</div>
            <div className="v" style={{ color: summary.overtime >= 0 ? 'var(--green)' : 'var(--amber)' }}>
              {fmtHours(Math.abs(summary.overtime))}
            </div>
          </div>
        </div>
        <Progress value={summary.progress} variant={progressVariant} />
        <div className="small muted" style={{ marginTop: 12 }}>
          {summary.workdaysLeft > 0 ? (
            <>
              남은 근무일 <b>{summary.workdaysLeft}일</b> · 하루 평균{' '}
              <b style={{ color: 'var(--accent-600)' }}>{fmtHours(summary.neededPerDay)}</b>{' '}
              근무 시 목표 달성 (근무일 {summary.workdaysPassed}/{summary.workdaysTotal})
            </>
          ) : (
            <>기준월 근무일이 모두 지났어요 · 총 근무일 {summary.workdaysTotal}일</>
          )}
        </div>
      </div>
    </>
  )
}
