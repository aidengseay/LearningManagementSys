import { useState, type FormEvent } from 'react'
import { createAssignment, sendPdf, type SubmissionType } from '../../api/assignments'

export default function AssignmentCreator({ courseId, onCreated }: { courseId: number; onCreated?: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [maxPoints, setMaxPoints] = useState(100)
  const [submissionType, setSubmissionType] = useState<SubmissionType>('BOTH')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try {
      const assignment = await createAssignment(courseId, {
        title, description, dueAt: new Date(dueAt).toISOString(), maxPoints, submissionType,
      })
      if (file) await sendPdf(`/assignments/${assignment.id}/instructions`, file)
      setSuccess('Assignment created')
      setTitle(''); setDescription(''); setDueAt(''); setFile(null); onCreated?.()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create assignment') }
    finally { setBusy(false) }
  }
  return <form className="stack" onSubmit={submit}>
    <h3>Create an assignment</h3>
    <label>Title<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
    <label>Instructions<textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} /></label>
    <label>Due date and time<input required type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} /></label>
    <label>Maximum points<input required type="number" min={1} value={maxPoints} onChange={e => setMaxPoints(Number(e.target.value))} /></label>
    <label>Allowed submission<select value={submissionType} onChange={e => setSubmissionType(e.target.value as SubmissionType)}>
      <option value="BOTH">Text or PDF</option><option value="TEXT">Text only</option><option value="PDF">PDF only</option>
    </select></label>
    <label>Instructions PDF (optional, 10 MB max)<input type="file" accept=".pdf,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    {success && <p role="status">{success}</p>}
    <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create assignment'}</button>
  </form>
}
