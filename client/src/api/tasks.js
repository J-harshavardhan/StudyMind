import { api } from '../context/AuthContext';

export const getTodayTasks = () => api.get('/tasks/today');

export const getTasksRange = (from, to) =>
  api.get('/tasks/range', {
    params: { from, to }
  });

export const createTask = (payload) =>
  api.post('/tasks', payload);

export const updateTask = (id, payload) =>
  api.patch(`/tasks/${id}`, payload);

export const toggleTaskComplete = (id) =>
  api.patch(`/tasks/${id}/complete`);

export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`);