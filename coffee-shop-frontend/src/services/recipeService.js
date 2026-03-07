import axiosClient from './axiosClient';

const recipeService = {
  // Lấy công thức theo productId
  getByProduct(productId) {
    return axiosClient.get(`/recipes/product/${productId}`);
  },
  // Lấy công thức theo productSizeId
  getByProductSize(productSizeId) {
    return axiosClient.get(`/recipes/size/${productSizeId}`);
  },
  // Cập nhật công thức cho 1 size
  updateRecipe(productSizeId, data) {
    return axiosClient.put(`/recipes/size/${productSizeId}`, data);
  },
  // Thêm nguyên liệu vào công thức
  addIngredient(productSizeId, data) {
    return axiosClient.post(`/recipes/size/${productSizeId}`, data);
  },
  // Xóa nguyên liệu khỏi công thức
  deleteIngredient(recipeId) {
    return axiosClient.delete(`/recipes/${recipeId}`);
  },
};

export default recipeService;
