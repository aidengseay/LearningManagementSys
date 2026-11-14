import { useEffect, useState } from 'react'
import { getAnnouncements } from '../../api/announcements'
import type { Announcement } from '../../api/types'

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export default function AnnouncementList({ courseId, refreshKey = 0 }: { courseId: number; refreshKey?: number }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAnnouncements(courseId)
      .then(items => { if (active) setAnnouncements(items) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load announcements') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId, refreshKey])

  if (loading) return <p className="muted">Loading announcements…</p>
  if (error) return <p role="alert" className="error">{error}</p>
  if (announcements.length === 0) return <p className="muted">No announcements yet.</p>

  return <section className="panel">{announcements.map(a =>
    <article key={a.id} className="list-row"><div><strong>{a.title}</strong><p>{a.content}</p><small className="muted">{formatDate(a.createdAt)}</small></div></article>
  )}</section>
}
