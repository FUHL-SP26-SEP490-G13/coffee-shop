import axiosClient from './axiosClient';


const ingredientService = {
  getAll() {
    return axiosClient.get('/ingredients');
  },
  create(data) {
    return axiosClient.post('/ingredients', data);
  },
};

export default ingredientService;
