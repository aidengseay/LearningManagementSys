import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  createMaterial, createModule, downloadPdf, editMaterial, editModule,
  getCurriculum, removeMaterial, removeModule, reorderModules, reorderMaterials, uploadPdf,
  type CurriculumMaterial, type CurriculumModule,
} from '../../api/curriculum'
import MarkdownText from '../../components/MarkdownText'

type MaterialType = 'TEXT' | 'LINK' | 'PDF'

const TYPE_LABEL: Record<MaterialType, string> = {
  TEXT: 'Text',
  LINK: 'Link',
  PDF: 'PDF',
}

function Svg({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const ChevronIcon = () => <Svg><path d="m9 18 6-6-6-6" /></Svg>
const UpIcon = () => <Svg size={16}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></Svg>
const DownIcon = () => <Svg size={16}><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></Svg>
const EditIcon = () => <Svg size={16}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Svg>
const TrashIcon = () => (
  <Svg size={16}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)
const PlusIcon = () => <Svg size={16}><path d="M5 12h14" /><path d="M12 5v14" /></Svg>
const ExternalIcon = () => (
  <Svg size={16}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Svg>
)
const DownloadIcon = () => (
  <Svg size={16}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Svg>
)

function TypeIcon({ type }: { type: MaterialType }) {
  if (type === 'LINK') {
    return (
      <Svg>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </Svg>
    )
  }
  if (type === 'PDF') {
    return (
      <Svg>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </Svg>
    )
  }
  return (
    <Svg>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </Svg>
  )
}

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
  const [materialType, setMaterialType] = useState<MaterialType>('TEXT')
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
      const created = await createModule(courseId, title.trim(), description)
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
        await createMaterial(moduleId, materialTitle.trim(), materialType, materialType === 'LINK' ? materialContent.trim() : materialContent)
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
        ...(material.type !== 'PDF' ? { content: material.type === 'LINK' ? editContent.trim() : editContent } : {}),
      })
      setEditing(null)
    })
  }
  function startEdit(material: CurriculumMaterial) {
    setEditing(material.id); setEditTitle(material.title); setEditContent(material.content || '')
  }

  return (
    <section className="course-content-section panel">
      <div className="course-section-heading">
        <div>
          <p className="course-eyebrow">COURSE MATERIALS</p>
          <h2>Curriculum</h2>
          <p>Lessons, readings, PDFs, and additional course resources.</p>
        </div>
      </div>

      {error && <p role="alert" className="cur-error">{error}</p>}

      {isInstructor && (
        <form className="cur-add-module" onSubmit={addModule}>
          <h3 className="cur-form-title">Add module</h3>

          <div className="tool-field">
            <label htmlFor="new-module-title">Module name</label>
            <input
              id="new-module-title"
              required
              maxLength={200}
              placeholder="e.g. Week 1: Getting started"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="tool-field">
            <label htmlFor="new-module-description">
              Description <span className="cur-optional">(optional)</span>
            </label>
            <textarea
              id="new-module-description"
              placeholder="What will students cover in this module?"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="cur-form-actions">
            <button type="submit" disabled={busy || !title.trim()}>
              {busy ? 'Working...' : 'Create module'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="cur-empty">Loading curriculum...</p>
      ) : modules.length === 0 ? (
        <div className="cur-empty">
          <h3>No curriculum yet</h3>
          <p>
            {isInstructor
              ? 'Create your first module above to start adding lessons and resources.'
              : 'No curriculum materials have been added yet.'}
          </p>
        </div>
      ) : (
        <div className="cur-modules">
          {modules.map((module, moduleIndex) => {
            const open = expanded.includes(module.id)
            const count = module.materials.length

            return (
              <article key={module.id} className={`cur-module${open ? ' open' : ''}`}>
                <div className="cur-module-head">
                  <button
                    type="button"
                    className="cur-toggle"
                    onClick={() => toggle(module.id)}
                    aria-expanded={open}
                    aria-controls={`module-body-${module.id}`}
                  >
                    <span className="cur-chevron"><ChevronIcon /></span>
                    <span className="cur-number">{moduleIndex + 1}</span>
                    <span className="cur-module-text">
                      <strong>{module.title}</strong>
                      <small>{count} {count === 1 ? 'item' : 'items'}</small>
                    </span>
                  </button>

                  {isInstructor && (
                    <div className="cur-actions">
                      <button type="button" className="cur-icon-btn" title="Move up" disabled={busy || moduleIndex === 0} aria-label={`Move ${module.title} up`} onClick={() => moveModule(moduleIndex, -1)}><UpIcon /></button>
                      <button type="button" className="cur-icon-btn" title="Move down" disabled={busy || moduleIndex === modules.length - 1} aria-label={`Move ${module.title} down`} onClick={() => moveModule(moduleIndex, 1)}><DownIcon /></button>
                      <button type="button" className="cur-icon-btn" title="Edit module" disabled={busy} aria-label={`Edit ${module.title}`} onClick={() => renameModule(module)}><EditIcon /></button>
                      <button type="button" className="cur-icon-btn danger" title="Delete module" disabled={busy} aria-label={`Delete ${module.title}`} onClick={() => deleteModule(module.id)}><TrashIcon /></button>
                    </div>
                  )}
                </div>

                {open && (
                  <div className="cur-module-body" id={`module-body-${module.id}`}>
                    {module.description && <MarkdownText className="cur-desc" text={module.description} />}
                    {count === 0 && <p className="cur-none">No materials in this module.</p>}

                    {module.materials.map((material, materialIndex) => (
                      <div key={material.id} className={`cur-material${editing === material.id ? ' editing' : ''}`}>
                        {editing === material.id ? (
                          <form className="cur-form" onSubmit={e => { e.preventDefault(); void saveEdit(material) }}>
                            <div className="tool-field">
                              <label htmlFor={`edit-title-${material.id}`}>Title</label>
                              <input id={`edit-title-${material.id}`} required value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                            </div>
                            {material.type === 'TEXT' && (
                              <div className="tool-field">
                                <label htmlFor={`edit-text-${material.id}`}>Text</label>
                                <textarea id={`edit-text-${material.id}`} required rows={4} value={editContent} onChange={e => setEditContent(e.target.value)} />
                              </div>
                            )}
                            {material.type === 'LINK' && (
                              <div className="tool-field">
                                <label htmlFor={`edit-url-${material.id}`}>URL</label>
                                <input id={`edit-url-${material.id}`} type="url" required value={editContent} onChange={e => setEditContent(e.target.value)} />
                              </div>
                            )}
                            <div className="cur-form-actions">
                              <button type="button" className="cur-btn cur-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                              <button type="submit" disabled={busy}>Save</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className={`cur-type-icon ${material.type.toLowerCase()}`}>
                              <TypeIcon type={material.type} />
                            </div>

                            <div className="cur-material-main">
                              <div className="cur-material-title">
                                <strong>{material.title}</strong>
                                <span className="cur-tag">{TYPE_LABEL[material.type]}</span>
                              </div>

                              {material.type === 'TEXT' && <MarkdownText className="cur-text" text={material.content} />}
                              {material.type === 'LINK' && material.content && (
                                <a className="cur-btn cur-link" href={material.content} target="_blank" rel="noopener noreferrer">
                                  Open resource <ExternalIcon />
                                </a>
                              )}
                              {material.type === 'PDF' && (
                                <button type="button" className="cur-btn" disabled={busy} onClick={() => run(() => downloadPdf(material))}>
                                  <DownloadIcon /> Download PDF
                                </button>
                              )}
                            </div>

                            {isInstructor && (
                              <div className="cur-actions">
                                <button type="button" className="cur-icon-btn" title="Move up" disabled={busy || materialIndex === 0} aria-label={`Move ${material.title} up`} onClick={() => moveMaterial(module, materialIndex, -1)}><UpIcon /></button>
                                <button type="button" className="cur-icon-btn" title="Move down" disabled={busy || materialIndex === module.materials.length - 1} aria-label={`Move ${material.title} down`} onClick={() => moveMaterial(module, materialIndex, 1)}><DownIcon /></button>
                                <button type="button" className="cur-icon-btn" title="Edit" disabled={busy} aria-label={`Edit ${material.title}`} onClick={() => startEdit(material)}><EditIcon /></button>
                                <button type="button" className="cur-icon-btn danger" title="Delete" disabled={busy} aria-label={`Delete ${material.title}`} onClick={() => deleteMaterial(material.id)}><TrashIcon /></button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {isInstructor && (addingTo === module.id ? (
                      <form className="cur-form cur-form-card" onSubmit={e => addMaterial(e, module.id)}>
                        <h4 className="cur-form-title">Add learning material</h4>

                        <div className="tool-field">
                          <span className="cur-label" id={`material-type-label-${module.id}`}>Material type</span>
                          <div
                            className="tool-segmented cur-type-picker"
                            role="radiogroup"
                            aria-labelledby={`material-type-label-${module.id}`}
                          >
                            {(['TEXT', 'LINK', 'PDF'] as const).map(type => (
                              <label key={type} className={`tool-segment${materialType === type ? ' selected' : ''}`}>
                                <input
                                  type="radio"
                                  name={`material-type-${module.id}`}
                                  value={type}
                                  checked={materialType === type}
                                  onChange={() => setMaterialType(type)}
                                />
                                {TYPE_LABEL[type]}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="tool-field">
                          <label htmlFor={`new-material-title-${module.id}`}>Title</label>
                          <input
                            id={`new-material-title-${module.id}`}
                            required
                            maxLength={200}
                            placeholder="Material title"
                            value={materialTitle}
                            onChange={e => setMaterialTitle(e.target.value)}
                          />
                        </div>

                        {materialType === 'TEXT' && (
                          <div className="tool-field">
                            <label htmlFor={`new-material-text-${module.id}`}>Text content</label>
                            <textarea
                              id={`new-material-text-${module.id}`}
                              required
                              rows={4}
                              placeholder="Write the lesson or reading here..."
                              value={materialContent}
                              onChange={e => setMaterialContent(e.target.value)}
                            />
                          </div>
                        )}
                        {materialType === 'LINK' && (
                          <div className="tool-field">
                            <label htmlFor={`new-material-url-${module.id}`}>Resource URL</label>
                            <input
                              id={`new-material-url-${module.id}`}
                              type="url"
                              required
                              placeholder="https://..."
                              value={materialContent}
                              onChange={e => setMaterialContent(e.target.value)}
                            />
                          </div>
                        )}
                        {materialType === 'PDF' && (
                          <div className="tool-field">
                            <label htmlFor={`new-material-file-${module.id}`}>PDF file</label>
                            <input
                              id={`new-material-file-${module.id}`}
                              className="cur-file"
                              type="file"
                              accept=".pdf,application/pdf"
                              required
                              onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                          </div>
                        )}

                        <div className="cur-form-actions">
                          <button type="button" className="cur-btn cur-btn-ghost" onClick={() => setAddingTo(null)}>Cancel</button>
                          <button type="submit" disabled={busy || !materialTitle.trim()}>
                            {busy ? 'Saving...' : 'Save material'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="cur-add-btn"
                        onClick={() => { setAddingTo(module.id); setMaterialType('TEXT'); setMaterialTitle(''); setMaterialContent(''); setFile(null) }}
                      >
                        <PlusIcon /> Add material
                      </button>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}