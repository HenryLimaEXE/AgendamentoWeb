import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Importe o AuthService
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cadastrar',
  templateUrl: './cadastrar.component.html',
  styleUrls: ['./cadastrar.component.css']
})
export class CadastrarComponent implements OnInit, AfterViewInit {

  registerForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService // ✅ Adicione o AuthService
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required], // ✅ MUDADO: name_user → name
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.cdr.detectChanges();
    setTimeout(() => {
    }, 0);
  }

  backLogin() {
    this.router.navigate(['/login']);
  }

  resetPassword() {
    this.snackBar.open('Um e-mail de recuperação foi enviado', 'Fechar', {
      duration: 3000
    });
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  Cadastrar() {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const userData = {
        name: this.registerForm.value.name, // ✅ MUDADO: name_user → name
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword
      };

      // ✅ CHAMADA PARA A API
      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          Swal.fire({
            title: 'Carregando...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          setTimeout(() => {
            Swal.close();
            Swal.fire({
              icon: 'success',
              title: 'Cadastro realizado!',
              text: 'Você será redirecionado para o login',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              this.router.navigate(['/login']);
            });
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          
          let errorMessage = 'Erro ao realizar cadastro';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 0) {
            errorMessage = 'Servidor indisponível. Verifique se o backend está rodando.';
          } else if (error.status === 400) {
            errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
          }

          Swal.fire({
            icon: 'error',
            title: 'Erro no cadastro',
            text: errorMessage,
            confirmButtonText: 'Entendi'
          });
        }
      });

    } else {
      Swal.fire({
        icon: 'error',
        title: 'Formulário inválido',
        text: 'Preencha todos os campos corretamente',
        confirmButtonText: 'OK'
      });
    }
  }
}