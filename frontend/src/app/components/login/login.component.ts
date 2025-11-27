import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importa o modal de cadastro para podermos criar conta na tela de login
import { UserDialogComponent } from '../user-dialog/user-dialog.component';

const LOGIN_MUTATION = gql`
  mutation Login($cpf: String!, $senha: String!) {
    login(cpf: $cpf, senha: $senha) {
      accessToken
      usuarioNome
    }
  }
`;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, 
    MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apollo: Apollo,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog // Injetamos o Dialog para abrir o cadastro
  ) {
    this.form = this.fb.group({
      cpf: ['', [Validators.required]],
      senha: ['', [Validators.required]]
    });
  }

  entrar() {
    if (this.form.invalid) return;
    this.loading = true;

    this.apollo.mutate({
      mutation: LOGIN_MUTATION,
      variables: this.form.value
    }).subscribe({
      next: (result: any) => {
        const dados = result.data.login;
        // Salva token e redireciona
        localStorage.setItem('token', dados.accessToken);
        localStorage.setItem('usuario', dados.usuarioNome);
        
        this.snackBar.open(`Bem-vindo, ${dados.usuarioNome}!`, 'Ok', { duration: 2000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('CPF ou Senha incorretos.', 'Fechar');
      }
    });
  }

  // Função para abrir o cadastro sem estar logado
  abrirCadastro() {
    this.dialog.open(UserDialogComponent, {
      width: '500px'
    });
  }
}