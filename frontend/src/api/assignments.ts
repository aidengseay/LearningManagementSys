import { api, getToken } from './client'

export type SubmissionType = 'TEXT' | 'PDF' | 'BOTH'
export type Assignment = {
  id: number; courseId: number; title: string; description: string
  dueAt: string; maxPoints: number; submissionType: SubmissionType
  hasInstructionsPdf: boolean; submitted?: boolean | null; graded?: boolean | null
}
export type AssignmentSubmission = {
  id: number; assignmentId: number; studentId: number; studentName: string
  submissionType: 'TEXT' | 'PDF' | null; text: string | null; filename: string | null
  submittedAt: string | null; late: boolean; pointsEarned: number | null
  percentage: number | null; feedback: string; gradedAt: string | null
}
export type GradeItem = {
  type: 'QUIZ' | 'ASSIGNMENT'; id: number; title: string; due: string
  earned: number | null; possible: number; percentage: number | null
  status: string; submittedAt: string | null; feedback: string | null
}
export type StudentReport = {
  studentId: number; studentName: string; studentEmail: string; grades: GradeItem[]
  earnedPoints: number; possiblePoints: number; overallPercentage: number | null
}
export type UnifiedGradebook = { courseId: number; students: StudentReport[] }
export type UnifiedTodo = {
  type: 'QUIZ' | 'ASSIGNMENT'; id: number; courseId: number
  courseName: string; title: string; due: string; overdue: boolean
}

export const getAssignments = (courseId: number) => api<Assignment[]>(`/courses/${courseId}/assignments`)
export const getAssignment = (id: number) => api<Assignment>(`/assignments/${id}`)
export const createAssignment = (courseId: number, data: {
  title: string; description: string; dueAt: string; maxPoints: number; submissionType: SubmissionType
}) => api<Assignment>(`/courses/${courseId}/assignments`, { method: 'POST', body: JSON.stringify(data) })
export const editAssignment = (id: number, data: Partial<{
  title: string; description: string; dueAt: string; maxPoints: number; submissionType: SubmissionType
}>) => api<Assignment>(`/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteAssignment = (id: number) => api<void>(`/assignments/${id}`, { method: 'DELETE' })
export const getMySubmission = (id: number) => api<AssignmentSubmission | null>(`/assignments/${id}/submission`)
export const submitText = (id: number, text: string) => api<AssignmentSubmission>(`/assignments/${id}/submission/text`, { method: 'PUT', body: JSON.stringify({ text }) })
export const getSubmissions = (id: number) => api<AssignmentSubmission[]>(`/assignments/${id}/submissions`)
export const gradeAssignment = (id: number, studentId: number, pointsEarned: number, feedback: string) =>
  api<AssignmentSubmission>(`/assignments/${id}/students/${studentId}/grade`, { method: 'PUT', body: JSON.stringify({ pointsEarned, feedback }) })
export const getUnifiedGradebook = (courseId: number) => api<UnifiedGradebook>(`/courses/${courseId}/gradebook/unified`)
export const getUnifiedMyGrades = (courseId: number) => api<StudentReport>(`/courses/${courseId}/my-grades/unified`)
export const getUnifiedTodos = () => api<UnifiedTodo[]>('/todos/unified')

export async function sendPdf(path: string, file: File): Promise<unknown> {
  const body = new FormData()
  body.append('file', file)
  const result = await fetch(`/api${path}`, {
    method: path.includes('/submission/pdf') ? 'PUT' : 'POST',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body,
  })
  if (!result.ok) {
    let detail = `Upload failed (${result.status})`
    try { const error = await result.json(); if (typeof error.detail === 'string') detail = error.detail } catch { /* ignore */ }
    throw new Error(detail)
  }
  return result.json()
}

export async function downloadProtectedPdf(path: string, fallback: string): Promise<void> {
  const res = await fetch(`/api${path}`, {
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
  })
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  let filename = fallback
  if (match) { try { filename = decodeURIComponent(match[1]) } catch { /* ignore */ } }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
