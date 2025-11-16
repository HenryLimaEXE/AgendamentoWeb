import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

import { TarefaService } from '../../services/tarefa.service';
import { AuthService } from '../../services/auth.service';
import { Tarefa } from '../../shared/models/tarefa.interface';

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

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private tarefaService: TarefaService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loggedUser = this.authService.getCurrentUser(); // ✅ Agora funciona
    if (!this.loggedUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = this.loggedUser.name || 'Usuário Desconhecido';
    this.carregarTarefas();
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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}