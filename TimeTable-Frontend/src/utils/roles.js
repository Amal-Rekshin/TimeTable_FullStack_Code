// Admin emails are loaded from the VITE_ADMIN_EMAILS environment variable.
// Set in .env as a comma-separated list, e.g.:
//   VITE_ADMIN_EMAILS=admin@school.edu,principal@school.edu

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
