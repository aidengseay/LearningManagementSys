import { api } from './client'
import type { Announcement } from './types'

export const getAnnouncements = (courseId: number) =>
  api<Announcement[]>(`/courses/${courseId}/announcements`)

export const createAnnouncementRequest = (courseId: number, title: string, content: string) =>
  api<Announcement>(`/courses/${courseId}/announcements`, {
    method: 'POST',
    body: JSON.stringify({ title, content })
  })
