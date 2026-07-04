import React, { useState } from 'react'
import { useApp } from '../store/AppStore'
import { useToast } from '../App'
import { ABSENCE_LABEL, ABSENCE_RULE } from '../domain/policy'
import type { AbsenceType } from '../domain/types'
import { fmtDateKr, todayStr } from '../domain/time'

const TYPES: AbsenceType[] = ['annual', 'half_am', 'half_pm', 'business', 'official', 'sick']

function effectText(t: AbsenceType): string {
  const r = ABSENCE_RULE[t]
  if (r.reducesTargetTo === 0) return '그날 목표 0h (근무일 제외)'
  if (r.reducesTargetTo === 4) return '그날 목표 4h'
  return `근무 ${r.recognizedHours}h 인정 (목표 유지)`
}

export function AbsencePage() {
  const app = useApp()
  const toast = useToast()
  const { currentUser } = app
  const today = todayStr()

  const [type, setType] = useState<AbsenceType>('annual')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [reason, setReason] = useState('')

  const isHalf = ABSENCE_RULE[type].isHalf

  const submit = () => {
    const s = start
    const e = isHalf ? start : end < start ? start : end
    app.addAbsence({
      userId: currentUser.id,
      startDate: s,
      endDate: e,
      type,
      reason: reason.trim() || undefined,
    })
    setReason('')
    toast(`${ABSENCE_LABEL[type]} 등록 완료`)
  }

  const myAbsences = app.absences
    .filter((a) => a.userId === currentUser.id)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">부재 · 연차</h1>
        <p className="page-sub">
          연동이 없으므로 근무일수·목표에 영향을 주는 부재를 직접 등록해요
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card card-pad-lg">
          <strong>새 부재 등록</strong>
          <div className="field" style={{ marginTop: 14 }}>
            <label>유형</label>
            <div className="segmented">
              {TYPES.map((t) => (
                <button
                  key={t}
                  className={`seg ${type === t ? 'on' : ''}`}
                  onClick={() => setType(t)}
                >
                  {ABSENCE_LABEL[t]}
                </button>
              ))}
            </div>
            <div className="small muted" style={{ marginTop: 8 }}>
              → {effectText(type)}
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>{isHalf ? '날짜' : '시작일'}</label>
              <input
                className="date-input"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            {!isHalf && (
              <div className="field">
                <label>종료일</label>
                <input
                  className="date-input"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="field">
            <label>사유 (선택)</label>
            <input
              className="text-input"
              placeholder="예: 가족 여행"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit}>
            등록하기
          </button>
        </div>

        <div className="card card-pad-lg">
          <strong>내 부재 목록</strong>
          <div style={{ marginTop: 10 }}>
            {myAbsences.length === 0 ? (
              <div className="empty">등록된 부재가 없어요</div>
            ) : (
              <div className="rowlist">
                {myAbsences.map((a) => {
                  const future = a.startDate > today
                  return (
                    <div className="rrow" key={a.id}>
                      <span className="chip absent">{ABSENCE_LABEL[a.type]}</span>
                      <div className="rtimes">
                        {a.startDate === a.endDate
                          ? fmtDateKr(a.startDate)
                          : `${fmtDateKr(a.startDate)} ~ ${fmtDateKr(a.endDate)}`}
                        {future && <span className="chip planned" style={{ marginLeft: 6 }}>예정</span>}
                        {a.reason && <div className="small muted">{a.reason}</div>}
                      </div>
                      <button
                        className="btn btn-sm"
                        onClick={() => app.removeAbsence(a.id)}
                      >
                        삭제
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
