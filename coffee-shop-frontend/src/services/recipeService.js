import axiosClient from './axiosClient';

const recipeService = {
  // Lấy công thức theo productId
  getByProduct(productId) {
    return axiosClient.get(`/recipes/product/${productId}`);
  },
  // Lấy công thức theo productSizeId
  getByProductSize(productSizeId) {
    return axiosClient.get(`/recipes/by-size/${productSizeId}`);
  },
  // Cập nhật công thức (theo id)
  updateRecipe(recipeId, data) {
    return axiosClient.put(`/recipes/${recipeId}`, data);
  },
  // Thêm nguyên liệu vào công thức
  addIngredient(productSizeId, data) {
    return axiosClient.post(`/recipes/by-size/${productSizeId}`, data);
  },
  // Xóa nguyên liệu khỏi công thức
  deleteIngredient(recipeId) {
    return axiosClient.delete(`/recipes/${recipeId}`);
  },
};

export default recipeService;
