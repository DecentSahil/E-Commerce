import apiClient from './axios';

export const cartApi = {
  getCart: () =>
    apiClient.get('/cart'),

  addItem: (productId, listingId, quantity = 1) =>
    apiClient.post('/cart/items', { productId, listingId, quantity }),

  updateItem: (itemId, quantity) =>
    apiClient.put(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId) =>
    apiClient.delete(`/cart/items/${itemId}`),

  clearCart: () =>
    apiClient.delete('/cart'),
};
