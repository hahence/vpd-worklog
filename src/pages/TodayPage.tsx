import React, { useMemo, useState } from 'react'
import { useApp } from '../store/AppStore'
import { useToast } from '../App'
import { Avatar, WorkTypeChip } from '../components/ui'
import { WORK_TYPE_ICON, WORK_TYPE_LABEL, ABSENCE_LABEL, regionDefault } from '../domain/policy'
import type { Absence, WorkType } from '../domain/types'
import { coversCoreTime, restInfo } from '../domain/calc'
import { todayStr, weekdayKr } from '../domain/time'

const WORK_TYPES: WorkType[] = ['office', 'remote', 'field']

function absenceToday(absences: Absence[], userId: string, date: string) {
  return absences.find((a) => a.userId === userId && date >= a.startDate && date <= a.endDate)
}

export function TodayPage() {
  const app = useApp()
  const toast = useToast()
  const me = app.currentUser!
  const today = todayStr()
  const now = new Date()

  const def = regionDefault(me.region)
  const rec = app.todayRecord(me.id)
  const team = app.teams.find((t) => t.id === me.teamId)!

  const [inTime, setInTime] = useState(rec?.checkIn ?? def.checkIn)
  const [outTime, setOutTime] = useState(rec?.checkOut ?? def.checkOut)
  const [workType, setWorkType] = useState<WorkType>(rec?.workType ?? 'office')
  const [query, setQuery] = useState('')

  const rest = restInfo(app.holidays, today)

  const savedDefault = !!rec && rec.checkIn === def.checkIn && rec.checkOut === def.checkOut
  const changed =
    !rec || inTime !== rec.checkIn || outTime !== rec.checkOut || workType !== rec.workType

  const save = () => {
    app.saveToday(me.id, { checkIn: inTime, checkOut: outTime, workType })
    toast(`오늘 근태 저장 · ${inTime}–${outTime}`)
  }
  const saveDefault = () => {
    setInTime(def.checkIn)
    setOutTime(def.checkOut)
    app.saveToday(me.id, { checkIn: def.checkIn, checkOut: def.checkOut, workType })
    toast(`기본 시간으로 저장 · ${def.checkIn}–${def.checkOut}`)
  }

  // 팀 오늘 근태 목록 (가나다순 + 이름 검색)
  const members = app.teamMembers(me.teamId)
  const filtered = useMemo(
    () => members.filter((m) => m.name.includes(query.trim())),
    [members, query],
  )

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          오늘 근태
          {rest.isRest && (
            <span className="chip holiday-badge" style={{ marginLeft: 10, verticalAlign: 'middle' }}>
              🌙 휴일 · {rest.label}
            </span>
          )}
        </h1>
        <p className="page-sub">
          {team.name} · {me.region} · {now.getMonth() + 1}월 {now.getDate()}일 ({weekdayKr(now)}) ·
          코어타임 10:00–15:00
        </p>
      </div>

      {/* 내 입력 카드 */}
      <div className="card card-pad-lg" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Avatar user={me} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{me.name}</div>
            <div className="small muted">
              기본 {def.checkIn}–{def.checkOut} ({me.region})
            </div>
          </div>
          {rec && <span className="chip core-ok">저장됨</span>}
        </div>

        {rest.isRest && (
          <div className="rest-note">
            오늘은 <b>{rest.holiday ?? weekdayKr(now) + '요일'}</b> 휴일이에요. 근무한 경우에만 입력하세요.
          </div>
        )}

        <div className="row-2">
          <div className="field">
            <label>출근</label>
            <input className="time-input" type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} />
          </div>
          <div className="field">
            <label>퇴근</label>
            <input className="time-input" type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>근무 형태</label>
          <div className="segmented">
            {WORK_TYPES.map((wt) => (
              <button key={wt} className={`seg ${workType === wt ? 'on' : ''}`} onClick={() => setWorkType(wt)}>
                {WORK_TYPE_ICON[wt]} {WORK_TYPE_LABEL[wt]}
              </button>
            ))}
          </div>
        </div>

        <div className="small muted" style={{ marginBottom: 12 }}>
          평소와 같으면 <b>기본값 그대로 저장</b>, 일찍 왔거나 늦게 갈 땐 그 시간만 바꾸세요.
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={!changed && !!rec}>
            {rec ? '수정 저장' : '오늘 근태 저장'}
          </button>
          {!savedDefault && (
            <button className="btn" onClick={saveDefault}>
              기본 {def.checkIn}–{def.checkOut}로
            </button>
          )}
        </div>
      </div>

      {/* 팀 오늘 근태 목록 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>
          우리 팀 오늘 근태 · {members.length}명
        </div>
      </div>
      <input
        className="text-input"
        style={{ marginBottom: 12 }}
        placeholder="🔍 이름으로 찾기"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">검색 결과가 없어요</div>
        ) : (
          <div className="rowlist">
            {filtered.map((m) => {
              const r = app.todayRecord(m.id, today)
              const ab = absenceToday(app.absences, m.id, today)
              const fullAbsent = ab && (ab.type === 'annual' || ab.type === 'sick')
              const core = r ? coversCoreTime(r) : false
              const isMe = m.id === me.id
              return (
                <div className="trow" key={m.id}>
                  <Avatar user={m} size={38} />
                  <div className="trow-main">
                    <div className="trow-name">
                      {m.name}
                      {m.title && <span className="tag-lead">{m.title}</span>}
                      {isMe && <span className="tag-me">나</span>}
                    </div>
                    <div className="trow-times">
                      {fullAbsent ? (
                        <span className="muted">{ABSENCE_LABEL[ab!.type]} {ab!.reason ? `· ${ab!.reason}` : ''}</span>
                      ) : r?.checkIn ? (
                        <>
                          {r.checkIn} – {r.checkOut ?? '—'}
                          {r.checkOutPlanned && <span className="chip planned" style={{ marginLeft: 6 }}>예정</span>}
                        </>
                      ) : (
                        <span className="muted">미입력</span>
                      )}
                    </div>
                  </div>
                  <div className="trow-side">
                    {fullAbsent ? (
                      <span className="chip absent">{ABSENCE_LABEL[ab!.type]}</span>
                    ) : (
                      <>
                        {r && <WorkTypeChip type={r.workType} />}
                        {r?.checkIn ? (
                          <span className={`chip ${core ? 'core-ok' : 'core-no'}`}>
                            {core ? '코어 ✓' : '코어 미충족'}
                          </span>
                        ) : (
                          <span className="chip">미출근</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
