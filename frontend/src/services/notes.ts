import api from './axios';

export interface Note {
  id: number;
  content: string;
  lead_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  content: string;
  lead_id: number;
}

export interface NoteUpdate {
  content: string;
}

export interface NotesParams {
  lead_id?: number;
  user_id?: number;
  page?: number;
  per_page?: number;
}

export const getNotes = async (params: NotesParams = {}) => {
  const response = await api.get('/notes', { params });
  return response.data;
};

export const getNote = async (id: number) => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

export const createNote = async (data: NoteCreate) => {
  const response = await api.post('/notes', data);
  return response.data;
};

export const updateNote = async (id: number, data: NoteUpdate) => {
  const response = await api.put(`/notes/${id}`, data);
  return response.data;
};

export const deleteNote = async (id: number) => {
  await api.delete(`/notes/${id}`);
};

export default {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
};
