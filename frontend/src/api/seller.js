import apiClient from './axios';

export const sellerApi = {
  getMyListings: () =>
    apiClient.get('/listings/my'),

  createListing: (data) =>
    apiClient.post('/listings', data),

  updateListing: (listingId, data) =>
    apiClient.put(`/listings/${listingId}`, data),

  deleteListing: (listingId) =>
    apiClient.delete(`/listings/${listingId}`),

  deductStock: (listingId, quantity) =>
    apiClient.post(`/listings/${listingId}/deduct-stock`, null, { params: { quantity } }),

  restoreStock: (listingId, quantity) =>
    apiClient.post(`/listings/${listingId}/restore-stock`, null, { params: { quantity } }),
};

export default sellerApi;
