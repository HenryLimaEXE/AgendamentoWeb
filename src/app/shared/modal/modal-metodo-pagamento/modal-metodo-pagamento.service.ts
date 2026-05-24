
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { SubscriptionPlan } from '../../modal/modal-assinatura/modal-assinatura.component';

export interface PaymentRequest {
  userId: number;
  planId: string;
  planName: string;
  price: number;
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  userEmail: string;
  userName: string;
  userCpf?: string;
  installments?: number;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  copyPaste?: string;
  barcode?: string;
  status: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://api.mercadopago.com/v1';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const apiKey = this.getApiKey();

    if (apiKey) {
      headers = headers.set('Authorization', `Bearer ${apiKey}`);
    }

    return headers;
  }

  private getApiKey(): string {
    return 'SEU_ACCESS_TOKEN_AQUI';
  }

  createPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    switch (paymentData.paymentMethod) {
      case 'pix':
        return this.createPixPayment(paymentData);
      case 'credit_card':
        return this.createCreditCardPayment(paymentData);
      case 'boleto':
        return this.createBoletoPayment(paymentData);
      default:
        return this.createPixPayment(paymentData);
    }
  }

  createPixPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>('/api/payment/pix', paymentData, {
      headers: this.getHeaders()
    });

  }

  createCreditCardPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>('/api/payment/credit-card', paymentData, {
      headers: this.getHeaders()
    });
  }

  createBoletoPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>('/api/payment/boleto', paymentData, {
      headers: this.getHeaders()
    });
  }

  checkPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get(`/api/payment/status/${paymentId}`, {
      headers: this.getHeaders()
    });
  }
}