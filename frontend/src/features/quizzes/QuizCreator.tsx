import { useState, type FormEvent } from 'react'
import { createQuizRequest } from '../../api/quizzes'

const blank = () => ({
  text: '',
  options: ['', '', '', ''],
  correct: 0
})

export default function QuizCreator({
  courseId,
  onCreated
}: {
  courseId: number
  onCreated?: () => void
}) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [maxPoints, setMaxPoints] = useState(10)
  const [items, setItems] = useState([blank()])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(
    index: number,
    field: 'text' | 'correct',
    value: string | number
  ) {
    setSuccess('')
    setItems(old =>
      old.map((question, i) =>
        i === index ? { ...question, [field]: value } : question
      )
    )
  }

  function updateOption(
    index: number,
    optionIndex: number,
    value: string
  ) {
    setSuccess('')
    setItems(old =>
      old.map((question, i) =>
        i === index
          ? {
              ...question,
              options: question.options.map((option, j) =>
                j === optionIndex ? value : option
              )
            }
          : question
      )
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()

    if (
      !title.trim() ||
      !due ||
      items.some(
        question =>
          !question.text.trim() ||
          question.options.some(option => !option.trim())
      )
    ) {
      return
    }

    setBusy(true)
    setError('')
    try {
      await createQuizRequest(courseId, title.trim(), due, items)
      setTitle('')
      setDue('')
      setItems([blank()])
      setSuccess('Quiz published. Students can now see it in this course.')
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish quiz')
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
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
          </svg>
        </div>

        <div className="tool-heading">
          <span className="dashboard-eyebrow dashboard-eyebrow-dark">
            ASSESSMENT MANAGEMENT
          </span>
          <h2>Create a quiz</h2>
          <p>Build a quiz and publish it for students in this course.</p>
        </div>
      </div>

      <div className="tool-row-2">
        <div className="tool-field">
          <label htmlFor="quiz-title">Quiz title</label>
          <input
            id="quiz-title"
            placeholder="Enter a quiz title"
            value={title}
            onChange={event => {
              setTitle(event.target.value)
              setSuccess('')
            }}
            required
          />
        </div>

        <div className="tool-field">
          <label htmlFor="quiz-due-date">Due date</label>
          <input
            id="quiz-due-date"
            type="date"
            value={due}
            onChange={event => {
              setDue(event.target.value)
              setSuccess('')
            }}
            required
          />
        </div>
      </div>

      <div className="tool-field"><label htmlFor="quiz-max-points">Maximum quiz points</label>
        <input id="quiz-max-points" type="number" min={1} value={maxPoints} onChange={e => setMaxPoints(Number(e.target.value))} required />
      </div>
      <div className="tool-questions">
        <div className="tool-section-title">
          <h3>Questions</h3>
          <p>Add questions and select the correct answer for each one.</p>
        </div>

        {items.map((question, index) => (
          <div
            className="tool-question"
            role="group"
            aria-labelledby={`question-heading-${index}`}
            key={index}
          >
            <div className="tool-question-head">
              <span className="tool-question-number">{index + 1}</span>
              <span id={`question-heading-${index}`}>Question {index + 1}</span>
            </div>

            <div className="tool-field">
              <label htmlFor={`question-${index}`}>Question text</label>
              <input
                id={`question-${index}`}
                placeholder="Enter your question"
                value={question.text}
                onChange={event => update(index, 'text', event.target.value)}
                required
              />
            </div>

            <div className="tool-options">
              {question.options.map((option, optionIndex) => (
                <div className="tool-option" key={optionIndex}>
                  <span
                    className={`tool-letter${
                      question.correct === optionIndex ? ' correct' : ''
                    }`}
                    aria-hidden="true"
                  >
                    {'ABCD'[optionIndex]}
                  </span>
                  <input
                    id={`question-${index}-option-${optionIndex}`}
                    aria-label={`Option ${'ABCD'[optionIndex]}`}
                    placeholder={`Option ${'ABCD'[optionIndex]}`}
                    value={option}
                    onChange={event =>
                      updateOption(index, optionIndex, event.target.value)
                    }
                    required
                  />
                </div>
              ))}
            </div>

                        <div
              className="tool-correct"
              role="radiogroup"
              aria-labelledby={`correct-label-${index}`}
            >
              <span id={`correct-label-${index}`} className="tool-correct-label">
                Correct answer
              </span>

              <div className="tool-segmented">
                {question.options.map((_, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`tool-segment${
                      question.correct === optionIndex ? ' selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      value={optionIndex}
                      checked={question.correct === optionIndex}
                      onChange={() => update(index, 'correct', optionIndex)}
                    />
                    {'ABCD'[optionIndex]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
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

      <div className="tool-actions tool-actions-split">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setSuccess('')
            setItems(old => [...old, blank()])
          }}
        >
          + Add question
        </button>

        <button type="submit" disabled={busy}>
          {busy ? 'Publishing...' : 'Publish quiz'}
        </button>
      </div>
    </form>
  )
}
