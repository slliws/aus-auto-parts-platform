import apiService from './api.service';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Payment {
  id: string;
  tenant_id: string;
  order_id: string;
  customer_id: string;
  payment_method_id?: string;
  payment_method: string;
  payment_gateway: string;
  payment_status: string;
  amount: number;
  currency: string;
  gateway_payment_id?: string;
  reference_number?: string;
  payment_date?: string;
  metadata?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  order?: any;
  customer?: any;
  saved_payment_method?: PaymentMethod;
  transactions?: Transaction[];
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  customer_id: string;
  payment_method: string;
  payment_gateway: string;
  is_default: boolean;
  card_last_four?: string;
  card_brand?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  bank_name?: string;
  account_name?: string;
  bsb?: string;
  account_number_last_four?: string;
  billing_name?: string;
  billing_email?: string;
  billing_address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  payment_id: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  currency: string;
  gateway_transaction_id?: string;
  authorization_code?: string;
  refund_reason?: string;
  error_code?: string;
  error_message?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  paymentGateway?: string;
  paymentMethodId?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
  notes?: string;
}

export interface RefundPaymentRequest {
  amount: number;
  reason?: string;
}

export interface SavePaymentMethodRequest {
  customerId: string;
  paymentMethod: string;
  paymentGateway: string;
  isDefault?: boolean;
  cardDetails?: {
    lastFour: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  bankDetails?: {
    bankName: string;
    accountName: string;
    bsb: string;
    accountNumberLastFour: string;
  };
  gatewayToken?: string;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: string;
}

export interface PaymentStatusResponse {
  status: string;
  transactionStatus: string;
  amount: number;
  capturedAmount?: number;
  refundedAmount?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// API SERVICE
// ============================================================================

class PaymentService {
  private baseUrl = '/payments';

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await apiService.post<Payment>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Create and process a payment immediately
   */
  async createAndProcessPayment(data: CreatePaymentRequest): Promise<any> {
    const response = await apiService.post<any>(`${this.baseUrl}/create-and-process`, data);
    return response.data;
  }

  /**
   * Process a pending payment
   */
  async processPayment(paymentId: string): Promise<any> {
    const response = await apiService.post<any>(`${this.baseUrl}/${paymentId}/process`);
    return response.data;
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, data: RefundPaymentRequest): Promise<any> {
    const response = await apiService.post<any>(`${this.baseUrl}/${paymentId}/refund`, data);
    return response.data;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const response = await apiService.get<Payment>(`${this.baseUrl}/${paymentId}`);
    return response.data;
  }

  /**
   * Get payments for an order
   */
  async getOrderPayments(orderId: string): Promise<Payment[]> {
    const response = await apiService.get<Payment[]>(`${this.baseUrl}/order/${orderId}`);
    return response.data;
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const response = await apiService.get<PaymentStatusResponse>(`${this.baseUrl}/${paymentId}/status`);
    return response.data;
  }

  /**
   * Save a customer payment method
   */
  async savePaymentMethod(data: SavePaymentMethodRequest): Promise<PaymentMethod> {
    const response = await apiService.post<PaymentMethod>(`${this.baseUrl}/methods`, data);
    return response.data;
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const response = await apiService.get<PaymentMethod[]>(`${this.baseUrl}/methods/customer/${customerId}`);
    return response.data;
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(`${this.baseUrl}/methods/${paymentMethodId}`);
    return response.data;
  }
}

export default new PaymentService();