import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Mutation GraphQL
const REALIZAR_OPERACAO = gql`
  mutation Operacao($conta: Int!, $tipo: String!, $valor: Float!) {
    realizarOperacao(numeroConta: $conta, tipo: $tipo, valor: $valor) {
      saldo
    }
  }
`;

@Component({
  selector: 'app-operation-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatSnackBarModule
  ],
  templateUrl: './operation-dialog.component.html', // Garanta que o arquivo HTML tem esse nome
  styleUrl: './operation-dialog.component.scss'      // Garanta que o arquivo SCSS tem esse nome
})
export class OperationDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apollo: Apollo,
    private dialogRef: MatDialogRef<OperationDialogComponent>,
    private snackBar: MatSnackBar,
    // INJEÇÃO DOS DADOS (Recebe o número da conta)
    @Inject(MAT_DIALOG_DATA) public data: { numeroConta: number }
  ) {
    this.form = this.fb.group({
      tipo: ['depositar', Validators.required],
      valor: ['', [Validators.required, Validators.min(1)]]
    });
  }

  confirmar() {
    if (this.form.invalid) return;
    this.loading = true;

    this.apollo.mutate({
      mutation: REALIZAR_OPERACAO,
      variables: {
        conta: this.data.numeroConta,
        tipo: this.form.value.tipo,
        valor: parseFloat(this.form.value.valor)
      },
      refetchQueries: ['GetUsuarios'] // Atualiza a tabela do Dashboard
    }).subscribe({
      next: () => {
        this.snackBar.open('Operação realizada com sucesso!', 'Ok', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erro: ' + err.message, 'Fechar');
      }
    });
  }
}