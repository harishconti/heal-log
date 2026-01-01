import { apiClient } from './client';

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export const paymentsApi = {
  createCheckoutSession: async (): Promise<CheckoutSession> => {
    const response = await apiClient.post<CheckoutSession>('/payments/create-checkout-session');
    return response.data;
  },
};
