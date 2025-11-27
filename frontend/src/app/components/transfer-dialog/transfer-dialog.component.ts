import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const TRANSFERIR = gql`
  mutation Transferir($origem: Int!, $destino: Int!, $valor: Float!) {
    transferir(contaOrigem: $origem, contaDestino: $destino, valor: $valor)
  }
`;

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  templateUrl: './transfer-dialog.component.html',
  styleUrl: './transfer-dialog.component.scss'
})
export class TransferDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apollo: Apollo,
    private dialogRef: MatDialogRef<TransferDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { numeroContaOrigem: number }
  ) {
    this.form = this.fb.group({
      destino: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(1)]]
    });
  }

  confirmar() {
    if (this.form.invalid) return;
    this.loading = true;

    this.apollo.mutate({
      mutation: TRANSFERIR,
      variables: {
        origem: this.data.numeroContaOrigem,
        destino: parseInt(this.form.value.destino),
        valor: parseFloat(this.form.value.valor)
      },
      refetchQueries: ['GetUsuarios']
    }).subscribe({
      next: () => {
        this.snackBar.open('Transferência realizada!', 'Ok', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erro: ' + err.message, 'Fechar');
      }
    });
  }
}