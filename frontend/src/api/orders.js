import apiClient from './axios';

export const ordersApi = {
  checkoutCart: (checkoutData, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return apiClient.post('/orders/checkout', checkoutData, { headers });
  },

  createOrder: (orderData, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return apiClient.post('/orders', orderData, { headers });
  },

  getMyOrders: (page = 0, size = 20) =>
    apiClient.get('/orders', { params: { page, size } }),

  getOrderById: (orderId) =>
    apiClient.get(`/orders/${orderId}`),

  cancelOrder: (orderId, reason = 'Cancelled by user') =>
    apiClient.post(`/orders/${orderId}/cancel`, null, { params: { reason } }),

  getOrderHistory: (orderId) =>
    apiClient.get(`/orders/${orderId}/history`),
  getSellerOrders: (page = 0, size = 20) =>
    apiClient.get('/orders/seller', { params: { page, size } }),

  updateSellerOrderStatus: (orderId, status, reason = 'Status updated by seller') =>
    apiClient.patch(`/orders/${orderId}/status`, { status, reason }),
  adminGetAllOrders: (page = 0, size = 20) =>
    apiClient.get('/orders/admin/all', { params: { page, size } }),

  adminGetOrderById: (orderId) =>
    apiClient.get(`/orders/admin/${orderId}`),

  adminUpdateOrderStatus: (orderId, status, reason = 'Status updated by admin') =>
    apiClient.patch(`/orders/${orderId}/status`, { status, reason }),
};
