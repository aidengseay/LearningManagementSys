import { useState, type FormEvent } from 'react'
import { useDemo } from '../demo/store'
export default function AnnouncementForm({ courseId }: { courseId: number }) {
  const { postAnnouncement } = useDemo(); const [title, setTitle] = useState(''); const [content, setContent] = useState('')
  function submit(e: FormEvent) { e.preventDefault(); if (!title.trim() || !content.trim()) return; postAnnouncement(courseId, title.trim(), content.trim()); setTitle(''); setContent('') }
  return <form className="panel stack" onSubmit={submit}><h2>Post announcement</h2><input placeholder="Title" aria-label="Announcement title" value={title} onChange={e => setTitle(e.target.value)} required />
    <textarea placeholder="Message" aria-label="Announcement content" value={content} onChange={e => setContent(e.target.value)} required /><button type="submit">Post</button></form>
}
