import api from './client.js';

export async function createOrder(orderData) {
  const response = await api.post('/orders', orderData);
  return response.data; // { data: newOrder }
}

export async function getOrders() {
  const response = await api.get('/orders');
  return response.data; // { count: N, data: [...] }
}
