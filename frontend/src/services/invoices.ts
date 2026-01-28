import api from './axios';

export interface InvoiceEmailRequest {
  to_email: string;
  invoice_number: string;
  client_name: string;
  company_name: string;
  invoice_data: any;
  pdf_content?: string;
  message?: string;
}

export interface InvoiceEmailResponse {
  success: boolean;
  message: string;
  data?: {
    invoice_number: string;
    recipient: string;
    status: string;
  };
}

class InvoiceService {
  private baseUrl = '/invoices';

  /**
   * Send invoice via email to client
   */
  async sendInvoiceEmail(request: InvoiceEmailRequest): Promise<InvoiceEmailResponse> {
    try {
      const response = await api.post<InvoiceEmailResponse>(
        `${this.baseUrl}/send-invoice`,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to send invoice email'
      );
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/test-email`);
      return response.data;
    } catch (error: any) {
      console.error('Error testing email config:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to test email configuration'
      );
    }
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService; 