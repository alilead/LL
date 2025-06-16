import api from '../lib/axios';
import { User } from './users';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  expires_at: string;
}

interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export const authService = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    try {
      // Try with the endpoint without trailing slash first
      const response = await api.post('/auth/login', data);
      
      // Store the token in localStorage immediately
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        // Set default headers for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        console.log('Login successful, token stored');
      }
      
      return response.data;
    } catch (firstError) {
      console.error('First login attempt failed, trying alternative endpoint', firstError);
      
      try {
        // If first attempt fails, try with trailing slash
        const response = await api.post('/auth/login/', data);
        
        // Store the token in localStorage
        if (response.data && response.data.access_token) {
          localStorage.setItem('token', response.data.access_token);
          
          // Set default headers for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
          
          console.log('Login successful with alternative endpoint, token stored');
        }
        
        return response.data;
      } catch (secondError) {
        console.error('Both login attempts failed', secondError);
        throw secondError;
      }
    }
  },

  logout: async () => {
    // Clear token first to prevent any authenticated requests after logout
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.warn('Logout API call failed, but token was cleared locally', error);
      return { message: "Logged out successfully (local only)" };
    }
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    
    // Update token if successful
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    }
    
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (data: ChangePasswordInput) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  }
};
