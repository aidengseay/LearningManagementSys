import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import MarkdownText from '../../components/MarkdownText'
import {
  deleteAssignment, downloadProtectedPdf, editAssignment, getAssignment, getMySubmission,
  getSubmissions, gradeAssignment, sendPdf, submitText,
  type Assignment, type AssignmentSubmission, type SubmissionType,
} from '../../api/assignments'
import { SUBMISSION_LABEL, formatDateTime, initials } from './format'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
const DownloadIcon = () => (
  <Svg>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Svg>
)
const EditIcon = () => <Svg><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Svg>
const TrashIcon = () => (
  <Svg>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)

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

  if (!assignment) {
    return (
      <div className="asn-page">
        <section className="asn-state">
          <p className={error ? 'asn-state-error' : ''}>{error || 'Loading assignment…'}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="asn-page">
      <Link to={`/courses/${assignment.courseId}`} className="take-back">← Back to course</Link>

      <section className="asn-header">
        <span className="dashboard-eyebrow dashboard-eyebrow-dark">ASSIGNMENT</span>
        <h1>{assignment.title}</h1>
        {assignment.description && <MarkdownText className="asn-desc" text={assignment.description} />}

        <div className="asn-meta">
          <span>Due {formatDateTime(assignment.dueAt)}</span>
          <span>{assignment.maxPoints} points</span>
          <span>{SUBMISSION_LABEL[assignment.submissionType] ?? assignment.submissionType}</span>
        </div>

        {(assignment.hasInstructionsPdf || isInstructor) && (
          <div className="asn-actions">
            {assignment.hasInstructionsPdf && (
              <button type="button" className="asn-btn" onClick={() => void run(() => downloadProtectedPdf(`/assignments/${id}/instructions`, 'instructions.pdf'))}>
                <DownloadIcon /> Download instructions PDF
              </button>
            )}
            {isInstructor && (
              <>
                <button type="button" className="asn-btn asn-btn-ghost" onClick={() => setEditing(v => !v)}>
                  <EditIcon /> {editing ? 'Close editing' : 'Edit assignment'}
                </button>
                <button type="button" className="asn-btn asn-btn-danger" onClick={() => {
                  if (window.confirm('Delete this assignment and all student work and grades?')) void run(() => deleteAssignment(id).then(() => { window.location.href = `/courses/${assignment.courseId}` }))
                }}>
                  <TrashIcon /> Delete assignment
                </button>
              </>
            )}
          </div>
        )}

        {isInstructor && editing && (
          <AssignmentEdit a={assignment} onSave={changes => run(async () => { await editAssignment(id, changes); setEditing(false) })} />
        )}
      </section>

      {error && <p role="alert" className="asn-error">{error}</p>}

      {isInstructor ? (
        <section className="asn-card">
          <div className="asn-card-head">
            <h2>Student submissions and grading</h2>
            <span className="asn-count">{submissions.length}</span>
          </div>

          {submissions.length === 0 && <div className="asn-empty">No students enrolled.</div>}

          <div className="asn-students">
            {submissions.map(s => (
              <StudentGradeRow key={s.studentId} s={s} a={assignment} disabled={busy}
                onDownload={() => run(() => downloadProtectedPdf(`/assignments/${id}/students/${s.studentId}/pdf`, s.filename || 'submission.pdf'))}
                onGrade={(points, feedback) => run(() => gradeAssignment(id, s.studentId, points, feedback))} />
            ))}
          </div>
        </section>
      ) : (
        <section className="asn-card">
          <div className="asn-card-head">
            <h2>Submit your work</h2>
          </div>

          {mine?.submittedAt && (
            <div className="asn-status">
              <span className="asn-chip good">Submitted</span>
              <span className="asn-when">{formatDateTime(mine.submittedAt)}</span>
              {mine.late && <span className="asn-chip warn">Late</span>}
            </div>
          )}

          {mine?.pointsEarned !== null && mine?.pointsEarned !== undefined && (
            <div className="asn-grade">
              <div className="asn-grade-score">
                <strong>{mine.pointsEarned}/{assignment.maxPoints}</strong>
                <span>{mine.percentage}%</span>
              </div>
              {mine.feedback && (
                <div className="asn-feedback">
                  <span className="asn-label">Instructor feedback</span>
                  <MarkdownText text={mine.feedback} />
                </div>
              )}
            </div>
          )}

          {mine?.filename && (
            <div>
              <button type="button" className="asn-btn asn-btn-ghost" onClick={() => void run(() => downloadProtectedPdf(`/assignments/${id}/students/${user!.id}/pdf`, mine.filename!))}>
                <DownloadIcon /> Download my submission
              </button>
            </div>
          )}

          <form onSubmit={submit} className="asn-submit-form">
            {assignment.submissionType !== 'PDF' && (
              <div className="tool-field">
                <label htmlFor="written-submission">Written submission</label>
                <textarea
                  id="written-submission"
                  rows={8}
                  placeholder="Type your response here..."
                  value={text}
                  onChange={e => { setText(e.target.value); setPdf(null) }}
                />
              </div>
            )}
            {assignment.submissionType !== 'TEXT' && (
              <div className="tool-field">
                <label htmlFor="pdf-submission">
                  PDF submission <span className="asn-optional">(10 MB max)</span>
                </label>
                <input
                  id="pdf-submission"
                  className="asn-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={e => setPdf(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            <p className="asn-note">Resubmitting replaces your previous work and clears the existing grade.</p>

            <div className="tool-actions">
              <button disabled={busy || (!pdf && !text.trim())}>
                {busy ? 'Submitting…' : mine?.submittedAt ? 'Resubmit' : 'Submit assignment'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

function StudentGradeRow({ s, a, disabled, onDownload, onGrade }: {
  s: AssignmentSubmission; a: Assignment; disabled: boolean
  onDownload: () => void; onGrade: (points: number, feedback: string) => void
}) {
  const [points, setPoints] = useState(String(s.pointsEarned ?? ''))
  const [feedback, setFeedback] = useState(s.feedback)
  useEffect(() => { setPoints(String(s.pointsEarned ?? '')); setFeedback(s.feedback) }, [s])

  const graded = s.pointsEarned !== null && s.pointsEarned !== undefined

  return (
    <div className="asn-student">
      <div className="asn-student-head">
        <span className={`asn-avatar av-${s.studentId % 5}`} aria-hidden="true">{initials(s.studentName)}</span>
        <div className="asn-student-id">
          <strong>{s.studentName}</strong>
          <div className="asn-status">
            {s.submittedAt ? (
              <>
                <span className="asn-chip good">Submitted</span>
                <span className="asn-when">{formatDateTime(s.submittedAt)}</span>
                {s.late && <span className="asn-chip warn">Late</span>}
              </>
            ) : (
              <span className="asn-chip bad">Not submitted</span>
            )}
            {graded && <span className="asn-chip info">Graded {s.pointsEarned}/{a.maxPoints}</span>}
          </div>
        </div>
      </div>

      {s.text && <MarkdownText className="asn-submission-text" text={s.text} />}

      {s.filename && (
        <div>
          <button type="button" className="asn-btn asn-btn-ghost" onClick={onDownload}>
            <DownloadIcon /> Download {s.filename}
          </button>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); onGrade(Number(points), feedback) }} className="asn-grade-form">
        <div className="tool-field">
          <label htmlFor={`points-${s.studentId}`}>Points earned</label>
          <div className="asn-points">
            <input
              id={`points-${s.studentId}`}
              required
              type="number"
              min="0"
              max={a.maxPoints}
              step="1"
              value={points}
              onChange={e => setPoints(e.target.value)}
            />
            <span>/ {a.maxPoints}</span>
          </div>
        </div>

        <div className="tool-field">
          <label htmlFor={`feedback-${s.studentId}`}>Feedback</label>
          <textarea
            id={`feedback-${s.studentId}`}
            rows={3}
            placeholder="Write feedback for the student..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>

        <div className="tool-actions">
          <button type="submit" disabled={disabled || points.trim() === ''}>Save grade</button>
        </div>
      </form>
    </div>
  )
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

  return (
    <form className="asn-edit" onSubmit={e => { e.preventDefault(); onSave({ title, description, dueAt: new Date(due).toISOString(), maxPoints, submissionType }) }}>
      <h3 className="asn-edit-title">Edit assignment</h3>

      <div className="tool-field">
        <label htmlFor="edit-assignment-title">Title</label>
        <input id="edit-assignment-title" required value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="tool-field">
        <label htmlFor="edit-assignment-description">Description</label>
        <textarea id="edit-assignment-description" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="asn-two">
        <div className="tool-field">
          <label htmlFor="edit-assignment-due">Due</label>
          <input id="edit-assignment-due" required type="datetime-local" value={due} onChange={e => setDue(e.target.value)} />
        </div>

        <div className="tool-field">
          <label htmlFor="edit-assignment-points">Maximum points</label>
          <input id="edit-assignment-points" required min={1} type="number" value={maxPoints} onChange={e => setMaxPoints(Number(e.target.value))} />
        </div>
      </div>

      <div className="tool-field">
        <span className="asn-label" id="edit-assignment-type-label">Submission type</span>
        <div className="tool-segmented asn-segmented" role="radiogroup" aria-labelledby="edit-assignment-type-label">
          {(['BOTH', 'TEXT', 'PDF'] as const).map(type => (
            <label key={type} className={`tool-segment${submissionType === type ? ' selected' : ''}`}>
              <input
                type="radio"
                name="edit-assignment-submission-type"
                value={type}
                checked={submissionType === type}
                onChange={() => setSubmissionType(type)}
              />
              {SUBMISSION_LABEL[type]}
            </label>
          ))}
        </div>
      </div>

      <div className="tool-actions">
        <button type="submit">Save changes</button>
      </div>
    </form>
  )
}