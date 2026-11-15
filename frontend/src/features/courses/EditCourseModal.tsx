import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Course } from '../../api/types'

type Props = {
  course: Course
  onSave: (name: string, description: string) => Promise<void>
  onClose: () => void
}

export default function EditCourseModal({ course, onSave, onClose }: Props) {
  const [name, setName] = useState(course.name)
  const [description, setDescription] = useState(course.description || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const nameInput = useRef<HTMLInputElement>(null)

  useEffect(() => { nameInput.current?.focus() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) { setError('Course name is required.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(name.trim(), description)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save course changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="course-edit-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section className="course-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-course-heading"
        onKeyDown={event => { if (event.key === 'Escape' && !saving) onClose() }}>
        <div className="course-edit-header">
          <div>
            <p className="course-eyebrow">INSTRUCTOR TOOLS</p>
            <h2 id="edit-course-heading">Edit course</h2>
          </div>
          <button type="button" className="course-edit-dismiss" onClick={onClose} disabled={saving} aria-label="Close editor">×</button>
        </div>
        <form onSubmit={submit} className="course-edit-form">
          <label htmlFor="edit-course-name">Course name</label>
          <input ref={nameInput} id="edit-course-name" value={name} maxLength={150} required
            onChange={event => setName(event.target.value)} disabled={saving} />
          <label htmlFor="edit-course-description">Description</label>
          <textarea id="edit-course-description" value={description} rows={5} maxLength={10000}
            onChange={event => setDescription(event.target.value)} disabled={saving} />
          {error && <p className="course-edit-error" role="alert">{error}</p>}
          <div className="course-edit-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
