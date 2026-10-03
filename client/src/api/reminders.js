import { api } from '../context/AuthContext';

export const getUpcomingReminders = () => api.get('/reminders/upcoming');
export const getRemindersForDate = (dateKey) => api.get(`/reminders/date/${dateKey}`);
export const createReminder = (payload) => api.post('/reminders', payload);
export const updateReminderStatus = (id, status, occurrenceDateKey) => api.patch(`/reminders/${id}/status`, { status, occurrenceDateKey });
export const updateReminder = (id, payload) => api.patch(`/reminders/${id}`, payload);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`);
