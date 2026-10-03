import { api } from '../context/AuthContext';

export const getMonthCalendar = (year, month) =>
  api.get('/calendar/month', {
    params: { year, month }
  });

export const getUpcomingEvents = (days = 14) =>
  api.get('/calendar/upcoming', {
    params: { days }
  });