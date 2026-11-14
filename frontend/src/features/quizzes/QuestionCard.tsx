import type { Question } from '../demo/store'
type Props = { question: Question; selected: number | undefined; onChange: (value: number) => void }
export default function QuestionCard({ question, selected, onChange }: Props) {
  return <fieldset className="panel"><legend>{question.text}</legend>{question.options.map((option, index) => <label className="choice" key={index}>
    <input type="radio" name={`question-${question.id}`} checked={selected === index} onChange={() => onChange(index)} /> {option}
  </label>)}</fieldset>
}
