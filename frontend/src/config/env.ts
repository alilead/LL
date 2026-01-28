export const VITE_LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID
export const VITE_LINKEDIN_REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI

if (!VITE_LINKEDIN_CLIENT_ID) {
  throw new Error('VITE_LINKEDIN_CLIENT_ID is not defined')
}

if (!VITE_LINKEDIN_REDIRECT_URI) {
  throw new Error('VITE_LINKEDIN_REDIRECT_URI is not defined')
} 