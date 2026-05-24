import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AuthService } from './auth.service';

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

    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
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
export interface PaymentStatus {
    paymentId: string;
    status: 'pending' | 'approved' | 'rejected' | 'in_process' | 'cancelled' | 'refunded';
    amount?: number;
    paymentMethod?: string;
    paidAt?: Date;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = 'http://localhost:5052/api/payment';

    private readonly REQUEST_TIMEOUT = 30000;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Ocorreu um erro ao processar o pagamento.';
        let errorCode = '';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Erro de conexão: ${error.error.message}`;
            errorCode = 'CLIENT_ERROR';
        } else {
            switch (error.status) {
                case 0:
                    errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:5052';
                    errorCode = 'CONNECTION_ERROR';
                    break;
                case 400:
                    errorMessage = error.error?.message || 'Dados de pagamento inválidos. Verifique as informações.';
                    errorCode = 'BAD_REQUEST';
                    break;
                case 401:
                    errorMessage = 'Sua sessão expirou. Faça login novamente para continuar.';
                    errorCode = 'UNAUTHORIZED';
                    break;
                case 402:
                    errorMessage = error.error?.message || 'Erro no processamento do pagamento. Verifique seus dados.';
                    errorCode = 'PAYMENT_ERROR';
                    break;
                case 404:
                    errorMessage = 'Endpoint de pagamento não encontrado. Verifique se a API está correta.';
                    errorCode = 'NOT_FOUND';
                    break;
                case 408:
                    errorMessage = 'Tempo limite excedido. Tente novamente.';
                    errorCode = 'TIMEOUT';
                    break;
                case 429:
                    errorMessage = 'Muitas tentativas. Aguarde alguns segundos e tente novamente.';
                    errorCode = 'TOO_MANY_REQUESTS';
                    break;
                case 500:
                    errorMessage = 'Erro interno no servidor de pagamento. Tente novamente mais tarde.';
                    errorCode = 'SERVER_ERROR';
                    break;
                default:
                    errorMessage = error.error?.message || `Erro ${error.status}: Não foi possível processar o pagamento.`;
                    errorCode = `ERROR_${error.status}`;
            }
        }

        console.error('Payment Service Error:', {
            status: error.status,
            message: errorMessage,
            code: errorCode,
            originalError: error
        });

        return throwError(() => ({
            message: errorMessage,
            status: error.status,
            code: errorCode,
            error: error.error
        }));
    }

    createPixPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
        console.log('Criando pagamento PIX:', { ...paymentData, cardNumber: undefined, cardCvv: undefined });

        return this.http.post<PaymentResponse>(`${this.apiUrl}/pix`, paymentData, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    createCreditCardPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
        if (!this.validateCardData(paymentData)) {
            return throwError(() => ({
                message: 'Dados do cartão de crédito inválidos',
                status: 400,
                code: 'INVALID_CARD_DATA'
            }));
        }

        console.log('Processando pagamento com cartão de crédito');

        return this.http.post<PaymentResponse>(`${this.apiUrl}/credit-card`, paymentData, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    createBoletoPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
        if (!paymentData.userCpf || !this.validateCPF(paymentData.userCpf)) {
            return throwError(() => ({
                message: 'CPF inválido para geração de boleto',
                status: 400,
                code: 'INVALID_CPF'
            }));
        }

        console.log('Gerando boleto bancário');

        return this.http.post<PaymentResponse>(`${this.apiUrl}/boleto`, paymentData, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
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
                return throwError(() => ({
                    message: 'Método de pagamento inválido',
                    status: 400,
                    code: 'INVALID_PAYMENT_METHOD'
                }));
        }
    }

    checkPaymentStatus(paymentId: string): Observable<PaymentStatus> {
        console.log(`Verificando status do pagamento: ${paymentId}`);

        return this.http.get<PaymentStatus>(`${this.apiUrl}/status/${paymentId}`, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    getPaymentDetails(paymentId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/details/${paymentId}`, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    getUserPayments(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }


    private validateCardData(paymentData: PaymentRequest): boolean {
        if (!paymentData.cardNumber || !paymentData.cardName ||
            !paymentData.cardExpiry || !paymentData.cardCvv) {
            return false;
        }

        if (!this.validateCardNumber(paymentData.cardNumber)) {
            return false;
        }

        if (!this.validateCardExpiry(paymentData.cardExpiry)) {
            return false;
        }

        if (!this.validateCardCVV(paymentData.cardCvv)) {
            return false;
        }

        return true;
    }

    private validateCardNumber(cardNumber: string): boolean {
        const cleaned = cardNumber.replace(/\D/g, '');

        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }

        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i), 10);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return (sum % 10) === 0;
    }

    private validateCardExpiry(expiry: string): boolean {
        const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!match) return false;

        const month = parseInt(match[1], 10);
        const year = 2000 + parseInt(match[2], 10);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    }

    private validateCardCVV(cvv: string): boolean {
        const cleaned = cvv.replace(/\D/g, '');
        return cleaned.length === 3 || cleaned.length === 4;
    }

    private validateCPF(cpf: string): boolean {
        const cleaned = cpf.replace(/\D/g, '');

        if (cleaned.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cleaned)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cleaned.charAt(9), 10)) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cleaned.charAt(10), 10)) return false;

        return true;
    }

    formatAmount(amount: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    }
}