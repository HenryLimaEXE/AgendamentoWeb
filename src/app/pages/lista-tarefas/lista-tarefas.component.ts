import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { TarefaService } from '../../services/tarefa.service';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService, CreateSubscriptionRequest } from '../../services/subscription.service';
import { Tarefa } from '../../shared/models/tarefa.interface';
import { ModalAssinaturaComponent, SubscriptionPlan } from '../../shared/modal/modal-assinatura/modal-assinatura.component';
import { ModalMetodoPagamentoComponent } from '../../shared/modal/modal-metodo-pagamento/modal-metodo-pagamento.component';

@Component({
  selector: 'app-lista-tarefas',
  templateUrl: './lista-tarefas.component.html',
  styleUrls: ['./lista-tarefas.component.css'],
  host: {
    class: 'src/app/app.component.css'
  }
})
export class ListaTarefasComponent implements OnInit {
  userName: string | null = null;
  loggedUser: any = null;
  tarefas: Tarefa[] = [];
  tarefasPendentes: Tarefa[] = [];
  tarefasConcluidas: Tarefa[] = [];
  tarefasAFazer: Tarefa[] = [];
  novaTarefa = '';
  novaDataLimite = '';
  novaDescricao = '';
  dataInvalida: any;
  isLoading = false;

