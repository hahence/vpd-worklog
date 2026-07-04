import React, { useState } from 'react'
import { useApp } from '../store/AppStore'
import { DEMO_EMPTY_TODAY_USER } from '../domain/seed'

export function LoginPage() {
  const app = useApp()
  const [empId, setEmpId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const valid = /^\d{5,6}$/.test(empId)

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!valid) {
      setError('사번은 숫자 5~6자리예요')
      return
    }
    const u = app.login(empId)
    if (!u) setError('등록되지 않은 사번이에요')
  }

  const demoUser = app.users.find((u) => u.id === DEMO_EMPTY_TODAY_USER)

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">⏱</div>
        <h1 className="login-title">WorkLog</h1>
        <p className="login-sub">유연근무 출퇴근 · 사번으로 로그인</p>

        <label className="login-label">사번</label>
        <input
          className="login-input"
          inputMode="numeric"
          autoFocus
          placeholder="사번 5~6자리"
          value={empId}
          maxLength={6}
          onChange={(e) => {
            setEmpId(e.target.value.replace(/[^\d]/g, ''))
            setError(null)
          }}
        />
        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn btn-primary login-btn" disabled={!valid}>
          로그인
        </button>

        <div className="login-demo">
          <div className="login-demo-title">데모 계정</div>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            {demoUser && (
              <button type="button" className="btn btn-sm" onClick={() => app.login(demoUser.empId)}>
                {demoUser.name} · {demoUser.empId}
              </button>
            )}
            {app.users
              .filter((u) => u.id !== DEMO_EMPTY_TODAY_USER)
              .slice(0, 3)
              .map((u) => (
                <button key={u.id} type="button" className="btn btn-sm" onClick={() => app.login(u.empId)}>
                  {u.name} · {u.empId}
                </button>
              ))}
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>
            1VPD실 명단 {app.users.length}명 반영됨 · 본인 사번으로 로그인하세요
          </div>
        </div>
      </form>
    </div>
  )
}
