import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() { }

  async navigateToRegister(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    Swal.fire({
      title: 'Carregando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    Swal.close();
    this.router.navigate(['/cadastrar']);
  }

  VerificarLogin() {
    if (this.loginForm.invalid) {
      this.snackBar.open('Preencha todos os campos corretamente', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading = true;
    this.isLoading = true;

    const credentials = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.isLoading = false;

        this.snackBar.open('Login realizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        Swal.fire({
          title: 'Carregando...',
          text: 'Redirecionando para seus agendamentos',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        setTimeout(() => {
          Swal.close();
          this.router.navigate(['/lista-tarefas']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.isLoading = false;

        let errorMessage = 'Erro ao fazer login';

        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Servidor indisponível. Verifique se o backend está rodando.';
        } else if (error.status === 401) {
          errorMessage = 'Email ou senha inválidos';
        }

        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}