import { api, getToken } from './client'

export type CurriculumMaterial = {
  id: number
  moduleId: number
  title: string
  type: 'TEXT' | 'LINK' | 'PDF'
  content: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export type CurriculumModule = {
  id: number
  courseId: number
  title: string
  description: string
  position: number
  materials: CurriculumMaterial[]
}

export const getCurriculum = (courseId: number) => api<CurriculumModule[]>(`/courses/${courseId}/curriculum`)
export const createModule = (courseId: number, title: string, description = '') =>
  api<CurriculumModule>(`/courses/${courseId}/curriculum/modules`, { method: 'POST', body: JSON.stringify({ title, description }) })
export const editModule = (moduleId: number, changes: { title?: string; description?: string; position?: number }) =>
  api<CurriculumModule>(`/curriculum/modules/${moduleId}`, { method: 'PATCH', body: JSON.stringify(changes) })
export const removeModule = (moduleId: number) => api<void>(`/curriculum/modules/${moduleId}`, { method: 'DELETE' })
export const reorderModules = (courseId: number, ids: number[]) =>
  api<CurriculumModule[]>(`/courses/${courseId}/curriculum/modules/order`, { method: 'PUT', body: JSON.stringify({ ids }) })
export const reorderMaterials = (moduleId: number, ids: number[]) =>
  api<CurriculumMaterial[]>(`/curriculum/modules/${moduleId}/materials/order`, { method: 'PUT', body: JSON.stringify({ ids }) })
export const createMaterial = (moduleId: number, title: string, type: 'TEXT' | 'LINK', content: string) =>
  api<CurriculumMaterial>(`/curriculum/modules/${moduleId}/materials`, { method: 'POST', body: JSON.stringify({ title, type, content }) })
export const editMaterial = (materialId: number, changes: { title?: string; content?: string; position?: number }) =>
  api<CurriculumMaterial>(`/curriculum/materials/${materialId}`, { method: 'PATCH', body: JSON.stringify(changes) })
export const removeMaterial = (materialId: number) => api<void>(`/curriculum/materials/${materialId}`, { method: 'DELETE' })

async function checkResponse(response: Response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body: { detail?: string } = await response.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch { /* invalid response */ }
    throw new Error(message)
  }
  return response
}

export async function uploadPdf(moduleId: number, title: string, file: File): Promise<CurriculumMaterial> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`/api/curriculum/modules/${moduleId}/upload?title=${encodeURIComponent(title)}`, {
    method: 'POST',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: form,
  })
  return (await checkResponse(response)).json() as Promise<CurriculumMaterial>
}

export async function downloadPdf(material: CurriculumMaterial): Promise<void> {
  const response = await fetch(`/api/curriculum/materials/${material.id}/download`, {
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
  })
  const blob = await (await checkResponse(response)).blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${material.title}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
