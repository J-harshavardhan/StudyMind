export function userError(error, fallback = 'Something went wrong. Please try again.') {
  const status = error?.response?.status;
  if (!error?.response) return 'Unable to connect. Please try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status >= 500) return 'Something went wrong. Please try again.';
  const message = error.response?.data?.message;
  if (!message || /zod|axios|cast|request failed|string must|invalid_type|required/i.test(message)) return fallback;
  return message;
}
