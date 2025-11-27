import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const ATUALIZAR_LIMITE = gql`
  mutation AtualizarLimite($conta: Int!, $limite: Float!) {
    atualizarLimite(numeroConta: $conta, novoLimite: $limite) {
      limite
    }
  }
`;

@Component({
  selector: 'app-limit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Ajustar Limite Pix/Saque</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display: flex; flex-direction: column; min-width: 300px; padding-top: 10px;">
        <p>Limite Atual: <strong>{{ data.limiteAtual | currency:'BRL' }}</strong></p>
        <mat-form-field appearance="outline">
          <mat-label>Novo Limite</mat-label>
          <input matInput type="number" formControlName="limite">
          <span matTextPrefix>R$&nbsp;</span>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="salvar()" [disabled]="loading || form.invalid">Salvar</button>
    </mat-dialog-actions>
  `
})
export class LimitDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apollo: Apollo,
    private dialogRef: MatDialogRef<LimitDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { numeroConta: number, limiteAtual: number }
  ) {
    this.form = this.fb.group({
      limite: [data.limiteAtual, [Validators.required, Validators.min(0)]]
    });
  }

  salvar() {
    if (this.form.invalid) return;
    this.loading = true;
    this.apollo.mutate({
      mutation: ATUALIZAR_LIMITE,
      variables: { conta: this.data.numeroConta, limite: this.form.value.limite },
      refetchQueries: ['GetUsuarios']
    }).subscribe({
      next: () => {
        this.snackBar.open('Limite atualizado!', 'Ok', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: (err) => { this.loading = false; this.snackBar.open('Erro: ' + err.message, 'Fechar'); }
    });
  }
}