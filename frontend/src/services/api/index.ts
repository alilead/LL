import axios from 'axios';
import { API_URL } from '@/config';
import { informationRequestsAPI } from './information-requests';
import leadsAPI from './leads';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', {
    method: config.method,
    url: config.url,
    params: config.params,
    data: config.data,
    headers: config.headers,
  });
  return config;
});

// Add response interceptor
instance.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

export { instance as api, informationRequestsAPI, leadsAPI };

import axiosApiInstance from '../axios';

export const dealsAPI = {
  getAll: () => axiosApiInstance.get("/deals/"),
  get: (id: number) => axiosApiInstance.get(`/deals/${id}/`),
  create: (data: any) => {
    console.log('Creating deal with data:', data);
    
    // Veriyi backend formatına dönüştürelim
    const formattedData = { ...data };
    
    // Status formatını kontrol edelim (Closed_Won → Closed Won)
    if (formattedData.status) {
      if (formattedData.status === 'Closed_Won') {
        formattedData.status = 'Closed Won';
      } else if (formattedData.status === 'Closed_Lost') {
        formattedData.status = 'Closed Lost';
      }
    }
    
    // Amount string ise sayıya çevirelim
    if (typeof formattedData.amount === 'string') {
      formattedData.amount = parseFloat(formattedData.amount) || 0;
    }
    
    console.log('Formatted deal data for backend:', formattedData);
    
    return axiosApiInstance.post("/deals/", formattedData)
      .catch(error => {
        console.error('Deal creation error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },
  update: (id: number, data: any) => {
    console.log('Updating deal with ID:', id, 'and data:', data);
    
    // Create a deep copy of the data to avoid modifying the original
    const formattedData = JSON.parse(JSON.stringify(data));
    
    // Handle status formatting based on backend requirements
    if (formattedData.status) {
      console.log(`Original status value: "${formattedData.status}" (${typeof formattedData.status})`);
      
      // In the deal model, the enum values are:
      // Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
      
      // Try to ensure status is correctly formatted for backend
      if (formattedData.status === 'Closed_Won') {
        formattedData.status = 'Closed Won';
      } else if (formattedData.status === 'Closed_Lost') {
        formattedData.status = 'Closed Lost';
      }
      
      console.log(`Formatted status for backend: "${formattedData.status}"`);
    }
    
    console.log('Sending formatted data to backend:', formattedData);
    
    // Use explicit content type and debug the request
    return axiosApiInstance.put(`/deals/${id}/`, formattedData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Deal update successful:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Deal update error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        request: {
          url: `/deals/${id}/`,
          method: 'PUT',
          data: formattedData
        }
      });
      throw error;
    });
  },
  delete: (id: number) => axiosApiInstance.delete(`/deals/${id}/`),
};
