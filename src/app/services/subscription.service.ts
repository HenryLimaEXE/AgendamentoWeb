import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface CreateSubscriptionRequest {
    userId: number;
    planId: string;
    planName: string;
    price: number;
    paymentMethod: string;
}

export interface SubscriptionResponse {
    id: number;
    userId: number;
    planName: string;
    price: number;
    status: string;
    startDate: Date;
    endDate?: Date;
}

export interface SubscriptionDetail {
    id: number;
    userId: number;
    planId: string;
    planName: string;
    price: number;
    status: string;
    startDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt?: Date;
    paymentId: string;
    paymentMethod: string;
}

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private apiUrl = 'http://localhost:5052/api/subscription';
    private paymentApiUrl = 'http://localhost:5052/api/payment';

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
        let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Erro de conexão: ${error.error.message}`;
        } else {
            switch (error.status) {
                case 0:
                    errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:5052';
                    break;
                case 400:
                    errorMessage = error.error?.message || 'Dados inválidos. Verifique as informações.';
                    break;
                case 401:
                    errorMessage = 'Não autorizado. Faça login novamente.';
                    break;
                case 403:
                    errorMessage = 'Acesso negado. Você não tem permissão.';
                    break;
                case 404:
                    errorMessage = 'Assinatura não encontrada.';
                    break;
                case 409:
                    errorMessage = error.error?.message || 'Já existe uma assinatura ativa para este usuário.';
                    break;
                case 500:
                    errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
                    break;
                default:
                    errorMessage = error.error?.message || `Erro ${error.status}: Não foi possível processar sua solicitação.`;
            }
        }

        console.error('Subscription Service Error:', error);
        return throwError(() => ({ message: errorMessage, status: error.status, error: error.error }));
    }

    createSubscription(subscription: CreateSubscriptionRequest): Observable<SubscriptionResponse> {
        return this.http.post<SubscriptionResponse>(`${this.apiUrl}/create`, subscription, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    getUserSubscription(userId: number): Observable<SubscriptionResponse> {
        return this.http.get<SubscriptionResponse>(`${this.apiUrl}/user/${userId}`, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    cancelSubscription(subscriptionId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/cancel/${subscriptionId}`, {}, {
            headers: this.getHeaders()
        }).pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(this.handleError)
        );
    }

    hasActiveSubscription(userId: number): Observable<boolean> {
        return this.getUserSubscription(userId).pipe(
            map(subscription => subscription.status === 'active'),
            catchError(() => throwError(() => false))
        );
    }
}