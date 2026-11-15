import { api } from './client'
import type { Course, User } from './types'

export const getCourses = () => api<Course[]>('/courses')
export const createCourseRequest = (name: string, description: string) => api<Course>('/courses', {
  method: 'POST', body: JSON.stringify({ name, description }),
})
export const enrollStudentRequest = (courseId: number, email: string) => api<Course>(`/courses/${courseId}/enrollments`, {
  method: 'POST', body: JSON.stringify({ email }),
})

export const joinCourseRequest = (code: string) => api<Course>('/enrollments/join', {
  method: 'POST', body: JSON.stringify({ code }),
})
export const getJoinCodeRequest = (courseId: number) => api<{courseId: number; code: string}>(`/courses/${courseId}/join-code`)
export const getCourseStudentsRequest = (courseId: number) => api<User[]>(`/courses/${courseId}/students`)

export const updateCourseRequest = (courseId: number, name: string, description: string) =>
  api<Course>(`/courses/${courseId}`, {
    method: 'PATCH', body: JSON.stringify({ name, description }),
  })
