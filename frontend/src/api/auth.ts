import { api } from './client'
import type { Role, User } from './types'

export type LoginResponse = { access_token: string; token_type: string; user: User }
export const loginRequest = (email: string, password: string) => api<LoginResponse>('/auth/login', {
  method: 'POST', body: JSON.stringify({ email, password }),
})
export const getMe = () => api<User>('/auth/me')

export type RegisterInput = { name: string; email: string; password: string; role: Role }
export const registerRequest = (data: RegisterInput) => api<LoginResponse>('/auth/register', {
  method: 'POST', body: JSON.stringify(data),
})
