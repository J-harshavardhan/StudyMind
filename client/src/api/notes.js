import { api } from '../context/AuthContext';

export const listNotes = (params = {}) => api.get('/notes', { params });
export const getNote = (id) => api.get(`/notes/${id}`);
export const createNote = (payload) => api.post('/notes', payload);
export const updateNote = (id, payload) => api.patch(`/notes/${id}`, payload);
export const toggleNotePin = (id) => api.patch(`/notes/${id}/pin`);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
