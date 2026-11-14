import { useState, type KeyboardEvent } from 'react'
import EnrollStudentForm from './EnrollStudentForm'
import QuizCreator from '../quizzes/QuizCreator'
import AnnouncementForm from '../announcements/AnnouncementForm'

const TOOLS = [
  { id: 'enroll', label: 'Student enrollment' },
  { id: 'quiz', label: 'Create an assessment' },
  { id: 'announce', label: 'Post an announcement' }
] as const

type ToolId = (typeof TOOLS)[number]['id']

export default function InstructorTools({
  courseId,
  onQuizCreated,
  onAnnouncementCreated
}: {
  courseId: number
  onQuizCreated?: () => void
  onAnnouncementCreated?: () => void
}) {
  const [activeTool, setActiveTool] = useState<ToolId>('enroll')

  // Arrow keys / Home / End move between tabs, as expected for a tablist
  function handleTabKeys(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const current = TOOLS.findIndex(tool => tool.id === activeTool)
    const next =
      event.key === 'Home' ? 0
      : event.key === 'End' ? TOOLS.length - 1
      : event.key === 'ArrowRight' ? (current + 1) % TOOLS.length
      : (current - 1 + TOOLS.length) % TOOLS.length

    setActiveTool(TOOLS[next].id)
    document.getElementById(`tool-tab-${TOOLS[next].id}`)?.focus()
  }

  return (
    <>
      <div
        className="instructor-tabs"
        role="tablist"
        aria-label="Instructor tools"
        onKeyDown={handleTabKeys}
      >
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            type="button"
            role="tab"
            id={`tool-tab-${tool.id}`}
            aria-selected={activeTool === tool.id}
            aria-controls={`tool-panel-${tool.id}`}
            tabIndex={activeTool === tool.id ? 0 : -1}
            className={`instructor-tab${activeTool === tool.id ? ' active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* All tools stay mounted so unsent drafts survive switching tabs */}
      <div
        role="tabpanel"
        id="tool-panel-enroll"
        aria-labelledby="tool-tab-enroll"
        className="instructor-tab-panel"
        hidden={activeTool !== 'enroll'}
      >
        <EnrollStudentForm courseId={courseId} />
      </div>

      <div
        role="tabpanel"
        id="tool-panel-quiz"
        aria-labelledby="tool-tab-quiz"
        className="instructor-tab-panel"
        hidden={activeTool !== 'quiz'}
      >
        <QuizCreator courseId={courseId} onCreated={onQuizCreated} />
      </div>

      <div
        role="tabpanel"
        id="tool-panel-announce"
        aria-labelledby="tool-tab-announce"
        className="instructor-tab-panel"
        hidden={activeTool !== 'announce'}
      >
        <AnnouncementForm courseId={courseId} onCreated={onAnnouncementCreated} />
      </div>
    </>
  )
}
