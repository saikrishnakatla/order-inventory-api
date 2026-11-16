import api from './client.js';

export async function login({ email, password }) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data; // { success: true, data: { token, user } }
}

export async function register({ name, email, password, role = 'customer' }) {
  const response = await api.post('/api/auth/register', { name, email, password, role });
  return response.data;
}
