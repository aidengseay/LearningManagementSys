import { api } from './client'
import type { Course } from '../features/demo/store'

export const getCourses = () => api<Course[]>('/courses')
export const createCourseRequest = (name: string, description: string) => api<Course>('/courses', {
  method: 'POST', body: JSON.stringify({ name, description }),
})
export const enrollStudentRequest = (courseId: number, email: string) => api<Course>(`/courses/${courseId}/enrollments`, {
  method: 'POST', body: JSON.stringify({ email }),
})
