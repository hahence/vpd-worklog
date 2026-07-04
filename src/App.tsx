import React, { createContext, useContext, useState, useCallback } from 'react'
import { useApp } from './store/AppStore'
import { Avatar } from './components/ui'
import { MemberHome } from './pages/MemberHome'
import { MyWork } from './pages/MyWork'
import { AbsencePage } from './pages/AbsencePage'
import { Dashboard } from './pages/Dashboard'
import { MonthlyBoard } from './pages/MonthlyBoard'
import { TeamAbsence } from './pages/TeamAbsence'

type Role = 'member' | 'manager'

const MEMBER_TABS = [
  { key: 'home', label: '홈', icon: '🏠' },
  { key: 'absence', label: '부재·연차', icon: '🗓️' },
  { key: 'mywork', label: '내 근무', icon: '📊' },
]
const MANAGER_TABS = [
  { key: 'dashboard', label: '오늘 현황', icon: '📋' },
  { key: 'monthly', label: '월 누적', icon: '📈' },
  { key: 'teamabs', label: '팀 부재', icon: '🗓️' },
]

/* ---- Toast ---- */
const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function App() {
  const { currentUser, users, currentUserId, setCurrentUserId, resetDemo } = useApp()
  const [role, setRole] = useState<Role>('member')
  const [tab, setTab] = useState('home')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as any)._t)
    ;(showToast as any)._t = window.setTimeout(() => setToast(null), 1900)
  }, [])

  const tabs = role === 'member' ? MEMBER_TABS : MANAGER_TABS
  const activeTab = tabs.find((t) => t.key === tab) ? tab : tabs[0].key

  const switchRole = (r: Role) => {
    setRole(r)
    setTab(r === 'member' ? 'home' : 'dashboard')
  }

  const members = users.filter((u) => u.role === 'member')

  const renderPage = () => {
    if (role === 'member') {
      if (activeTab === 'home') return <MemberHome />
      if (activeTab === 'absence') return <AbsencePage />
      if (activeTab === 'mywork') return <MyWork />
    } else {
      if (activeTab === 'dashboard') return <Dashboard />
      if (activeTab === 'monthly') return <MonthlyBoard />
      if (activeTab === 'teamabs') return <TeamAbsence />
    }
    return null
  }

  return (
    <ToastCtx.Provider value={showToast}>
      <div className="shell">
        {/* Sidebar (desktop) */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">⏱</div>
            <div>
              <div className="brand-name">WorkLog</div>
              <div className="brand-sub">유연근무 출퇴근</div>
            </div>
          </div>

          <div className="role-switch">
            <button className={role === 'member' ? 'on' : ''} onClick={() => switchRole('member')}>
              구성원
            </button>
            <button className={role === 'manager' ? 'on' : ''} onClick={() => switchRole('manager')}>
              팀장
            </button>
          </div>

          <nav className="nav" style={{ marginTop: 16 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`nav-item ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <span className="ic">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-foot">
            {role === 'member' ? (
              <div className="userpick">
                <Avatar user={currentUser} size={30} />
                <select
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="userpick">
                <Avatar user={users[0]} size={30} />
                <div style={{ flex: 1, fontWeight: 600 }}>{users[0].name} 팀장</div>
              </div>
            )}
            <button className="btn btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={resetDemo}>
              데모 데이터 초기화
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="main">
          {/* Topbar (mobile) */}
          <header className="topbar">
            <div className="brand" style={{ padding: 0 }}>
              <div className="brand-logo" style={{ width: 30, height: 30, fontSize: 16 }}>⏱</div>
              <div className="brand-name" style={{ fontSize: 15 }}>WorkLog</div>
            </div>
            <div className="role-switch" style={{ width: 160 }}>
              <button className={role === 'member' ? 'on' : ''} onClick={() => switchRole('member')}>
                구성원
              </button>
              <button className={role === 'manager' ? 'on' : ''} onClick={() => switchRole('manager')}>
                팀장
              </button>
            </div>
          </header>

          <main className="content">
            <div className="content-inner">
              {role === 'member' && (
                <div className="only-mobile" style={{ marginBottom: 14 }}>
                  <div className="userpick" style={{ marginTop: 0 }}>
                    <Avatar user={currentUser} size={28} />
                    <select value={currentUserId} onChange={(e) => setCurrentUserId(e.target.value)}>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {renderPage()}
            </div>
          </main>
        </div>

        {/* Bottom nav (mobile) */}
        <nav className="botnav">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={activeTab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              <span className="ic">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </ToastCtx.Provider>
  )
}
