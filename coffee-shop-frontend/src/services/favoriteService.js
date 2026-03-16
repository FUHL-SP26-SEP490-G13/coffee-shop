import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const favoriteService = {
  getMyFavorites: (params) =>
    axiosClient.get(API_ENDPOINTS.FAVORITES.BASE, { params }),

  checkFavorite: (productId) =>
    axiosClient.get(API_ENDPOINTS.FAVORITES.CHECK(productId)),

  addFavorite: (productId) =>
    axiosClient.post(API_ENDPOINTS.FAVORITES.BASE, {
      product_id: productId,
    }),

  removeFavorite: (productId) =>
    axiosClient.delete(API_ENDPOINTS.FAVORITES.REMOVE(productId)),

  toggleFavorite: (productId, isFavorite) => {
    if (isFavorite) {
      return favoriteService.removeFavorite(productId);
    }
    return favoriteService.addFavorite(productId);
  },
};

export default favoriteService;
