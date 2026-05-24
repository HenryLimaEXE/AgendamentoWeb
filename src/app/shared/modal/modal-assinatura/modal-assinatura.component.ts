import { Component, EventEmitter, Output } from '@angular/core';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlight?: boolean;
  popular?: boolean;
}

@Component({
  selector: 'app-modal-assinatura',
  templateUrl: './modal-assinatura.component.html',
  styleUrls: ['./modal-assinatura.component.css']
})
export class ModalAssinaturaComponent {
  @Output() close = new EventEmitter<void>();
  @Output() selectPlan = new EventEmitter<SubscriptionPlan>();

  showModal: boolean = true;

  plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic+',
      price: 29.90,
      period: 'mês',
      features: [
        '2 agendamentos por semana',
        'Suporte básico 24h',
        'Lembretes por email',
        'Acesso a 3 profissionais',
        'Relatórios mensais'
      ]
    },
    {
      id: 'medium',
      name: 'Medium+',
      price: 59.90,
      period: 'mês',
      features: [
        '10 agendamentos por semana',
        'Suporte prioritário 24/7',
        'Lembretes por email e SMS',
        'Acesso a 10 profissionais',
        'Relatórios semanais',
        'Notificações push',
        'Cancelamento gratuito'
      ],
      highlight: true,
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium+',
      price: 99.90,
      period: 'mês',
      features: [
        'Agendamentos ilimitados',
        'Suporte VIP dedicado',
        'Lembretes multicanais',
        'Acesso a todos profissionais',
        'Relatórios em tempo real',
        'API de integração',
        'Prioridade no suporte',
        'Consultoria mensal',
        'Personalização completa'
      ]
    }
  ];

  onSelectPlan(plan: SubscriptionPlan) {
    this.selectPlan.emit(plan);
    this.closeModal();
  }

  closeModal() {
    this.showModal = false;
    this.close.emit();
  }
}