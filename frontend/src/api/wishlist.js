import apiClient from './axios';

export const wishlistApi = {
  getWishlist: () =>
    apiClient.get('/wishlist'),

  addItem: (productId) =>
    apiClient.post(`/wishlist/items/${productId}`),

  removeItem: (productId) =>
    apiClient.delete(`/wishlist/items/${productId}`),
};
