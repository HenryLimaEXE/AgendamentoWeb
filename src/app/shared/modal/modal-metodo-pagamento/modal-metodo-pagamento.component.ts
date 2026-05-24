import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { PaymentService, PaymentRequest } from './modal-metodo-pagamento.service';
import { SubscriptionPlan } from '../../modal/modal-assinatura/modal-assinatura.component';

@Component({
  selector: 'app-modal-metodo-pagamento',
  templateUrl: './modal-metodo-pagamento.component.html',
  styleUrls: ['./modal-metodo-pagamento.component.css']
})
export class ModalMetodoPagamentoComponent {
  paymentForm: FormGroup;
  selectedMethod: string = 'pix';
  isLoading = false;
  installments: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  constructor(
    private dialogRef: MatDialogRef<ModalMetodoPagamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { plan: SubscriptionPlan, user: any },
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['pix', Validators.required],
      cardNumber: ['', [Validators.pattern(/^\d{16}$/)]],
      cardName: ['', []],
      cardExpiry: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cardCvv: ['', [Validators.pattern(/^\d{3,4}$/)]],
      installments: [1],
      cpf: ['', [Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]]
    });

    this.onPaymentMethodChange();
  }

  onPaymentMethodChange() {
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.selectedMethod = method;

      if (method === 'credit_card') {
        this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
        this.paymentForm.get('cardName')?.setValidators([Validators.required]);
        this.paymentForm.get('cardExpiry')?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
        this.paymentForm.get('cardCvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
        this.paymentForm.get('cpf')?.setValidators([Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]);
      } else {
        this.paymentForm.get('cardNumber')?.clearValidators();
        this.paymentForm.get('cardName')?.clearValidators();
        this.paymentForm.get('cardExpiry')?.clearValidators();
        this.paymentForm.get('cardCvv')?.clearValidators();
        this.paymentForm.get('cpf')?.clearValidators();

        if (method === 'boleto') {
          this.paymentForm.get('cpf')?.setValidators([Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]);
        } else {
          this.paymentForm.get('cpf')?.clearValidators();
        }
      }

      this.paymentForm.get('cardNumber')?.updateValueAndValidity();
      this.paymentForm.get('cardName')?.updateValueAndValidity();
      this.paymentForm.get('cardExpiry')?.updateValueAndValidity();
      this.paymentForm.get('cardCvv')?.updateValueAndValidity();
      this.paymentForm.get('cpf')?.updateValueAndValidity();
    });
  }

  async processPayment() {
    if (this.selectedMethod === 'credit_card' && this.paymentForm.invalid) {
      Swal.fire('Erro', 'Preencha todos os dados do cartão corretamente', 'error');
      return;
    }

    if (this.selectedMethod === 'boleto' && !this.paymentForm.get('cpf')?.value) {
      Swal.fire('Erro', 'CPF é obrigatório para boleto', 'error');
      return;
    }

    this.isLoading = true;

    Swal.fire({
      title: 'Processando pagamento...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const paymentRequest: PaymentRequest = {
      userId: this.data.user.id,
      planId: this.data.plan.id,
      planName: this.data.plan.name,
      price: this.data.plan.price,
      paymentMethod: this.selectedMethod as any,
      userEmail: this.data.user.email,
      userName: this.data.user.name,
      userCpf: this.paymentForm.get('cpf')?.value,
      installments: this.paymentForm.get('installments')?.value
    };

    this.paymentService.createPayment(paymentRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.close();

        if (response.success) {
          this.handlePaymentSuccess(response);
        } else {
          Swal.fire('Erro', response.message || 'Erro ao processar pagamento', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        Swal.close();
        console.error('Erro no pagamento:', error);
        Swal.fire('Erro', 'Não foi possível processar o pagamento. Tente novamente.', 'error');
      }
    });
  }

  handlePaymentSuccess(response: any) {
    switch (this.selectedMethod) {
      case 'pix':
        this.showPixPayment(response);
        break;
      case 'credit_card':
        this.showCreditCardSuccess(response);
        break;
      case 'boleto':
        this.showBoletoPayment(response);
        break;
    }
  }

  showPixPayment(response: any) {
    Swal.fire({
      title: 'Pagamento via PIX',
      html: `
        <div style="text-align: center;">
          <p>Escaneie o QR Code abaixo ou copie o código PIX</p>
          ${response.qrCodeBase64 ? `<img src="${response.qrCodeBase64}" style="width: 200px; margin: 20px 0;">` : ''}
          <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <small>${response.copyPaste || response.qrCode}</small>
          </div>
          <button id="copyPixButton" class="swal2-confirm swal2-styled" style="margin: 10px;">
            📋 Copiar código PIX
          </button>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            O código expira em 30 minutos
          </p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Já paguei',
      showCancelButton: true,
      cancelButtonText: 'Fechar',
      didOpen: () => {
        const copyButton = document.getElementById('copyPixButton');
        copyButton?.addEventListener('click', () => {
          navigator.clipboard.writeText(response.copyPaste || response.qrCode);
          Swal.fire('Copiado!', 'Código PIX copiado com sucesso', 'success');
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.checkPaymentStatus(response.paymentId);
      }
    });
  }

  showBoletoPayment(response: any) {
    Swal.fire({
      title: 'Boleto Gerado',
      html: `
        <div style="text-align: center;">
          <p>Clique no botão abaixo para visualizar o boleto</p>
          <button id="viewBoletoButton" class="swal2-confirm swal2-styled" style="background: #3085d6;">
            📄 Visualizar Boleto
          </button>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            O boleto vence em 3 dias úteis
          </p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Já paguei',
      showCancelButton: true,
      cancelButtonText: 'Fechar',
      didOpen: () => {
        const viewButton = document.getElementById('viewBoletoButton');
        viewButton?.addEventListener('click', () => {
          window.open(response.paymentUrl, '_blank');
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.checkPaymentStatus(response.paymentId);
      }
    });
  }

  showCreditCardSuccess(response: any) {
    Swal.fire({
      title: 'Pagamento processado!',
      text: `Sua assinatura ${this.data.plan.name} foi ativada com sucesso!`,
      icon: 'success',
      confirmButtonText: 'Continuar'
    }).then(() => {
      localStorage.setItem('subscription_modal_shown', 'true');
      this.dialogRef.close({ success: true });
    });
  }

  checkPaymentStatus(paymentId: string) {
    let attempts = 0;
    const maxAttempts = 10;

    const checkInterval = setInterval(() => {
      attempts++;

      this.paymentService.checkPaymentStatus(paymentId).subscribe({
        next: (status) => {
          if (status === 'approved' || status === 'paid') {
            clearInterval(checkInterval);
            Swal.fire('Pagamento confirmado!', 'Sua assinatura está ativa', 'success');
            localStorage.setItem('subscription_modal_shown', 'true');
            this.dialogRef.close({ success: true });
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            Swal.fire('Aguardando pagamento', 'Assim que o pagamento for confirmado, sua assinatura será ativada', 'info');
          }
        }
      });
    }, 5000);
  }

  close() {
    this.dialogRef.close();
  }
}
