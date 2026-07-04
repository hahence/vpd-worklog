import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useApp } from './store/AppStore'
import { Avatar } from './components/ui'
import { InstallPrompt } from './components/InstallPrompt'
import { LoginPage } from './pages/LoginPage'
import { TodayPage } from './pages/TodayPage'
import { MonthlyPage } from './pages/MonthlyPage'
import { AbsencePage } from './pages/AbsencePage'

interface Tab {
  key: string
  label: string
  icon: string
  webOnly?: boolean
}

const TABS: Tab[] = [
  { key: 'today', label: '오늘 근태', icon: '🕘' },
  { key: 'monthly', label: '월간 현황', icon: '📈', webOnly: true },
  { key: 'absence', label: '부재·연차', icon: '🗓️' },
]

/* ---- responsive hook ---- */
function useIsMobile(): boolean {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 860px)').matches
      : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const h = () => setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return m
}

/* ---- Toast ---- */
const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function App() {
  const { currentUser, teams, logout, resetDemo } = useApp()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState('today')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as any)._t)
    ;(showToast as any)._t = window.setTimeout(() => setToast(null), 1900)
  }, [])

  if (!currentUser) {
    return (
      <ToastCtx.Provider value={showToast}>
        <LoginPage />
        <InstallPrompt />
      </ToastCtx.Provider>
    )
  }

  const tabs = TABS.filter((t) => !(isMobile && t.webOnly))
  const activeTab = tabs.find((t) => t.key === tab) ? tab : tabs[0].key
  const team = teams.find((t) => t.id === currentUser.teamId)

  const renderPage = () => {
    if (activeTab === 'today') return <TodayPage />
    if (activeTab === 'monthly') return <MonthlyPage />
    if (activeTab === 'absence') return <AbsencePage />
    return null
  }

  const UserBox = () => (
    <div className="userpick" style={{ marginTop: 0 }}>
      <Avatar user={currentUser} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>
          {currentUser.name}
          {currentUser.title && <span className="tag-lead">{currentUser.title}</span>}
        </div>
        <div className="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {team?.name} · 사번 {currentUser.empId}
        </div>
      </div>
      <button className="btn btn-sm" onClick={logout}>로그아웃</button>
    </div>
  )

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

          <nav className="nav" style={{ marginTop: 10 }}>
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
            <UserBox />
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
              <div>
                <div className="brand-name" style={{ fontSize: 15 }}>WorkLog</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar user={currentUser} size={30} />
              <button className="btn btn-sm" onClick={logout}>로그아웃</button>
            </div>
          </header>

          <main className="content">
            <div className="content-inner">{renderPage()}</div>
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
        <InstallPrompt />
      </div>
    </ToastCtx.Provider>
  )
}
