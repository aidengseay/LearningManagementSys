// Temporary bridge: authentication, courses and enrollments use FastAPI/PostgreSQL.
// Quizzes, submissions and announcements remain LOCAL DEMO DATA until their API migration.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { clearToken, getToken, saveToken } from '../../api/client'
import { getMe, loginRequest } from '../../api/auth'
import { createCourseRequest, enrollStudentRequest, getCourses } from '../../api/courses'

export type Role = 'STUDENT' | 'INSTRUCTOR'
export type User = { id: number; name: string; email: string; role: Role }
export type Course = { id: number; name: string; description: string; instructorId: number; studentIds: number[] }
export type Question = { id: number; text: string; options: string[]; correct: number }
export type Quiz = { id: number; courseId: number; title: string; due: string; questions: Question[] }
export type Submission = { quizId: number; studentId: number; answers: number[]; score: number; total: number }
export type Announcement = { id: number; courseId: number; title: string; content: string; date: string }
type DemoData = { quizzes: Quiz[]; submissions: Submission[]; announcements: Announcement[] }
type Store = DemoData & {
  user: User | null; loading: boolean; error: string | null; courses: Course[];
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshCourses: () => Promise<void>;
  createCourse: (name: string, description: string) => Promise<void>;
  enrollStudent: (courseId: number, email: string) => Promise<void>;
  createQuiz: (courseId: number, title: string, due: string, questions: Question[]) => void;
  submitQuiz: (quizId: number, answers: number[]) => Submission;
  postAnnouncement: (courseId: number, title: string, content: string) => void;
}
const Context = createContext<Store | null>(null)
const LOCAL_KEY = 'lms-ui-demo-v2'
function getLocalData(): DemoData {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (saved) return JSON.parse(saved) as DemoData
  } catch { /* reset */ }
  return { quizzes: [], submissions: [], announcements: [] }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(getLocalData)
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)) }, [data])

  useEffect(() => {
    let active = true
    async function restore() {
      if (!getToken()) { if (active) setLoading(false); return }
      try {
        const me = await getMe()
        const available = await getCourses()
        if (active) { setUser(me); setCourses(available) }
      } catch {
        clearToken()
        if (active) { setUser(null); setCourses([]) }
      } finally { if (active) setLoading(false) }
    }
    void restore()
    return () => { active = false }
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setError(null)
    const response = await loginRequest(email, password)
    saveToken(response.access_token)
    try {
      const available = await getCourses()
      setUser(response.user)
      setCourses(available)
      return response.user
    } catch (err) {
      clearToken()
      throw err
    }
  }
  const logout = () => { clearToken(); setUser(null); setCourses([]) }
  const refreshCourses = async () => { setCourses(await getCourses()) }
  const createCourse = async (name: string, description: string) => {
    await createCourseRequest(name, description)
    await refreshCourses()
  }
  const enrollStudent = async (courseId: number, email: string) => {
    await enrollStudentRequest(courseId, email)
    await refreshCourses()
  }

  const createQuiz = (courseId: number, title: string, due: string, questions: Question[]) => {
    if (user?.role !== 'INSTRUCTOR' || !courses.some(c => c.id === courseId && c.instructorId === user.id)) return
    setData(d => ({ ...d, quizzes: [...d.quizzes, { id: Date.now(), courseId, title, due, questions }] }))
  }
  const submitQuiz = (quizId: number, answers: number[]) => {
    const quiz = data.quizzes.find(q => q.id === quizId)
    if (!quiz || user?.role !== 'STUDENT' || !courses.some(c => c.id === quiz.courseId && c.studentIds.includes(user.id)) ||
        data.submissions.some(s => s.quizId === quizId && s.studentId === user.id)) throw Error('Quiz unavailable or already submitted')
    if (answers.length !== quiz.questions.length || answers.some(a => !Number.isInteger(a) || a < 0 || a > 3)) throw Error('Answer every question')
    const score = quiz.questions.filter((q, i) => q.correct === answers[i]).length
    const submission = { quizId, studentId: user.id, answers, score, total: quiz.questions.length }
    setData(d => ({ ...d, submissions: [...d.submissions, submission] }))
    return submission
  }
  const postAnnouncement = (courseId: number, title: string, content: string) => {
    if (user?.role !== 'INSTRUCTOR' || !courses.some(c => c.id === courseId && c.instructorId === user.id)) return
    setData(d => ({ ...d, announcements: [...d.announcements, { id: Date.now(), courseId, title, content, date: new Date().toISOString().slice(0, 10) }] }))
  }
  return <Context.Provider value={{ ...data, user, courses, loading, error, login, logout, refreshCourses, createCourse, enrollStudent, createQuiz, submitQuiz, postAnnouncement }}>{children}</Context.Provider>
}
export function useDemo() {
  const context = useContext(Context)
  if (!context) throw Error('DemoProvider is missing')
  return context
}
