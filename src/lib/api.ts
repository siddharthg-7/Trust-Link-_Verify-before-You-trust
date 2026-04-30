// Helper for API requests to ensure the correct base URL is used in production.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
