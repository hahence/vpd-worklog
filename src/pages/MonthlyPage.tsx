import React, { useState } from 'react'
import { MonthlyBoard } from './MonthlyBoard'
import { MyWork } from './MyWork'

type Sub = 'team' | 'me'

export function MonthlyPage() {
  const [sub, setSub] = useState<Sub>('team')

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">월간 현황</h1>
        <p className="page-sub">팀 월간 근무시간 현황과 내 월간 이력을 확인해요</p>
      </div>

      <div className="role-switch" style={{ maxWidth: 320, marginBottom: 20 }}>
        <button className={sub === 'team' ? 'on' : ''} onClick={() => setSub('team')}>
          팀 월간 현황
        </button>
        <button className={sub === 'me' ? 'on' : ''} onClick={() => setSub('me')}>
          내 월간 이력
        </button>
      </div>

      {sub === 'team' ? <MonthlyBoard embed /> : <MyWork embed />}
    </>
  )
}
