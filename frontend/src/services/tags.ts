import api from './axios';

export interface Tag {
  id: number;
  name: string;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface TagCreate {
  name: string;
}

export interface TagUpdate extends Partial<TagCreate> {}

export interface TagsParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface LeadTagCreate {
  lead_id: number;
  tag_id: number;
  organization_id?: number;
}

export const getTags = async (params: TagsParams = {}) => {
  try {
    console.log('Fetching tags with params:', params);
    const response = await api.get('/tags', { params });
    console.log('Tags API response:', response.data);
    
    // Ensure we return an array
    const tags = Array.isArray(response.data) ? response.data : 
                (response.data?.tags || response.data?.items || []);
    
    console.log('Processed tags:', tags);
    return tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    // Return empty array on error
    return [];
  }
};

export const getById = async (id: number) => {
  try {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tag with id ${id}:`, error);
    return null;
  }
};

export const createTag = async (data: TagCreate) => {
  try {
    const response = await api.post('/tags', data);
    return response.data;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

export const update = async (id: number, data: TagUpdate) => {
  try {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

export const remove = async (id: number) => {
  try {
    await api.delete(`/tags/${id}`);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

export const addTagToLead = async (data: LeadTagCreate) => {
  try {
    const requestBody = { tags: [data.tag_id] };
    console.log('Adding tag to lead:', {
      leadId: data.lead_id,
      requestBody,
      url: `/leads/${data.lead_id}/tags`
    });

    const response = await api.post(`/leads/${data.lead_id}/tags`, requestBody);
    console.log('Add tag response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error adding tag to lead:', {
      error,
      response: error.response?.data,
      status: error.response?.status,
      requestData: data,
      errorMessage: error.response?.data?.detail || error.message
    });
    throw error;
  }
};

export const removeTagFromLead = async (leadId: number, tagId: number) => {
  try {
    const response = await api.delete(`/leads/${leadId}/tags/${tagId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing tag from lead:', error);
    throw error;
  }
};

export default {
  getTags,
  getById,
  createTag,
  update,
  remove,
  addTagToLead,
  removeTagFromLead,
};
