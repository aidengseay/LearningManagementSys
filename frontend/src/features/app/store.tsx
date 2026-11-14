import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { clearToken, getToken, saveToken } from '../../api/client'
import { getMe, loginRequest, registerRequest, type RegisterInput } from '../../api/auth'
import { createCourseRequest, enrollStudentRequest, getCourses, joinCourseRequest } from '../../api/courses'
import type { Course, User } from '../../api/types'

type Store = {
  user: User | null
  loading: boolean
  courses: Course[]
  login: (email: string, password: string) => Promise<User>
  register: (details: RegisterInput) => Promise<User>
  joinCourse: (code: string) => Promise<void>
  logout: () => void
  refreshCourses: () => Promise<void>
  createCourse: (name: string, description: string) => Promise<void>
  enrollStudent: (courseId: number, email: string) => Promise<void>
}

const Context = createContext<Store | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function restore() {
      if (!getToken()) {
        if (active) setLoading(false)
        return
      }
      try {
        const [me, available] = await Promise.all([getMe(), getCourses()])
        if (active) {
          setUser(me)
          setCourses(available)
        }
      } catch {
        clearToken()
        if (active) {
          setUser(null)
          setCourses([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void restore()
    return () => { active = false }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password)
    saveToken(response.access_token)
    try {
      const available = await getCourses()
      setUser(response.user)
      setCourses(available)
      return response.user
    } catch (error) {
      clearToken()
      throw error
    }
  }

  const register = async (details: RegisterInput) => {
    const response = await registerRequest(details)
    saveToken(response.access_token)
    try {
      const available = await getCourses()
      setUser(response.user)
      setCourses(available)
      return response.user
    } catch (error) {
      clearToken()
      throw error
    }
  }

  const logout = () => {
    clearToken()
    setUser(null)
    setCourses([])
  }

  const refreshCourses = async () => setCourses(await getCourses())
  const createCourse = async (name: string, description: string) => {
    await createCourseRequest(name, description)
    await refreshCourses()
  }
  const enrollStudent = async (courseId: number, email: string) => {
    await enrollStudentRequest(courseId, email)
    await refreshCourses()
  }
  const joinCourse = async (code: string) => {
    await joinCourseRequest(code)
    await refreshCourses()
  }

  return (
    <Context.Provider value={{ user, courses, loading, login, register, joinCourse, logout, refreshCourses, createCourse, enrollStudent }}>
      {children}
    </Context.Provider>
  )
}

export function useAppStore() {
  const context = useContext(Context)
  if (!context) throw Error('AppProvider is missing')
  return context
}
