import apiClient from './axios';

export const productsApi = {
  getProducts: (params = {}) =>
    apiClient.get('/products', { params }),

  getProductById: (productId) =>
    apiClient.get(`/products/${productId}`),

  getListingsByProductId: (productId) =>
    apiClient.get(`/listings/product/${productId}`),

  getListingById: (id) =>
    apiClient.get(`/listings/${id}`),

  getListingsBySellerId: (sellerId) =>
    apiClient.get(`/listings/seller/${sellerId}`),

  deductStock: (id, quantity) =>
    apiClient.post(`/listings/${id}/deduct-stock`, null, { params: { quantity } }),

  restoreStock: (id, quantity) =>
    apiClient.post(`/listings/${id}/restore-stock`, null, { params: { quantity } }),

  getCategories: () =>
    apiClient.get('/categories'),

  getBrands: () =>
    apiClient.get('/brands'),

  createProduct: (data) =>
    apiClient.post('/products', data),

  updateProduct: (productId, data) =>
    apiClient.put(`/products/${productId}`, data),

  patchProduct: (productId, data) =>
    apiClient.patch(`/products/${productId}`, data),

  deleteProduct: (productId) =>
    apiClient.delete(`/products/${productId}`),

  getCategoryById: (id) =>
    apiClient.get(`/categories/${id}`),

  createCategory: (data) =>
    apiClient.post('/categories', data),

  updateCategory: (id, data) =>
    apiClient.put(`/categories/${id}`, data),

  deleteCategory: (id) =>
    apiClient.delete(`/categories/${id}`),

  getBrandById: (id) =>
    apiClient.get(`/brands/${id}`),

  createBrand: (data) =>
    apiClient.post('/brands', data),

  updateBrand: (id, data) =>
    apiClient.put(`/brands/${id}`, data),

  deleteBrand: (id) =>
    apiClient.delete(`/brands/${id}`),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadProductImage: (productId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/products/${productId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
