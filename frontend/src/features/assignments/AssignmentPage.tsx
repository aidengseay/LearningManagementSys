import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import {
  deleteAssignment, downloadProtectedPdf, editAssignment, getAssignment, getMySubmission,
  getSubmissions, gradeAssignment, sendPdf, submitText,
  type Assignment, type AssignmentSubmission, type SubmissionType,
} from '../../api/assignments'

export default function AssignmentPage() {
  const { assignmentId } = useParams()
  const id = Number(assignmentId)
  const { user } = useAuth()
  const isInstructor = user?.role === 'INSTRUCTOR'
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [mine, setMine] = useState<AssignmentSubmission | null>(null)
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [text, setText] = useState('')
  const [pdf, setPdf] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getAssignment(id), isInstructor ? getSubmissions(id) : getMySubmission(id)])
      .then(([a, data]) => {
        if (!active) return
        setAssignment(a)
        if (Array.isArray(data)) setSubmissions(data)
        else { setMine(data); setText(data?.text || '') }
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to open assignment') })
    return () => { active = false }
  }, [id, isInstructor, version])

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setError('')
    try { await action(); setVersion(v => v + 1) }
    catch (e) { setError(e instanceof Error ? e.message : 'Request failed') }
    finally { setBusy(false) }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    await run(() => pdf ? sendPdf(`/assignments/${id}/submission/pdf`, pdf) : submitText(id, text))
    setPdf(null)
  }

  if (!assignment) return <section className="panel"><p>{error || 'Loading assignment…'}</p></section>
  return <div className="stack">
    <section className="panel stack">
      <Link to={`/courses/${assignment.courseId}`}>← Back to course</Link>
      <h1>{assignment.title}</h1>
      <p>{assignment.description}</p>
      <p>Due {new Date(assignment.dueAt).toLocaleString()} · {assignment.maxPoints} points · {assignment.submissionType}</p>
      {assignment.hasInstructionsPdf && <button className="secondary" onClick={() => void run(() => downloadProtectedPdf(`/assignments/${id}/instructions`, 'instructions.pdf'))}>Download instructions PDF</button>}
      {isInstructor && <div className="stack">
        <button className="secondary" onClick={() => setEditing(v => !v)}>{editing ? 'Close editing' : 'Edit assignment'}</button>
        {editing && <AssignmentEdit a={assignment} onSave={changes => run(async () => { await editAssignment(id, changes); setEditing(false) })} />}
        <button className="secondary" onClick={() => {
          if (window.confirm('Delete this assignment and all student work and grades?')) void run(() => deleteAssignment(id).then(() => { window.location.href = `/courses/${assignment.courseId}` }))
        }}>Delete assignment</button>
      </div>}
    </section>
    {error && <p role="alert" className="error">{error}</p>}
    {isInstructor ? <section className="panel stack"><h2>Student submissions and grading</h2>
      {submissions.length === 0 && <p>No students enrolled.</p>}
      {submissions.map(s => <StudentGradeRow key={s.studentId} s={s} a={assignment} disabled={busy}
        onDownload={() => run(() => downloadProtectedPdf(`/assignments/${id}/students/${s.studentId}/pdf`, s.filename || 'submission.pdf'))}
        onGrade={(points, feedback) => run(() => gradeAssignment(id, s.studentId, points, feedback))} />)}
    </section> : <section className="panel stack"><h2>Submit your work</h2>
      {mine?.submittedAt && <p>Submitted: {new Date(mine.submittedAt).toLocaleString()} {mine.late ? '(Late)' : ''}</p>}
      {mine?.pointsEarned !== null && mine?.pointsEarned !== undefined && <p>Grade: {mine.pointsEarned}/{assignment.maxPoints} ({mine.percentage}%)</p>}
      {mine?.feedback && <p>Instructor feedback: {mine.feedback}</p>}
      {mine?.filename && <button className="secondary" onClick={() => void run(() => downloadProtectedPdf(`/assignments/${id}/students/${user!.id}/pdf`, mine.filename!))}>Download my submission</button>}
      <form onSubmit={submit} className="stack">
        {assignment.submissionType !== 'PDF' && <label>Written submission<textarea rows={8} value={text} onChange={e => { setText(e.target.value); setPdf(null) }} /></label>}
        {assignment.submissionType !== 'TEXT' && <label>PDF submission (10 MB max)<input type="file" accept=".pdf,application/pdf" onChange={e => setPdf(e.target.files?.[0] ?? null)} /></label>}
        <p className="muted">Resubmitting replaces your previous work and clears the existing grade.</p>
        <button disabled={busy || (!pdf && !text.trim())}>{busy ? 'Submitting…' : mine?.submittedAt ? 'Resubmit' : 'Submit assignment'}</button>
      </form>
    </section>}
  </div>
}

function StudentGradeRow({ s, a, disabled, onDownload, onGrade }: {
  s: AssignmentSubmission; a: Assignment; disabled: boolean
  onDownload: () => void; onGrade: (points: number, feedback: string) => void
}) {
  const [points, setPoints] = useState(String(s.pointsEarned ?? ''))
  const [feedback, setFeedback] = useState(s.feedback)
  useEffect(() => { setPoints(String(s.pointsEarned ?? '')); setFeedback(s.feedback) }, [s])
  return <div className="panel stack"><h3>{s.studentName}</h3>
    <p>{s.submittedAt ? `Submitted ${new Date(s.submittedAt).toLocaleString()}${s.late ? ' · Late' : ''}` : 'Missing / Not submitted'}</p>
    {s.text && <pre style={{ whiteSpace: 'pre-wrap' }}>{s.text}</pre>}
    {s.filename && <button className="secondary" onClick={onDownload}>Download {s.filename}</button>}
    <form onSubmit={e => { e.preventDefault(); onGrade(Number(points), feedback) }} className="stack">
      <label>Points earned (out of {a.maxPoints})<input required type="number" min="0" max={a.maxPoints} step="1" value={points} onChange={e => setPoints(e.target.value)} /></label>
      <label>Feedback<textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} /></label>
      <button type="submit" disabled={disabled || points.trim() === ''}>Save grade</button>
    </form>
  </div>
}

function localInputDate(value: string) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function AssignmentEdit({ a, onSave }: { a: Assignment; onSave: (changes: {
  title: string; description: string; dueAt: string; maxPoints: number; submissionType: SubmissionType
}) => void }) {
  const [title, setTitle] = useState(a.title)
  const [description, setDescription] = useState(a.description)
  const [due, setDue] = useState(localInputDate(a.dueAt))
  const [maxPoints, setMaxPoints] = useState(a.maxPoints)
  const [submissionType, setSubmissionType] = useState(a.submissionType)
  return <form className="stack" onSubmit={e => { e.preventDefault(); onSave({ title, description, dueAt: new Date(due).toISOString(), maxPoints, submissionType }) }}>
    <label>Title<input required value={title} onChange={e => setTitle(e.target.value)} /></label>
    <label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} /></label>
    <label>Due<input required type="datetime-local" value={due} onChange={e => setDue(e.target.value)} /></label>
    <label>Maximum points<input required min={1} type="number" value={maxPoints} onChange={e => setMaxPoints(Number(e.target.value))} /></label>
    <label>Submission type<select value={submissionType} onChange={e => setSubmissionType(e.target.value as SubmissionType)}><option value="BOTH">Both</option><option value="TEXT">Text</option><option value="PDF">PDF</option></select></label>
    <button type="submit">Save changes</button>
  </form>
}