  private modalShown = false;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private tarefaService: TarefaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private subscriptionService: SubscriptionService
  ) { }

  ngOnInit() {
    this.loggedUser = this.authService.getCurrentUser();
    if (!this.loggedUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = this.loggedUser.name || 'Usuário Desconhecido';
    this.carregarTarefas();

    this.mostrarModalAssinatura();
  }

  mostrarModalAssinatura() {
    const modalAlreadyShown = localStorage.getItem('subscription_modal_shown');

    if (modalAlreadyShown === 'true') {
      return;
    }

    setTimeout(() => {
      const dialogRef = this.dialog.open(ModalAssinaturaComponent, {
        width: '100%',
        maxWidth: '1300px',
        panelClass: 'custom-modal',
        disableClose: false,
        backdropClass: 'modal-backdrop',
        data: { userName: this.userName }
      });

      dialogRef.componentInstance.selectPlan.subscribe((plan: SubscriptionPlan) => {
        this.processarAssinatura(plan);
        dialogRef.close();
      });

      dialogRef.afterClosed().subscribe(() => {
        localStorage.setItem('subscription_modal_shown', 'true');
      });

    }, 1000);
  }

  processarAssinatura(plan: SubscriptionPlan) {
    this.salvarPlanoNoBackend(plan);
  }
  salvarPlanoNoBackend(plan: SubscriptionPlan) {
    console.log('Processando assinatura:', {
      userId: this.loggedUser.id,
      userEmail: this.loggedUser.email,
      userName: this.loggedUser.name,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      period: plan.period,
      selectedAt: new Date().toISOString()
    });

    this.dialog.closeAll();

    const paymentDialog = this.dialog.open(ModalMetodoPagamentoComponent, {
      width: '100%',
      maxWidth: '550px',
      panelClass: 'payment-modal',
      disableClose: true,
      data: {
        plan: plan,
        user: this.loggedUser
      }
    });

    paymentDialog.afterClosed().subscribe((result) => {
      if (result?.success) {
        localStorage.setItem('subscription_modal_shown', 'true');

        this.atualizarStatusAssinatura(plan);

        Swal.fire({
          title: 'Assinatura ativada!',
          text: `Sua assinatura ${plan.name} foi ativada com sucesso. Aproveite todos os benefícios!`,
          icon: 'success',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#667eea'
        });
      } else if (result?.cancelled) {
        Swal.fire({
          title: 'Pagamento cancelado',
          text: 'Você pode assinar a qualquer momento através da nossa página de planos.',
          icon: 'info',
          confirmButtonText: 'Ok',
          confirmButtonColor: '#667eea'
        });
      }
    });
  }

  atualizarStatusAssinatura(plan: SubscriptionPlan) {
    const subscriptionData: CreateSubscriptionRequest = {
      userId: this.loggedUser.id,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      paymentMethod: 'pending'
    };

    this.subscriptionService.createSubscription(subscriptionData).subscribe({
      next: (response) => {
        console.log('Assinatura registrada no backend:', response);
        localStorage.setItem('user_subscription', JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          status: 'active',
          startDate: new Date()
        }));
      },
      error: (error) => {
        console.error('Erro ao registrar assinatura:', error);
      }
    });
  }

  redirecionarParaPagamentoExterno(plan: SubscriptionPlan) {

    const paymentUrl = `https://pagamento.seusite.com/checkout?plan=${plan.id}&user=${this.loggedUser.id}`;

    Swal.fire({
      title: 'Redirecionando para pagamento',
      text: `Você será redirecionado para finalizar o pagamento do plano ${plan.name}`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(paymentUrl, '_blank');
      }
    });
  }

  criarAssinaturaDireta(plan: SubscriptionPlan) {
    Swal.fire({
      title: 'Processando...',
      text: 'Criando sua assinatura',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const subscriptionData: CreateSubscriptionRequest = {
      userId: this.loggedUser.id,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      paymentMethod: 'pix'
    };

    this.subscriptionService.createSubscription(subscriptionData).subscribe({
      next: (response) => {
        Swal.close();

        Swal.fire({
          title: 'Assinatura criada!',
          text: `Sua assinatura ${plan.name} foi criada com sucesso. Aguarde a confirmação do pagamento.`,
          icon: 'success',
          confirmButtonText: 'Ok'
        });

        localStorage.setItem('subscription_modal_shown', 'true');
      },
      error: (error) => {
        Swal.close();

        Swal.fire({
          title: 'Erro!',
          text: error.message || 'Não foi possível criar sua assinatura. Tente novamente.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  carregarTarefas() {
    this.isLoading = true;
    this.tarefaService.getTarefasByUser(this.loggedUser.id).subscribe({
      next: (tarefas) => {
        this.tarefas = tarefas;
        this.atualizarListas();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
        this.snackBar.open('Erro ao carregar tarefas', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  formatarData(event: any): void {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 8) {
      input = input.substring(0, 8);
    }

    if (input.length > 4) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4) + '/' + input.substring(4, 8);
    } else if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }

    this.novaDataLimite = input;
    this.validarData(input);
  }

  validarData(data: string): void {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(data)) {
      this.dataInvalida = true;
      return;
    }

    const [dia, mes, ano] = data.split('/').map(Number);

    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
      this.dataInvalida = true;
    } else {
      this.dataInvalida = false;
    }
  }

  limpar() {
    this.novaTarefa = '';
    this.novaDataLimite = '';
    this.novaDescricao = '';
  }

  adicionarTarefa() {
    if (!this.novaTarefa.trim() || !this.novaDataLimite || !this.novaDescricao.trim()) {
      this.snackBar.open('Preencha todos os campos!', 'Fechar', { duration: 3000 });
      return;
    }

    const novaTarefa = {
      titulo: this.novaTarefa,
      dataLimite: this.novaDataLimite,
      descricao: this.novaDescricao,
      userId: this.loggedUser.id
    };

    this.tarefaService.criarTarefa(novaTarefa).subscribe({
      next: (tarefa) => {
        this.tarefas.push(tarefa);
        this.atualizarListas();
        this.limpar();
        this.snackBar.open('Tarefa adicionada com sucesso!', 'Fechar', { duration: 3000 });
        window.location.reload();
      },
      error: (error) => {
        console.error('Erro ao adicionar tarefa:', error);
        this.snackBar.open('Erro ao adicionar tarefa', 'Fechar', { duration: 3000 });
      }
    });
  }

  async editarTarefa(index: number, lista: Tarefa[]) {
    const tarefa = lista[index];

    const { value: formValues } = await Swal.fire({
      title: 'Editar Tarefa',
      html:
        `<input id="titulo" class="swal2-input" placeholder="Tarefa" value="${tarefa.titulo}">
         <input id="dataLimite" class="swal2-input" placeholder="Data (DD/MM/AAAA)" value="${tarefa.dataLimite}">
         <textarea id="descricao" class="swal2-textarea" placeholder="Descrição">${tarefa.descricao}</textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          titulo: (document.getElementById('titulo') as HTMLInputElement).value,
          dataLimite: (document.getElementById('dataLimite') as HTMLInputElement).value,
          descricao: (document.getElementById('descricao') as HTMLTextAreaElement).value
        };
      }
    });

    if (formValues) {
      const tarefaAtualizada = {
        titulo: formValues.titulo,
        dataLimite: formValues.dataLimite,
        descricao: formValues.descricao,
        concluida: tarefa.concluida,
        status: tarefa.status
      };

      this.tarefaService.atualizarTarefa(tarefa.id, tarefaAtualizada).subscribe({
        next: (tarefaAtualizada) => {
          const index = this.tarefas.findIndex(t => t.id === tarefa.id);
          if (index !== -1) {
            this.tarefas[index] = { ...this.tarefas[index], ...tarefaAtualizada };
            this.atualizarListas();
          }
          this.snackBar.open('Tarefa atualizada com sucesso!', 'Fechar', { duration: 3000 });
          window.location.reload();
        },
        error: (error) => {
          console.error('Erro ao atualizar tarefa:', error);
          this.snackBar.open('Erro ao atualizar tarefa', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  excluirTarefa(index: number, lista: Tarefa[]) {
    const tarefa = lista[index];

    Swal.fire({
      title: 'Tem certeza?',
      text: "Você não poderá reverter isso!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tarefaService.excluirTarefa(tarefa.id).subscribe({
          next: () => {
            this.tarefas = this.tarefas.filter(t => t.id !== tarefa.id);
            this.atualizarListas();
            Swal.fire('Excluído!', 'Sua tarefa foi excluída.', 'success');
            window.location.reload();
          },
          error: (error) => {
            console.error('Erro ao excluir tarefa:', error);
            Swal.fire('Erro!', 'Não foi possível excluir a tarefa.', 'error');
          }
        });
      }
    });
  }

  atualizarListas() {
    this.tarefasPendentes = this.tarefas.filter(t => t.status === 'pendente');
    this.tarefasAFazer = this.tarefas.filter(t => t.status === 'fazendo');
    this.tarefasConcluidas = this.tarefas.filter(t => t.status === 'concluido');
  }

  alternarStatusTarefa(index: number, lista: Tarefa[]) {
    const tarefa = lista[index];

    this.tarefaService.alternarStatus(tarefa.id).subscribe({
      next: () => {
        tarefa.concluida = !tarefa.concluida;
        tarefa.status = tarefa.concluida ? 'concluido' : 'pendente';
        this.atualizarListas();
        window.location.reload();
      },
      error: (error) => {
        console.error('Erro ao alternar status:', error);
        this.snackBar.open('Erro ao alterar status da tarefa', 'Fechar', { duration: 3000 });
      }
    });
  }

  moverParaFazendo(index: number, listaOrigem: Tarefa[]) {
    const tarefa = listaOrigem[index];

    this.tarefaService.moverParaFazendo(tarefa.id).subscribe({
      next: () => {
        tarefa.status = 'fazendo';
        tarefa.concluida = false;
        this.atualizarListas();
        window.location.reload();
      },
      error: (error) => {
        console.error('Erro ao mover tarefa:', error);
        this.snackBar.open('Erro ao mover tarefa', 'Fechar', { duration: 3000 });
      }
    });
  }

  redirecionarParaRedefinirSenha() {
    if (!this.loggedUser) {
      Swal.fire('Você não está logado!', 'Faça login para redefinir sua senha.', 'error');
      return;
    }

    Swal.fire({
      title: 'Redefinir Senha',
      html: `
      <div class="swal-form">
        <input id="currentPassword" type="password" class="swal2-input" placeholder="Digite a senha original">
        <input id="newPassword" type="password" class="swal2-input" placeholder="Digite a nova senha">
        <input id="confirmNewPassword" type="password" class="swal2-input" placeholder="Confirme a nova senha">
      </div>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Alterar',
      allowOutsideClick: false,
      preConfirm: () => {
        const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
        const confirmNewPassword = (document.getElementById('confirmNewPassword') as HTMLInputElement).value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
          Swal.showValidationMessage('Todos os campos são obrigatórios');
          return false;
        }

        if (newPassword !== confirmNewPassword) {
          Swal.showValidationMessage('As novas senhas não coincidem');
          return false;
        }

        return {
          email: this.loggedUser.email,
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmNewPassword: confirmNewPassword
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.updatePassword(result.value).subscribe({
          next: () => {
            Swal.fire('Senha Atualizada!', 'Sua senha foi atualizada com sucesso.', 'success');
            window.location.reload();
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Erro ao atualizar senha';
            Swal.fire('Erro!', errorMessage, 'error');
          }
        });
      }
    });
  }

  logout() {
    localStorage.removeItem('subscription_modal_shown');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}