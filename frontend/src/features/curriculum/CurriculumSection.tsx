import { useEffect, useState, type FormEvent } from 'react'
import {
  createMaterial, createModule, downloadPdf, editMaterial, editModule,
  getCurriculum, removeMaterial, removeModule, reorderModules, reorderMaterials, uploadPdf,
  type CurriculumMaterial, type CurriculumModule,
} from '../../api/curriculum'

export default function CurriculumSection({ courseId, isInstructor }: { courseId: number; isInstructor: boolean }) {
  const [modules, setModules] = useState<CurriculumModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expanded, setExpanded] = useState<number[]>([])
  const [addingTo, setAddingTo] = useState<number | null>(null)
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialContent, setMaterialContent] = useState('')
  const [materialType, setMaterialType] = useState<'TEXT' | 'LINK' | 'PDF'>('TEXT')
  const [file, setFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  async function load() {
    const result = await getCurriculum(courseId)
    setModules(result)
  }

  useEffect(() => {
    let active = true
    getCurriculum(courseId)
      .then(data => { if (active) { setModules(data); setError('') } })
      .catch(e => { if (active) setError(message(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId])

  function message(e: unknown) { return e instanceof Error ? e.message : 'Something went wrong' }
  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try { await action(); await load() }
    catch (e) { setError(message(e)) }
    finally { setBusy(false) }
  }
  function toggle(id: number) {
    setExpanded(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  }
  async function addModule(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      const created = await createModule(courseId, title.trim(), description.trim())
      setTitle(''); setDescription(''); setExpanded(current => [...current, created.id])
    })
  }
  async function addMaterial(event: FormEvent, moduleId: number) {
    event.preventDefault()
    await run(async () => {
      if (materialType === 'PDF') {
        if (!file) throw new Error('Choose a PDF file')
        await uploadPdf(moduleId, materialTitle.trim(), file)
      } else {
        await createMaterial(moduleId, materialTitle.trim(), materialType, materialContent.trim())
      }
      setAddingTo(null); setMaterialTitle(''); setMaterialContent(''); setFile(null)
    })
  }
  async function deleteModule(moduleId: number) {
    if (!window.confirm('Delete this module and all its materials?')) return
    await run(() => removeModule(moduleId))
  }
  async function deleteMaterial(materialId: number) {
    if (!window.confirm('Delete this material?')) return
    await run(() => removeMaterial(materialId))
  }
  async function renameModule(module: CurriculumModule) {
    const next = window.prompt('Module title', module.title)
    if (next === null || !next.trim()) return
    const description = window.prompt('Module description', module.description)
    if (description === null) return
    await run(() => editModule(module.id, { title: next.trim(), description }))
  }
  async function moveModule(index: number, direction: -1 | 1) {
    const ids = modules.map(item => item.id)
    const next = index + direction
    if (next < 0 || next >= ids.length) return
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    await run(() => reorderModules(courseId, ids))
  }
  async function moveMaterial(module: CurriculumModule, index: number, direction: -1 | 1) {
    const ids = module.materials.map(item => item.id)
    const next = index + direction
    if (next < 0 || next >= ids.length) return
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    await run(() => reorderMaterials(module.id, ids))
  }
  async function saveEdit(material: CurriculumMaterial) {
    await run(async () => {
      await editMaterial(material.id, {
        title: editTitle.trim(),
        ...(material.type !== 'PDF' ? { content: editContent.trim() } : {}),
      })
      setEditing(null)
    })
  }
  function startEdit(material: CurriculumMaterial) {
    setEditing(material.id); setEditTitle(material.title); setEditContent(material.content || '')
  }

  return <section className="course-content-section panel curriculum-section">
    <div className="course-section-heading"><div>
      <p className="course-eyebrow">COURSE MATERIALS</p>
      <h2>Curriculum</h2>
      <p>Lessons, readings, PDFs, and additional course resources.</p>
    </div></div>
    {error && <p role="alert" className="error">{error}</p>}
    {isInstructor && <form className="curriculum-form" onSubmit={addModule}>
      <h3>Add module</h3>
      <input aria-label="New module title" required maxLength={200} placeholder="Module name" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea aria-label="Module description" placeholder="Optional description" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
      <button type="submit" disabled={busy || !title.trim()}>Create module</button>
    </form>}
    {loading ? <p className="muted">Loading curriculum...</p> : modules.length === 0 ?
      <p className="muted">No curriculum materials have been added yet.</p> :
      <div className="curriculum-modules">{modules.map((module, moduleIndex) => <article key={module.id} className="curriculum-module">
        <div className="curriculum-module-heading">
          <button type="button" className="curriculum-toggle" onClick={() => toggle(module.id)} aria-expanded={expanded.includes(module.id)}>
            {expanded.includes(module.id) ? '▾' : '▸'} {module.title}
          </button>
          {isInstructor && <div className="curriculum-actions">
            <button type="button" className="secondary" disabled={busy || moduleIndex === 0} aria-label={`Move ${module.title} up`} onClick={() => moveModule(moduleIndex, -1)}>↑</button>
            <button type="button" className="secondary" disabled={busy || moduleIndex === modules.length - 1} aria-label={`Move ${module.title} down`} onClick={() => moveModule(moduleIndex, 1)}>↓</button>
            <button type="button" className="secondary" disabled={busy} onClick={() => renameModule(module)}>Edit</button>
            <button type="button" className="secondary" disabled={busy} onClick={() => deleteModule(module.id)}>Delete</button>
          </div>}
        </div>
        {expanded.includes(module.id) && <div className="curriculum-module-body">
          {module.description && <p className="muted">{module.description}</p>}
          {module.materials.length === 0 && <p className="muted">No materials in this module.</p>}
          {module.materials.map((material, materialIndex) => <div key={material.id} className="curriculum-material">
            {editing === material.id ? <form className="curriculum-form" onSubmit={e => { e.preventDefault(); void saveEdit(material) }}>
              <input aria-label="Material title" required value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              {material.type === 'TEXT' && <textarea aria-label="Material text" required rows={4} value={editContent} onChange={e => setEditContent(e.target.value)} />}
              {material.type === 'LINK' && <input aria-label="Material URL" type="url" required value={editContent} onChange={e => setEditContent(e.target.value)} />}
              <div className="curriculum-actions"><button type="submit" disabled={busy}>Save</button><button type="button" className="secondary" onClick={() => setEditing(null)}>Cancel</button></div>
            </form> : <>
              <div className="curriculum-material-content">
                <strong>{material.type === 'PDF' ? '📄' : material.type === 'LINK' ? '🔗' : '📝'} {material.title}</strong>
                {material.type === 'TEXT' && <p className="curriculum-text">{material.content}</p>}
                {material.type === 'LINK' && material.content && <a href={material.content} target="_blank" rel="noopener noreferrer">Open resource</a>}
                {material.type === 'PDF' && <button type="button" className="secondary" disabled={busy} onClick={() => run(() => downloadPdf(material))}>Download PDF</button>}
              </div>
              {isInstructor && <div className="curriculum-actions">
                <button type="button" className="secondary" disabled={busy || materialIndex === 0} aria-label={`Move ${material.title} up`} onClick={() => moveMaterial(module, materialIndex, -1)}>↑</button>
                <button type="button" className="secondary" disabled={busy || materialIndex === module.materials.length - 1} aria-label={`Move ${material.title} down`} onClick={() => moveMaterial(module, materialIndex, 1)}>↓</button>
                <button type="button" className="secondary" disabled={busy} onClick={() => startEdit(material)}>Edit</button><button type="button" className="secondary" disabled={busy} onClick={() => deleteMaterial(material.id)}>Delete</button></div>}
            </>}
          </div>)}
          {isInstructor && (addingTo === module.id ? <form className="curriculum-form" onSubmit={e => addMaterial(e, module.id)}>
            <h3>Add learning material</h3>
            <label>Material type <select value={materialType} onChange={e => setMaterialType(e.target.value as 'TEXT' | 'LINK' | 'PDF')}><option value="TEXT">Text</option><option value="LINK">Link</option><option value="PDF">PDF</option></select></label>
            <input aria-label="New material title" required maxLength={200} placeholder="Material title" value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} />
            {materialType === 'TEXT' && <textarea aria-label="Text content" required rows={4} value={materialContent} onChange={e => setMaterialContent(e.target.value)} />}
            {materialType === 'LINK' && <input aria-label="Resource URL" type="url" required placeholder="https://..." value={materialContent} onChange={e => setMaterialContent(e.target.value)} />}
            {materialType === 'PDF' && <input aria-label="PDF file" type="file" accept=".pdf,application/pdf" required onChange={e => setFile(e.target.files?.[0] || null)} />}
            <div className="curriculum-actions"><button type="submit" disabled={busy || !materialTitle.trim()}>Save material</button><button type="button" className="secondary" onClick={() => setAddingTo(null)}>Cancel</button></div>
          </form> : <button type="button" className="secondary" onClick={() => { setAddingTo(module.id); setMaterialType('TEXT'); setMaterialTitle(''); setMaterialContent(''); setFile(null) }}>+ Add material</button>)}
        </div>}
      </article>)}</div>}
  </section>
}
