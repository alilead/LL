import { create } from 'zustand'
import { api } from '../lib/axios'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_admin: boolean
  organization_id: number
  company?: string
  job_title?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user }),
      
      setToken: (token) => set({ token }),
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/login', { email, password })
          const { access_token, user } = response.data
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          localStorage.setItem('token', access_token)
          set({ token: access_token, user, isAuthenticated: true, error: null })
        } catch (error: any) {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
          set({ 
            token: null, 
            user: null, 
            isAuthenticated: false,
            error: error.response?.data?.detail || 'Login failed'
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      fetchUser: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.get('/auth/me')
          const user = response.data
          set({ user, isAuthenticated: true, error: null })
        } catch (error: any) {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
          set({ 
            token: null, 
            user: null, 
            isAuthenticated: false,
            error: error.response?.data?.detail || 'Failed to fetch user'
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Auto-login if token exists
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  useAuthStore.getState().fetchUser().catch(() => {
    delete api.defaults.headers.common['Authorization']
  })
}
