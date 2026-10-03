import { api } from '../context/AuthContext';

export const askAssistant = (message) => api.post('/assistant/ask', { message });
