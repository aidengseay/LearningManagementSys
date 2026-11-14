const TOKEN_KEY = 'lms-access-token'

export function getToken() { return sessionStorage.getItem(TOKEN_KEY) }
export function saveToken(token: string) { sessionStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { sessionStorage.removeItem(TOKEN_KEY) }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body: { detail?: unknown } = await response.json()
      if (typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body.detail)) {
        const messages = body.detail
          .map(item => typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : '')
          .filter(Boolean)
        if (messages.length) message = messages.join('. ')
      }
    } catch { /* no JSON body */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}
