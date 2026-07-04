import React from 'react'
import { useApp } from '../store/AppStore'
import { Avatar, WorkTypeChip } from '../components/ui'
import { ABSENCE_LABEL } from '../domain/policy'
import { coversCoreTime, expectedCheckOut } from '../domain/calc'
import { todayStr, weekdayKr } from '../domain/time'
import type { Absence } from '../domain/types'

function absenceToday(absences: Absence[], userId: string, date: string) {
  return absences.find(
    (a) => a.userId === userId && date >= a.startDate && date <= a.endDate,
  )
}

export function Dashboard() {
  const app = useApp()
  const today = todayStr()
  const now = new Date()
  const members = app.users.filter((u) => u.role === 'member')

  let inCount = 0
  let coreOk = 0
  let absentCount = 0

  const cards = members.map((m) => {
    const rec = app.todayRecord(m.id, today)
    const ab = absenceToday(app.absences, m.id, today)
    if (ab && (ab.type === 'annual' || ab.type === 'sick')) absentCount++
    if (rec?.checkIn) inCount++
    if (rec && coversCoreTime(rec)) coreOk++
    return { m, rec, ab }
  })

  const working = members.length - absentCount

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">오늘 현황 보드</h1>
        <p className="page-sub">
          프로덕트 1팀 · {now.getMonth() + 1}월 {now.getDate()}일 ({weekdayKr(now)}) · 코어타임 10:00–15:00
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="stat">
            <div className="k">출근 완료</div>
            <div className="v">{inCount}<small>/{working}명</small></div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="k">코어타임 재석</div>
            <div className="v" style={{ color: 'var(--green)' }}>{coreOk}<small>명</small></div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="k">오늘 부재</div>
            <div className="v" style={{ color: absentCount ? 'var(--red)' : undefined }}>
              {absentCount}<small>명</small>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-auto">
        {cards.map(({ m, rec, ab }) => {
          const fullAbsent = ab && (ab.type === 'annual' || ab.type === 'sick')
          const core = rec ? coversCoreTime(rec) : false
          return (
            <div className="card mcard" key={m.id}>
              <div className="mcard-head">
                <Avatar user={m} size={42} />
                <div style={{ flex: 1 }}>
                  <div className="mcard-name">{m.name}</div>
                  <div className="mcard-role">
                    {fullAbsent ? (
                      <span className="chip absent">{ABSENCE_LABEL[ab!.type]}</span>
                    ) : rec?.checkIn ? (
                      <span>
                        <span className={`dot ${rec.checkOutPlanned ? 'in' : 'out'}`} />{' '}
                        {rec.checkOutPlanned ? '근무 중' : '퇴근'}
                      </span>
                    ) : (
                      <span><span className="dot none" /> 미출근</span>
                    )}
                  </div>
                </div>
              </div>

              {fullAbsent ? (
                <div className="muted small" style={{ padding: '6px 0' }}>
                  {ab!.reason ?? '오늘 부재'}
                </div>
              ) : (
                <>
                  <div className="mcard-times">
                    <div>
                      <div className="t">출근</div>
                      <div className="tv">{rec?.checkIn ?? '—'}</div>
                    </div>
                    <div>
                      <div className="t">{rec?.checkOutPlanned ? '예상 퇴근' : '퇴근'}</div>
                      <div className="tv">
                        {rec?.checkOut ?? (rec?.checkIn ? expectedCheckOut(rec.checkIn) : '—')}
                      </div>
                    </div>
                  </div>
                  <div className="mcard-foot">
                    {rec ? <WorkTypeChip type={rec.workType} /> : <span className="chip">미입력</span>}
                    {ab && !fullAbsent && (
                      <span className="chip absent">{ABSENCE_LABEL[ab.type]}</span>
                    )}
                    {rec?.checkIn && (
                      <span className={`chip ${core ? 'core-ok' : 'core-no'}`}>
                        {core ? '코어타임 ✓' : '코어 미충족'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
