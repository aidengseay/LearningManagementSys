import { useState, type FormEvent } from 'react'
import { useDemo } from '../demo/store'
export default function CreateCourseForm() {
  const { createCourse } = useDemo()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!name.trim()) return
    setBusy(true); setError('')
    try { await createCourse(name.trim(), description.trim()); setName(''); setDescription('') }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create course') }
    finally { setBusy(false) }
  }
  return <form className="panel stack" onSubmit={submit}><h3>Create course</h3>
    <input aria-label="Course name" placeholder="Course name" value={name} onChange={e => setName(e.target.value)} required />
    <textarea aria-label="Description" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
    {error && <p className="error" role="alert">{error}</p>}
    <button disabled={busy} type="submit">{busy ? 'Creating…' : 'Create course'}</button>
  </form>
}
