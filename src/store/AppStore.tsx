import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  Absence,
  Attendance,
  Holiday,
  Team,
  User,
  WorkType,
} from '../domain/types'
import {
  absences as seedAbsences,
  attendance as seedAttendance,
  holidays as seedHolidays,
  teams as seedTeams,
  users as seedUsers,
} from '../domain/seed'
import { todayStr } from '../domain/time'

const STORAGE_KEY = 'vpd-worklog-v1'

interface PersistShape {
  attendance: Attendance[]
  absences: Absence[]
}

interface AppState {
  users: User[]
  teams: Team[]
  holidays: Holiday[]
  attendance: Attendance[]
  absences: Absence[]
  currentUserId: string
}

interface AppContextValue extends AppState {
  currentUser: User
  setCurrentUserId: (id: string) => void
  todayRecord: (userId: string, date?: string) => Attendance | undefined
  upsertAttendance: (rec: Partial<Attendance> & { userId: string; date: string }) => void
  checkIn: (userId: string, time: string, workType: WorkType) => void
  checkOut: (userId: string, time: string, planned: boolean) => void
  addAbsence: (a: Omit<Absence, 'id'>) => void
  removeAbsence: (id: string) => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function load(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function save(data: PersistShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

let idc = 1000
function uid(prefix: string): string {
  idc += 1
  return `${prefix}-${idc}`
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const persisted = load()
  const [attendance, setAttendance] = useState<Attendance[]>(
    persisted?.attendance ?? seedAttendance,
  )
  const [absences, setAbsences] = useState<Absence[]>(
    persisted?.absences ?? seedAbsences,
  )
  const [currentUserId, setCurrentUserId] = useState<string>('u1')

  useEffect(() => {
    save({ attendance, absences })
  }, [attendance, absences])

  const todayRecord = useCallback(
    (userId: string, date: string = todayStr()) =>
      attendance.find((a) => a.userId === userId && a.date === date),
    [attendance],
  )

  const upsertAttendance = useCallback(
    (rec: Partial<Attendance> & { userId: string; date: string }) => {
      setAttendance((prev) => {
        const idx = prev.findIndex(
          (a) => a.userId === rec.userId && a.date === rec.date,
        )
        const now = new Date().toISOString()
        if (idx >= 0) {
          const merged = { ...prev[idx], ...rec, updatedAt: now }
          const copy = [...prev]
          copy[idx] = merged
          return copy
        }
        const created: Attendance = {
          id: uid('at'),
          checkIn: null,
          checkOut: null,
          checkOutPlanned: true,
          workType: 'office',
          ...rec,
          updatedAt: now,
        }
        return [...prev, created]
      })
    },
    [],
  )

  const checkIn = useCallback(
    (userId: string, time: string, workType: WorkType) => {
      upsertAttendance({ userId, date: todayStr(), checkIn: time, workType })
    },
    [upsertAttendance],
  )

  const checkOut = useCallback(
    (userId: string, time: string, planned: boolean) => {
      upsertAttendance({
        userId,
        date: todayStr(),
        checkOut: time,
        checkOutPlanned: planned,
      })
    },
    [upsertAttendance],
  )

  const addAbsence = useCallback((a: Omit<Absence, 'id'>) => {
    setAbsences((prev) => [...prev, { ...a, id: uid('ab') }])
  }, [])

  const removeAbsence = useCallback((id: string) => {
    setAbsences((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const resetDemo = useCallback(() => {
    setAttendance(seedAttendance)
    setAbsences(seedAbsences)
  }, [])

  const currentUser = useMemo(
    () => seedUsers.find((u) => u.id === currentUserId) ?? seedUsers[0],
    [currentUserId],
  )

  const value: AppContextValue = {
    users: seedUsers,
    teams: seedTeams,
    holidays: seedHolidays,
    attendance,
    absences,
    currentUserId,
    currentUser,
    setCurrentUserId,
    todayRecord,
    upsertAttendance,
    checkIn,
    checkOut,
    addAbsence,
    removeAbsence,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
