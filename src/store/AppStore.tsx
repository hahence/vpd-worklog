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

const STORAGE_KEY = 'vpd-worklog-v3'
const AUTH_KEY = 'vpd-worklog-auth-v3'

interface PersistShape {
  attendance: Attendance[]
  absences: Absence[]
}

interface SaveTodayInput {
  checkIn: string
  checkOut: string
  workType: WorkType
  checkOutPlanned?: boolean
}

interface AppContextValue {
  users: User[]
  teams: Team[]
  holidays: Holiday[]
  attendance: Attendance[]
  absences: Absence[]
  authedUserId: string | null
  currentUser: User | null
  login: (empId: string) => User | null
  logout: () => void
  teamMembers: (teamId: string) => User[]
  todayRecord: (userId: string, date?: string) => Attendance | undefined
  upsertAttendance: (rec: Partial<Attendance> & { userId: string; date: string }) => void
  saveToday: (userId: string, input: SaveTodayInput) => void
  addAbsence: (a: Omit<Absence, 'id'>) => void
  removeAbsence: (id: string) => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function load(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
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
const uid = (p: string) => `${p}-${(idc += 1)}`

export function AppProvider({ children }: { children: React.ReactNode }) {
  const persisted = load()
  const [attendance, setAttendance] = useState<Attendance[]>(
    persisted?.attendance ?? seedAttendance,
  )
  const [absences, setAbsences] = useState<Absence[]>(
    persisted?.absences ?? seedAbsences,
  )
  const [authedUserId, setAuthedUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    save({ attendance, absences })
  }, [attendance, absences])

  const login = useCallback((empId: string): User | null => {
    const u = seedUsers.find((x) => x.empId === empId.trim())
    if (!u) return null
    setAuthedUserId(u.id)
    try {
      localStorage.setItem(AUTH_KEY, u.id)
    } catch {
      /* ignore */
    }
    return u
  }, [])

  const logout = useCallback(() => {
    setAuthedUserId(null)
    try {
      localStorage.removeItem(AUTH_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const teamMembers = useCallback(
    (teamId: string) =>
      seedUsers
        .filter((u) => u.teamId === teamId)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [],
  )

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
          const copy = [...prev]
          copy[idx] = { ...prev[idx], ...rec, updatedAt: now }
          return copy
        }
        const created: Attendance = {
          id: uid('at'),
          checkIn: null,
          checkOut: null,
          checkOutPlanned: false,
          workType: 'office',
          ...rec,
          updatedAt: now,
        }
        return [...prev, created]
      })
    },
    [],
  )

  const saveToday = useCallback(
    (userId: string, input: SaveTodayInput) => {
      upsertAttendance({
        userId,
        date: todayStr(),
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        workType: input.workType,
        checkOutPlanned: input.checkOutPlanned ?? false,
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
    () => seedUsers.find((u) => u.id === authedUserId) ?? null,
    [authedUserId],
  )

  const value: AppContextValue = {
    users: seedUsers,
    teams: seedTeams,
    holidays: seedHolidays,
    attendance,
    absences,
    authedUserId,
    currentUser,
    login,
    logout,
    teamMembers,
    todayRecord,
    upsertAttendance,
    saveToday,
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
