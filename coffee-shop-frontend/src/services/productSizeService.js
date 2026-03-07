import axiosClient from './axiosClient';

const productSizeService = {
  getByProduct(productId) {
    return axiosClient.get(`/product-sizes/product/${productId}`);
  },
};

export default productSizeService;
