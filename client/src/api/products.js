import api from './client.js';

export async function getProducts(params = {}) {
  const response = await api.get('/products', { params });
  return response.data; // { count: N, data: [...] }
}

export async function updateProduct(id, data) {
  const response = await api.patch(`/products/${id}`, data);
  return response.data; // { data: updatedProduct }
}

export async function createProduct(data) {
  const response = await api.post('/products', data);
  return response.data;
}
