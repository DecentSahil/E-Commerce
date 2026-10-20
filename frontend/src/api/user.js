import apiClient from './axios';

export const userApi = {
  getProfile: (userId) =>
    apiClient.get(`/users/${userId}`),

  updateProfile: (userId, data) =>
    apiClient.put(`/users/${userId}`, data),

  patchProfile: (userId, data) =>
    apiClient.patch(`/users/${userId}`, data),

  deleteProfile: (userId) =>
    apiClient.delete(`/users/${userId}`),

  uploadAvatar: (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getAddresses: () =>
    apiClient.get('/users/addresses'),

  getAddress: (addressId) =>
    apiClient.get(`/users/addresses/${addressId}`),

  addAddress: (data) =>
    apiClient.post('/users/addresses', data),

  updateAddress: (addressId, data) =>
    apiClient.put(`/users/addresses/${addressId}`, data),

  deleteAddress: (addressId) =>
    apiClient.delete(`/users/addresses/${addressId}`),

  setDefaultAddress: (addressId) =>
    apiClient.patch(`/users/addresses/${addressId}/default`),
};
