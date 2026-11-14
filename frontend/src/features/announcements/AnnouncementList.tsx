import { useDemo } from '../demo/store'
export default function AnnouncementList({ courseId }: { courseId: number }) {
  const { announcements } = useDemo()
  return <section className="panel"><h2>Announcements</h2>{announcements.filter(a => a.courseId === courseId).slice().reverse().map(a =>
    <article key={a.id} className="list-row"><div><strong>{a.title}</strong><p>{a.content}</p><small className="muted">{a.date}</small></div></article>
  )}</section>
}
