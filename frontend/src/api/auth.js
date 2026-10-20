import apiClient from './axios';

export const authApi = {
  login: (data) =>
    apiClient.post('/auth/login', data),

  loginWithOtp: (data) =>
    apiClient.post('/auth/otp/login', data),

  register: (data) => {
    const otp = data.otp || data.Otp;
    return apiClient.post('/auth/register', {
      email: data.email,
      password: data.password,
      otp,
      Otp: otp,
    });
  },

  sendOtp: (email) =>
    apiClient.post('/auth/send-otp', { email }),

  logout: (data) =>
    apiClient.post('/auth/logout', data),

  getCurrentUser: () =>
    apiClient.get('/auth/me'),

  getPendingSellers: () =>
    apiClient.get('/auth/admin/sellers/pending'),

  approveSeller: (userId) =>
    apiClient.patch(`/auth/admin/sellers/${userId}/approve`),

  rejectSeller: (userId) =>
    apiClient.patch(`/auth/admin/sellers/${userId}/reject`),
};
