import { useState, type FormEvent } from 'react'
import { createAssignment, sendPdf, type SubmissionType } from '../../api/assignments'
import { SUBMISSION_LABEL } from './format'

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

  return (
    <form className="panel stack instructor-tool-form tool-form" onSubmit={submit}>
      <div className="tool-header">
        <div className="tool-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
          </svg>
        </div>

        <div className="tool-heading">
          <span className="dashboard-eyebrow dashboard-eyebrow-dark">ASSIGNMENT MANAGEMENT</span>
          <h2>Create an assignment</h2>
          <p>Set the instructions, due date, and how students can turn in their work.</p>
        </div>
      </div>

      <div className="tool-field">
        <label htmlFor="assignment-title">Title</label>
        <input
          id="assignment-title"
          required
          maxLength={200}
          placeholder="Enter an assignment title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="tool-field">
        <label htmlFor="assignment-instructions">Instructions</label>
        <textarea
          id="assignment-instructions"
          rows={4}
          placeholder="Describe what students need to do..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="asn-two">
        <div className="tool-field">
          <label htmlFor="assignment-due">Due date and time</label>
          <input
            id="assignment-due"
            required
            type="datetime-local"
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
          />
        </div>

        <div className="tool-field">
          <label htmlFor="assignment-points">Maximum points</label>
          <input
            id="assignment-points"
            required
            type="number"
            min={1}
            value={maxPoints}
            onChange={e => setMaxPoints(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="tool-field">
        <span className="asn-label" id="assignment-type-label">Allowed submission</span>
        <div className="tool-segmented asn-segmented" role="radiogroup" aria-labelledby="assignment-type-label">
          {(['BOTH', 'TEXT', 'PDF'] as const).map(type => (
            <label key={type} className={`tool-segment${submissionType === type ? ' selected' : ''}`}>
              <input
                type="radio"
                name="assignment-submission-type"
                value={type}
                checked={submissionType === type}
                onChange={() => setSubmissionType(type)}
              />
              {SUBMISSION_LABEL[type]}
            </label>
          ))}
        </div>
      </div>

      <div className="tool-field">
        <label htmlFor="assignment-pdf">
          Instructions PDF <span className="asn-optional">(optional, 10 MB max)</span>
        </label>
        <input
          id="assignment-pdf"
          className="asn-file"
          type="file"
          accept=".pdf,application/pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p role="alert" className="tool-message tool-message-error">{error}</p>}

      {success && (
        <p role="status" className="tool-message tool-message-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {success}
        </p>
      )}

      <div className="tool-actions">
        <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create assignment'}</button>
      </div>
    </form>
  )
}