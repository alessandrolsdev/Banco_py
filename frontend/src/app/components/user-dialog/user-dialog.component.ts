import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';

import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Mutation atualizada com SENHA
const CRIAR_USUARIO = gql`
  mutation CriarUsuario($nome: String!, $cpf: String!, $data: String!, $end: String!, $senha: String!) {
    criarUsuario(nome: $nome, cpf: $cpf, dataNascimento: $data, endereco: $end, senha: $senha) {
      id
      nome
    }
  }
`;

const CRIAR_CONTA = gql`
  mutation CriarConta($cpf: String!) {
    criarConta(cpfUsuario: $cpf) {
      numero
    }
  }
`;

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apollo: Apollo,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      dataNascimento: ['', Validators.required],
      endereco: ['', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(4)]] // Campo Novo
    });
  }

  salvar() {
    if (this.form.invalid) return;
    this.loading = true;
    const { nome, cpf, dataNascimento, endereco, senha } = this.form.value;

    this.apollo.mutate({
      mutation: CRIAR_USUARIO,
      variables: { nome, cpf, data: dataNascimento, end: endereco, senha }, // Envia senha
      refetchQueries: ['GetUsuarios'] 
    }).subscribe({
      next: () => {
        this.criarContaVinculada(cpf);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erro ao criar usuário: ' + err.message, 'Fechar');
      }
    });
  }

  criarContaVinculada(cpf: string) {
    this.apollo.mutate({
      mutation: CRIAR_CONTA,
      variables: { cpf },
      refetchQueries: ['GetUsuarios']
    }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Cliente e Conta criados! Faça Login.', 'Ok', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erro ao gerar conta.', 'Fechar');
      }
    });
  }
}