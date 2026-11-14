import { useState, type FormEvent } from 'react'
import { useDemo } from '../demo/store'

export default function CreateCourseForm() {
  const { createCourse } = useDemo()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    setBusy(true)
    setError('')
    try {
      await createCourse(name.trim(), description.trim())
      setName('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create course')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="dashboard-panel dashboard-create-form" onSubmit={submit}>
      <p className="dashboard-form-intro">Add a new class to your instructor dashboard.</p>

      <label htmlFor="new-course-name">Course name</label>
      <input
        id="new-course-name"
        placeholder="e.g. Introduction to Programming"
        value={name}
        onChange={event => setName(event.target.value)}
        required
      />

      <label htmlFor="new-course-description">Description <span>(optional)</span></label>
      <textarea
        id="new-course-description"
        placeholder="Briefly describe what students will learn..."
        value={description}
        onChange={event => setDescription(event.target.value)}
        rows={3}
      />

      {error && <p className="error" role="alert">{error}</p>}

      <button disabled={busy} type="submit">
        {busy ? 'Creating course...' : 'Create course'}
      </button>
    </form>
  )
}
