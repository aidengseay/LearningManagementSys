export type Role = 'STUDENT' | 'INSTRUCTOR'

export type User = {
  id: number
  name: string
  email: string
  role: Role
}

export type Course = {
  id: number
  name: string
  description: string
  instructorId: number
  studentIds: number[]
}

export type Question = {
  id: number
  text: string
  options: string[]
  correct?: number
}

export type QuizListItem = {
  id: number
  courseId: number
  title: string
  due: string
  questionCount: number
  submitted: boolean | null
  score: number | null
  total: number | null
}

export type QuizDetail = {
  id: number
  courseId: number
  title: string
  due: string
  questions: Question[]
}

export type Submission = {
  id: number
  quizId: number
  studentId: number
  score: number
  total: number
  percentage: number
  submittedAt: string
  answers: Record<number, number>
}

export type GradeEntry = {
  quizId: number
  quizTitle: string
  due: string
  score: number | null
  total: number
  percentage: number | null
  submittedAt: string | null
}

export type StudentGrades = {
  studentId: number
  studentName: string
  studentEmail: string
  grades: GradeEntry[]
  averagePercentage: number | null
}

export type Gradebook = { courseId: number; students: StudentGrades[] }

export type TodoItem = {
  quizId: number
  courseId: number
  courseName: string
  title: string
  due: string
  overdue: boolean
}

export type Announcement = {
  id: number
  courseId: number
  title: string
  content: string
  createdAt: string
}
