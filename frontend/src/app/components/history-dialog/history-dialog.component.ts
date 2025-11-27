import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apollo, gql } from 'apollo-angular';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Query GraphQL para buscar saldo e transações de uma conta específica
const GET_EXTRATO = gql`
  query GetExtrato($numero: Int!) {
    contaPorNumero(numero: $numero) {
      saldo
      transacoes {
        tipo
        valor
        data
      }
    }
  }
`;

@Component({
  selector: 'app-history-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './history-dialog.component.html',
  styleUrl: './history-dialog.component.scss'
})
export class HistoryDialogComponent implements OnInit {
  transacoes: any[] = [];
  saldoAtual: number = 0;
  loading = true;
  displayedColumns: string[] = ['data', 'tipo', 'valor'];

  constructor(
    private apollo: Apollo,
    public dialogRef: MatDialogRef<HistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { numeroConta: number }
  ) {}

  ngOnInit() {
    this.apollo.watchQuery({
      query: GET_EXTRATO,
      variables: { numero: this.data.numeroConta },
      fetchPolicy: 'network-only' // Garante que não pegue cache velho
    }).valueChanges.subscribe((result: any) => {
      const conta = result?.data?.contaPorNumero;
      if (conta) {
        // Inverte a lista para mostrar as mais recentes primeiro (opcional)
        this.transacoes = [...conta.transacoes].reverse(); 
        this.saldoAtual = conta.saldo;
      }
      this.loading = false;
    });
  }

  fechar() {
    this.dialogRef.close();
  }
}