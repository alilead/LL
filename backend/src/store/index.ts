import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  access_token: string | null
  login: (userData: User, access_token: string) => void
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      access_token: null,
      login: (userData, access_token) =>
        set({ isAuthenticated: true, user: userData, access_token }),
      logout: () => {
        localStorage.removeItem('auth-storage')
        set({ isAuthenticated: false, user: null, access_token: null })
      },
      register: async (name: string, email: string, password: string) => {
        try {
          // Generate username from email (before @ symbol)
          const username = email.split('@')[0]
          const firstName = name.split(' ')[0]
          const lastName = name.split(' ').slice(1).join(' ') || ''

          const response = await api.post('/auth/register', {
            email,
            password,
            username,
            first_name: firstName,
            last_name: lastName,
          })

          const userData = response.data

          // Login after successful registration
          const loginResponse = await api.post('/auth/login', {
            email,
            password,
          })

          const loginData = loginResponse.data

          set({
            isAuthenticated: true,
            user: userData,
            access_token: loginData.access_token,
          })
        } catch (error) {
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export { useAuthStore }
