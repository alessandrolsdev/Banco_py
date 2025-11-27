import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apollo, gql } from 'apollo-angular';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { TransferDialogComponent } from '../transfer-dialog/transfer-dialog.component';
// Imports Chart.js
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { OperationDialogComponent } from '../operation-dialog/operation-dialog.component';
import { HistoryDialogComponent } from '../history-dialog/history-dialog.component';

const GET_DADOS_DASHBOARD = gql`
  query GetUsuarios {
    usuarios {
      id
      nome
      cpf
      contas {
        numero
        saldo
        # Precisamos das transações aqui para montar o gráfico
        transacoes {
          tipo
          valor
        }
      }
    }
  }
`;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatProgressBarModule, BaseChartDirective // <--- Importante para o HTML funcionar
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  usuarios: any[] = [];
  loading = true;
  error: any;
  displayedColumns: string[] = ['id', 'nome', 'cpf', 'conta', 'saldo', 'acoes'];

  // --- Configurações do Gráfico ---
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Movimentações Totais'],
    datasets: [
      { data: [0], label: 'Entradas (Depósitos)', backgroundColor: '#4caf50' },
      { data: [0], label: 'Saídas (Saques)', backgroundColor: '#f44336' }
    ]
  };
  // --------------------------------

  constructor(private apollo: Apollo, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados() {
    this.loading = true;
    this.apollo
      .watchQuery({
        query: GET_DADOS_DASHBOARD,
      })
      .valueChanges.subscribe((result: any) => {
        this.usuarios = result?.data?.usuarios;
        this.loading = result.loading;
        this.error = result.error;
        
        // Assim que os dados chegam, calculamos o gráfico
        this.atualizarGrafico();
      });
  }

  atualizarGrafico() {
    let totalEntradas = 0;
    let totalSaidas = 0;

    // Percorre todos os usuários e suas contas
    this.usuarios.forEach(user => {
      user.contas.forEach((conta: any) => {
        conta.transacoes.forEach((t: any) => {
          if (t.tipo === 'depositar') totalEntradas += t.valor;
          if (t.tipo === 'sacar') totalSaidas += t.valor;
        });
      });
    });

    // Atualiza o objeto do gráfico
    this.barChartData = {
      labels: ['Volume de Movimentações'],
      datasets: [
        { data: [totalEntradas], label: 'Entradas (R$)', backgroundColor: '#66bb6a', hoverBackgroundColor: '#43a047' },
        { data: [totalSaidas], label: 'Saídas (R$)', backgroundColor: '#ef5350', hoverBackgroundColor: '#e53935' }
      ]
    };
  }

  abrirNovoCliente() {
    this.dialog.open(UserDialogComponent, { width: '500px', disableClose: true });
  }

  abrirOperacao() {
    const contaAlvo = this.usuarios.find(u => u.contas.length > 0)?.contas[0]?.numero;
    if (!contaAlvo) {
      alert("Nenhuma conta encontrada! Crie um usuário com conta primeiro.");
      return;
    }
    this.dialog.open(OperationDialogComponent, { width: '400px', data: { numeroConta: contaAlvo } });
  }

  abrirExtrato(numeroConta: number) {
    if (!numeroConta) return;
    this.dialog.open(HistoryDialogComponent, { width: '600px', data: { numeroConta } });
  }
  abrirTransferencia(numeroConta: number) {
  if (!numeroConta) return;
  this.dialog.open(TransferDialogComponent, {
    width: '400px',
    data: { numeroContaOrigem: numeroConta }
  });
}
}