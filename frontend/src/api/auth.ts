import { api } from './client'
import type { User } from '../features/demo/store'

export type LoginResponse = { access_token: string; token_type: string; user: User }
export const loginRequest = (email: string, password: string) => api<LoginResponse>('/auth/login', {
  method: 'POST', body: JSON.stringify({ email, password }),
})
export const getMe = () => api<User>('/auth/me')
