import { api } from './client'
import type {
  Gradebook,
  Question,
  QuizDetail,
  QuizListItem,
  StudentGrades,
  Submission,
  TodoItem
} from './types'

export type QuestionInput = Pick<Question, 'text' | 'options'> & { correct: number }

export const getQuizzes = (courseId: number) =>
  api<QuizListItem[]>(`/courses/${courseId}/quizzes`)

export const getQuiz = (quizId: number) => api<QuizDetail>(`/quizzes/${quizId}`)

export const createQuizRequest = (
  courseId: number,
  title: string,
  due: string,
  questions: QuestionInput[]
) => api<QuizDetail>(`/courses/${courseId}/quizzes`, {
  method: 'POST',
  body: JSON.stringify({ title, due, questions })
})

export const getSubmission = (quizId: number) =>
  api<Submission | null>(`/quizzes/${quizId}/submission`)

export const submitQuizRequest = (quizId: number, answers: Record<number, number>) =>
  api<Submission>(`/quizzes/${quizId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({ answers })
  })

export const getMyGrades = (courseId: number) =>
  api<StudentGrades>(`/courses/${courseId}/my-grades`)

export const getGradebook = (courseId: number) =>
  api<Gradebook>(`/courses/${courseId}/gradebook`)

export const getTodos = () => api<TodoItem[]>('/todos')
