import { useEffect, useState } from 'react'
import { getAnnouncements } from '../../api/announcements'
import type { Announcement } from '../../api/types'
import MarkdownText from '../../components/MarkdownText'

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
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

  if (loading) return <p className="ann-empty">Loading announcements…</p>
  if (error) return <p role="alert" className="ann-error">{error}</p>
  if (announcements.length === 0) {
    return (
      <div className="ann-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
        <strong>No announcements yet</strong>
        <span>Updates from your instructor will show up here.</span>
      </div>
    )
  }

  return (
    <div className="ann-list">
      {announcements.map(a => (
        <article key={a.id} className="ann-card">
          <div className="ann-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </div>

          <div className="ann-body">
            <div className="ann-head">
              <h3>{a.title}</h3>
              <span className="ann-date">{formatDate(a.createdAt)}</span>
            </div>
            <MarkdownText className="ann-content" text={a.content} />
          </div>
        </article>
      ))}
    </div>
  )
}