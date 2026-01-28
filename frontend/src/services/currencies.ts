import api from './axios';

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

export const getCurrencies = async () => {
  const response = await api.get('/currencies');
  return response.data;
};

export const createCurrency = async (data: Omit<Currency, 'id'>) => {
  const response = await api.post('/currencies', data);
  return response.data;
};

export const updateCurrency = async (id: number, data: Partial<Currency>) => {
  const response = await api.put(`/currencies/${id}`, data);
  return response.data;
};

export const deleteCurrency = async (id: number) => {
  await api.delete(`/currencies/${id}`);
};

export default {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
};
