import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authService, { type UserInfo, type LoginCredentials, type RegisterData } from '../services/auth'
import api from '../lib/axios'

export interface User {
  id: string
  email: string
  username?: string
  first_name: string
  last_name: string
  is_active: boolean
  is_admin: boolean
  organization_id?: string
  created_at: string
  updated_at: string
  credit_balance: number
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  refreshToken: () => Promise<void>
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
      
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authService.login(credentials)
          const { access_token, user } = response
          
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
            error: error.response?.data?.message || error.response?.data?.detail || 'Login failed'
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          const user = await authService.register(data)
          set({ user, error: null })
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.response?.data?.detail || 'Registration failed'
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error)
        } finally {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
      
      fetchUser: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const user = await authService.getCurrentUser()
          set({ user, isAuthenticated: true, error: null })
        } catch (error: any) {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
          set({ 
            token: null, 
            user: null, 
            isAuthenticated: false,
            error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch user'
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      refreshToken: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authService.refreshToken()
          const { access_token } = response
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          localStorage.setItem('token', access_token)
          set({ token: access_token, error: null })
        } catch (error: any) {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
          set({ 
            token: null, 
            user: null, 
            isAuthenticated: false,
            error: error.response?.data?.message || 'Token refresh failed'
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
