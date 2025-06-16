import axios from 'axios';
import api from './axios';
import { extractLinkedInProfileId } from '@/utils/linkedin';
import { VITE_LINKEDIN_CLIENT_ID, VITE_LINKEDIN_REDIRECT_URI } from '@/config/env'

// PKCE Utils
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const base64URLEncode = (str: string) => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string) => {
  const hashed = await sha256(verifier);
  return base64URLEncode(hashed);
};

const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.response?.status === 429 || error?.response?.status === 503)) {
      await wait(RETRY_DELAY);
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

interface LinkedInCredentials {
  accessToken: string;
  expiresIn: number;
}

interface LinkedInConnectionResponse {
  success: boolean;
  message: string;
  connection_url?: string;
  instruction?: string;
  note?: string;
}

const SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social'
]

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';

export const getLinkedInAuthUrl = async () => {
  try {
    // Generate and store PKCE values
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store for later use
    localStorage.setItem('linkedin_code_verifier', codeVerifier);
    
    const state = crypto.randomUUID();
    localStorage.setItem('linkedin_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: VITE_LINKEDIN_CLIENT_ID,
      redirect_uri: VITE_LINKEDIN_REDIRECT_URI,
      state: state,
      scope: SCOPES.sort().join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    console.log('LinkedIn Auth URL params:', {
      clientId: VITE_LINKEDIN_CLIENT_ID,
      redirectUri: VITE_LINKEDIN_REDIRECT_URI,
      scopes: SCOPES,
      codeChallenge
    });

    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    throw new Error('Failed to generate LinkedIn authorization URL');
  }
};

// For initial OAuth flow (unauthenticated)
export const handleLinkedInCallback = async (code: string) => {
  try {
    const codeVerifier = localStorage.getItem('linkedin_code_verifier');
    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${baseURL}/api/v1/linkedin/token`, { 
      code,
      code_verifier: codeVerifier 
    });

    // Clean up storage
    localStorage.removeItem('linkedin_code_verifier');
    localStorage.removeItem('linkedin_state');

    return response.data;
  } catch (error: any) {
    console.error('LinkedIn callback error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      headers: error?.response?.headers,
      requestData: { code }
    });
    throw new Error(error?.response?.data?.detail || 'LinkedIn authentication failed');
  }
}

export const linkedinAPI = {
  // LinkedIn ile giriş yap
  authorize: async () => {
    try {
      const authUrl = await getLinkedInAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('LinkedIn authorization error:', error);
      throw new Error('Failed to redirect to LinkedIn authorization page');
    }
  },

  // For authenticated requests
  setCredentials: async (code: string) => {
    const codeVerifier = localStorage.getItem('linkedin_code_verifier');
    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    try {
      // Log request details
      console.log('LinkedIn authentication attempt:', {
        codeLength: code.length,
        codeStart: code.substring(0, 10),
        verifierLength: codeVerifier.length,
        redirectUri: VITE_LINKEDIN_REDIRECT_URI,
        apiUrl: import.meta.env.VITE_API_URL
      });

      // Implement retry logic for token request
      let retryCount = 0;
      const maxRetries = 2;
      let lastError: any = null;

      while (retryCount <= maxRetries) {
        try {
          console.log(`LinkedIn authentication attempt ${retryCount + 1}/${maxRetries + 1}`);
          
          const response = await api.post('/linkedin/token', { 
            code,
            code_verifier: codeVerifier 
          });

          // Clean up storage
          localStorage.removeItem('linkedin_code_verifier');
          localStorage.removeItem('linkedin_state');

          // Log success
          console.log('LinkedIn authentication successful:', {
            status: response.status,
            hasProfile: !!response.data?.profile,
            message: response.data?.message
          });

          return response.data;
        } catch (error: any) {
          console.error(`LinkedIn authentication attempt ${retryCount + 1} failed:`, {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data
          });
          
          lastError = error;
          
          // Only retry on specific recoverable errors (server errors)
          if (error?.response?.status === 500 || error?.response?.status === 503) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // Wait before retrying (exponential backoff)
              const delay = 1000 * Math.pow(2, retryCount);
              console.log(`Retrying LinkedIn authentication in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            // Non-recoverable error, break the loop
            break;
          }
        }
      }

      // If we got here, all retries failed
      throw lastError || new Error('LinkedIn authentication failed after multiple attempts');
    } catch (error: any) {
      // Enhanced error logging
      console.error('LinkedIn authentication error:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        errorMessage: error?.message,
        requestDetails: {
          code: code.substring(0, 10) + '...',
          codeVerifierLength: codeVerifier.length,
          apiUrl: import.meta.env.VITE_API_URL,
          redirectUri: VITE_LINKEDIN_REDIRECT_URI
        }
      });

      // Parse user-friendly error message
      let errorMessage = 'LinkedIn authentication failed';
      
      if (error?.response?.data?.detail) {
        if (error.response.data.detail.includes('invalid_client')) {
          errorMessage = 'LinkedIn application credentials are invalid. Please contact support.';
        } else if (error.response.data.detail.includes('authorization_pending')) {
          errorMessage = 'LinkedIn authorization is pending. Please try again.';
        } else if (error.response.data.detail.includes('missing')) {
          errorMessage = 'Missing required LinkedIn authentication parameters. Please try again or contact support.';
        } else if (error.response.data.detail.includes('expired')) {
          errorMessage = 'LinkedIn authorization code has expired. Please try again.';
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Display a helpful message to users about how to resolve the issue
      if (error?.response?.status === 401) {
        errorMessage += ' Please reconnect your LinkedIn account.';
      } else if (error?.response?.status === 429) {
        errorMessage = 'Too many LinkedIn requests. Please try again later.';
      }

      throw new Error(errorMessage);
    }
  },

  // LinkedIn profil bilgilerini getir
  getProfile: async (profileUrl: string) => {
    const response = await api.post('/linkedin/profile', { profileUrl });
    return response.data;
  },

  // LinkedIn mesaj gönder
  sendMessage: async (linkedinUrl: string, message: string) => {
    const profileId = extractLinkedInProfileId(linkedinUrl);
    const response = await api.post('/linkedin/messages', {
      profile_id: profileId,
      content: message
    });
    return response.data;
  },

  // LinkedIn bağlantı isteği gönder
  sendConnection: async (linkedinUrl: string, message?: string): Promise<LinkedInConnectionResponse> => {
    try {
      // Extract profile ID from URL - handle null/empty values
      if (!linkedinUrl) {
        throw new Error("LinkedIn URL is required");
      }
      
      const profileId = extractLinkedInProfileId(linkedinUrl);
      if (!profileId) {
        console.error("Failed to extract profile ID from URL:", linkedinUrl);
        throw new Error("Invalid LinkedIn URL format. Could not extract profile ID.");
      }
      
      console.log("Sending LinkedIn connection request to profile ID:", profileId);
      
      const response = await api.post('/linkedin/connect', {
        profile_id: profileId,
        message
      });
      
      return response.data;
    } catch (error: any) {
      console.error("LinkedIn connection request error:", {
        url: linkedinUrl,
        errorStatus: error?.response?.status,
        errorData: error?.response?.data,
        errorMessage: error?.message
      });
      
      // Provide more specific error message based on error type
      if (error?.response?.status === 401) {
        throw new Error("LinkedIn authentication required. Please connect your LinkedIn account first.");
      } else if (error?.response?.status === 400) {
        throw new Error(`Invalid request: ${error?.response?.data?.detail || "Check the LinkedIn URL"}`);
      } else if (error?.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error?.response?.status === 500) {
        throw new Error("Server error. Please try again later or contact support.");
      }
      
      throw new Error(error?.response?.data?.detail || error?.message || "Failed to send LinkedIn connection request");
    }
  },

  // LinkedIn mesajları getir
  getMessages: async (profileId: string) => {
    const response = await api.get(`/linkedin/messages/${profileId}`);
    return response.data;
  }
}; 