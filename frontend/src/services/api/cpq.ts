/**
 * CPQ (Configure-Price-Quote) API Service
 */

import api from '@/lib/axios';

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  category?: string;
  organization_id: number;
  created_at: string;
}

export interface QuoteItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total?: number;
  description?: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  organization_id: number;
  deal_id?: number;
  created_by_id?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  valid_until?: string;
  requires_approval: boolean;
  approved_by_id?: number;
  approved_at?: string;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  items?: QuoteItem[];
}

export interface PricingRule {
  id: number;
  name: string;
  organization_id: number;
  conditions: any;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export const cpqAPI = {
  // Products
  getProducts: async (category?: string, is_active?: boolean): Promise<Product[]> => {
    const params: any = {};
    if (category) params.category = category;
    if (is_active !== undefined) params.is_active = is_active;
    const response = await api.get('/cpq/products', { params });
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/cpq/products/${id}`);
    return response.data;
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post('/cpq/products', data);
    return response.data;
  },

  updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/cpq/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/cpq/products/${id}`);
  },

  // Quotes
  getQuotes: async (status?: string, dealId?: number): Promise<Quote[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (dealId) params.deal_id = dealId;
    const response = await api.get('/cpq/quotes', { params });
    return response.data;
  },

  getQuote: async (id: number): Promise<Quote> => {
    const response = await api.get(`/cpq/quotes/${id}`);
    return response.data;
  },

  createQuote: async (data: { deal_id?: number; valid_until?: string; items: Omit<QuoteItem, 'id' | 'line_total'>[] }): Promise<Quote> => {
    const response = await api.post('/cpq/quotes', data);
    return response.data;
  },

  updateQuote: async (id: number, data: Partial<Quote>): Promise<Quote> => {
    const response = await api.put(`/cpq/quotes/${id}`, data);
    return response.data;
  },

  addQuoteItem: async (quoteId: number, item: Omit<QuoteItem, 'id' | 'line_total'>): Promise<Quote> => {
    const response = await api.post(`/cpq/quotes/${quoteId}/items`, item);
    return response.data;
  },

  removeQuoteItem: async (quoteId: number, itemId: number): Promise<Quote> => {
    const response = await api.delete(`/cpq/quotes/${quoteId}/items/${itemId}`);
    return response.data;
  },

  updateQuoteStatus: async (id: number, status: string): Promise<Quote> => {
    const response = await api.post(`/cpq/quotes/${id}/status`, { status });
    return response.data;
  },

  approveQuote: async (id: number, approved: boolean, comments?: string): Promise<Quote> => {
    const response = await api.post(`/cpq/quotes/${id}/approve`, { approved, comments });
    return response.data;
  },

  // Pricing Rules
  getPricingRules: async (): Promise<PricingRule[]> => {
    const response = await api.get('/cpq/pricing-rules');
    return response.data;
  },

  createPricingRule: async (data: Partial<PricingRule>): Promise<PricingRule> => {
    const response = await api.post('/cpq/pricing-rules', data);
    return response.data;
  },

  updatePricingRule: async (id: number, data: Partial<PricingRule>): Promise<PricingRule> => {
    const response = await api.put(`/cpq/pricing-rules/${id}`, data);
    return response.data;
  },

  deletePricingRule: async (id: number): Promise<void> => {
    await api.delete(`/cpq/pricing-rules/${id}`);
  }
};
