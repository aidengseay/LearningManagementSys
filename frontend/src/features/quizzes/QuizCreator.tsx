import { useState, type FormEvent } from 'react'
import { useDemo, type Question } from '../demo/store'
const blank = () => ({ text: '', options: ['', '', '', ''], correct: 0 })
export default function QuizCreator({ courseId }: { courseId: number }) {
  const { createQuiz } = useDemo(); const [title, setTitle] = useState(''); const [due, setDue] = useState('')
  const [items, setItems] = useState([blank()])
  function update(index: number, field: 'text' | 'correct', value: string | number) { setItems(old => old.map((q, i) => i === index ? { ...q, [field]: value } : q)) }
  function option(index: number, which: number, value: string) { setItems(old => old.map((q, i) => i === index ? { ...q, options: q.options.map((o, j) => j === which ? value : o) } : q)) }
  function submit(e: FormEvent) {
    e.preventDefault(); if (!title.trim() || !due || items.some(q => !q.text.trim() || q.options.some(o => !o.trim()))) return
    const questions: Question[] = items.map((q, i) => ({ ...q, id: Date.now() + i }))
    createQuiz(courseId, title.trim(), due, questions); setTitle(''); setDue(''); setItems([blank()])
  }
  return <form className="panel stack" onSubmit={submit}><h2>Create Quiz</h2><input placeholder="Quiz title" aria-label="Quiz title" value={title} onChange={e => setTitle(e.target.value)} required />
    <label>Due date <input type="date" value={due} onChange={e => setDue(e.target.value)} required /></label>
    {items.map((q, i) => <fieldset className="stack" key={i}><legend>Question {i + 1}</legend><input placeholder="Question text" aria-label={`Question ${i+1}`} value={q.text} onChange={e => update(i, 'text', e.target.value)} required />
      {q.options.map((o, j) => <input key={j} placeholder={`Option ${'ABCD'[j]}`} aria-label={`Question ${i+1} option ${j+1}`} value={o} onChange={e => option(i, j, e.target.value)} required />)}
      <label>Correct answer <select value={q.correct} onChange={e => update(i, 'correct', Number(e.target.value))}>{q.options.map((_, j) => <option key={j} value={j}>{'ABCD'[j]}</option>)}</select></label>
    </fieldset>)}
    <div className="actions"><button type="button" className="secondary" onClick={() => setItems(q => [...q, blank()])}>Add question</button><button type="submit">Publish quiz</button></div>
  </form>
}
