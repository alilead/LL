import { api } from '../../lib/axios';

export interface CreditBalance {
  organization_id: number;
  credit_balance: number;
  subscription_status: string;
}

export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: number;
}

export class CreditsAPI {
  async getBalance(): Promise<CreditBalance> {
    const response = await api.get('/credits/balance');
    return response.data;
  }

  async getPackages(): Promise<CreditPackage[]> {
    const response = await api.get('/credits/packages');
    return response.data.packages || response.data;
  }

  async consumeCredits(data: { feature: string; credits: number }): Promise<{ success: boolean; new_balance: number }> {
    const response = await api.post('/credits/consume', data);
    return response.data;
  }

  async purchasePackage(packageId: number): Promise<{ checkout_url: string; session_id: string }> {
    const response = await api.post(`/credits/purchase/${packageId}`);
    return response.data;
  }

  async checkSufficientCredits(feature: string): Promise<{ sufficient: boolean; required: number; available: number }> {
    const response = await api.get(`/credits/check?feature=${feature}`);
    return response.data;
  }
}

export const creditsAPI = new CreditsAPI();
 