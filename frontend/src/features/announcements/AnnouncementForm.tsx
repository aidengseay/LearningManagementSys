import { useState, type FormEvent } from 'react'
import { createAnnouncementRequest } from '../../api/announcements'

export default function AnnouncementForm({
  courseId,
  onCreated
}: {
  courseId: number
  onCreated?: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()

    if (!title.trim() || !content.trim()) return

    setBusy(true)
    setError('')
    try {
      await createAnnouncementRequest(courseId, title.trim(), content.trim())
      setTitle('')
      setContent('')
      setSuccess('Announcement published. Students can see it on the course page.')
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish announcement')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel stack instructor-tool-form tool-form" onSubmit={submit}>
      <div className="tool-header">
        <div className="tool-icon" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 11 18-5v12L3 14v-3z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
          </svg>
        </div>

        <div className="tool-heading">
          <span className="dashboard-eyebrow dashboard-eyebrow-dark">
            COURSE COMMUNICATION
          </span>
          <h2>Post an announcement</h2>
          <p>Share important information with students in this course.</p>
        </div>
      </div>

      <div className="tool-field">
        <label htmlFor="announcement-title">Announcement title</label>
        <input
          id="announcement-title"
          placeholder="Enter an announcement title"
          value={title}
          onChange={event => {
            setTitle(event.target.value)
            setSuccess('')
          }}
          required
        />
      </div>

      <div className="tool-field">
        <label htmlFor="announcement-content">Message</label>
        <textarea
          id="announcement-content"
          placeholder="Write your announcement here..."
          value={content}
          onChange={event => {
            setContent(event.target.value)
            setSuccess('')
          }}
          rows={5}
          required
        />
      </div>

      {success && (
        <p role="status" className="tool-message tool-message-success">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {success}
        </p>
      )}

      {error && <p role="alert" className="tool-message error">{error}</p>}

      <div className="tool-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Publishing...' : 'Publish announcement'}
        </button>
      </div>
    </form>
  )
}
