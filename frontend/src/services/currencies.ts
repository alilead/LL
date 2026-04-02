import api from './axios';

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

/** Backend returns a JSON array; axios 401/404 fallbacks may use `{ items: [] }`. */
export const getCurrencies = async (): Promise<Currency[]> => {
  const response = await api.get('/currencies');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: Currency[] }).items;
  }
  return [];
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
