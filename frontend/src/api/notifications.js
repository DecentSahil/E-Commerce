import apiClient from './axios';

export const notificationsApi = {
  getNotifications: (params = {}) => {
    const { unreadOnly = false, page = 0, size = 20 } = params;
    return apiClient.get('/notifications', {
      params: { unreadOnly, page, size },
    });
  },

  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),

  markAsRead: (notificationId) =>
    apiClient.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all'),
};

export default notificationsApi;
