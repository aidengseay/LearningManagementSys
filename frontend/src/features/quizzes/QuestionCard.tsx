import type { Question } from '../demo/store'

type Props = {
  question: Question
  number: number
  selected: number | undefined
  onChange: (value: number) => void
}

export default function QuestionCard({ question, number, selected, onChange }: Props) {
  const headingId = `question-heading-${question.id}`

  return (
    <div className="take-card" role="radiogroup" aria-labelledby={headingId}>
      <div className="take-card-head">
        <span className="take-number">{number}</span>
        <h3 id={headingId}>{question.text}</h3>
      </div>

      <div className="take-choices">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`take-choice${selected === index ? ' selected' : ''}`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={selected === index}
              onChange={() => onChange(index)}
            />
            <span className="take-letter" aria-hidden="true">
              {'ABCD'[index]}
            </span>
            <span className="take-choice-text">{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}