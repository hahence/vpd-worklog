import React, { useEffect, useState } from 'react'

const DISMISS_KEY = 'vpd-install-dismissed'

/** '홈 화면에 추가' 설치 유도 배너 (Android/Chrome: 네이티브 프롬프트, iOS: 안내) */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {
      /* ignore */
    }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (standalone) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS) {
      setIos(true)
      setShow(true)
    }

    const onPrompt = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    const onInstalled = () => setShow(false)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }
  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShow(false)
  }

  return (
    <div className="install-banner">
      <div className="install-ic">⏱</div>
      <div className="install-text">
        <b>WorkLog 앱 설치</b>
        <span>{ios ? '공유 버튼 → "홈 화면에 추가"' : '홈 화면에 추가해 앱처럼 사용하세요'}</span>
      </div>
      {!ios && deferred && (
        <button className="btn btn-primary btn-sm" onClick={install}>
          설치
        </button>
      )}
      <button className="install-x" onClick={dismiss} aria-label="닫기">
        ✕
      </button>
    </div>
  )
}
