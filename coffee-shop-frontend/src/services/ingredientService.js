import axiosClient from './axiosClient';

const ingredientService = {
  getAll() {
    return axiosClient.get('/ingredients');
  },
  search({ keyword, limit, offset }) {
    let url = `/ingredients/search?keyword=${keyword}`;
    if (limit) url += `&limit=${limit}`;
    if (offset) url += `&offset=${offset}`;
    return axiosClient.get(url);
  },
  getById(id) {
    return axiosClient.get(`/ingredients/${id}`);
  },
  create(data) {
    return axiosClient.post('/ingredients', data);
  },
  update(id, data) {
    return axiosClient.put(`/ingredients/${id}`, data);
  },
  delete(id) {
    return axiosClient.delete(`/ingredients/${id}`);
  },
};

export default ingredientService;
