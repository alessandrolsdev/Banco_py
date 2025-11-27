import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apollo, gql } from 'apollo-angular';

// Imports Visuais
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Imports do Gráfico
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Modais
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { OperationDialogComponent } from '../operation-dialog/operation-dialog.component';
import { HistoryDialogComponent } from '../history-dialog/history-dialog.component';
import { TransferDialogComponent } from '../transfer-dialog/transfer-dialog.component';
import { LimitDialogComponent } from '../limit-dialog/limit-dialog.component';

const GET_DADOS_DASHBOARD = gql`
  query GetUsuarios {
    usuarios {
      id, nome, cpf
      contas {
        numero, saldo, limite
        transacoes { tipo, valor }
      }
    }
  }
`;
const POPULAR_BANCO = gql` mutation Popular { popularBanco } `;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatSidenavModule, MatToolbarModule, MatMenuModule, MatBadgeModule, MatDividerModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatDialogModule, 
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  usuarios: any[] = [];
  loading = true;
  error: any;
  
  // Controle de visibilidade do saldo (O que estava faltando!)
  idsVisiveis = new Set<number>();

  // KPIs
  totalCustodia = 0;
  totalClientes = 0;
  totalTransacoes = 0;

  // Configuração do Gráfico
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: true, position: 'top' } }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Fluxo de Caixa'],
    datasets: [
      { data: [0], label: 'Entradas', backgroundColor: '#05CD99' },
      { data: [0], label: 'Saídas', backgroundColor: '#E53935' }
    ]
  };

  displayedColumns: string[] = ['cliente', 'status', 'conta', 'saldo', 'acoes'];

  constructor(private apollo: Apollo, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.carregarDados(); }

  carregarDados() {
    this.loading = true;
    this.apollo.watchQuery({ query: GET_DADOS_DASHBOARD }).valueChanges.subscribe((result: any) => {
      this.usuarios = result?.data?.usuarios;
      this.loading = result.loading;
      this.error = result.error;
      
      this.calcularKPIs();
      this.atualizarGrafico();
    });
  }

  // --- Lógica do Olhinho (Restaurada) ---
  toggleVisibilidade(id: number) {
    if (this.idsVisiveis.has(id)) {
      this.idsVisiveis.delete(id);
    } else {
      this.idsVisiveis.add(id);
    }
  }

  isVisivel(id: number): boolean {
    return this.idsVisiveis.has(id);
  }
  // -------------------------------------

  atualizarGrafico() {
    let totalEntradas = 0;
    let totalSaidas = 0;

    this.usuarios?.forEach(user => {
      user.contas.forEach((conta: any) => {
        conta.transacoes.forEach((t: any) => {
          if (t.tipo === 'depositar' || t.tipo === 'transferencia_recebida') {
            totalEntradas += t.valor;
          }
          if (t.tipo === 'sacar' || t.tipo === 'transferencia_enviada') {
            totalSaidas += t.valor;
          }
        });
      });
    });

    this.barChartData = {
      labels: ['Total Acumulado'],
      datasets: [
        { data: [totalEntradas], label: 'Entradas (R$)', backgroundColor: '#05CD99' },
        { data: [totalSaidas], label: 'Saídas (R$)', backgroundColor: '#E53935' }
      ]
    };
  }

  calcularKPIs() {
    this.totalClientes = this.usuarios?.length || 0;
    this.totalCustodia = 0;
    this.totalTransacoes = 0;

    this.usuarios?.forEach(u => {
      if(u.contas[0]) {
        this.totalCustodia += u.contas[0].saldo;
        this.totalTransacoes += u.contas[0].transacoes.length;
      }
    });
  }

  getAvatarUrl(nome: string): string {
    return `https://ui-avatars.com/api/?name=${nome}&background=4318FF&color=fff&size=128`;
  }

  popularBanco() {
    if(!confirm("Gerar dados de teste?")) return;
    this.apollo.mutate({ mutation: POPULAR_BANCO, refetchQueries: ['GetUsuarios'] }).subscribe({
      next: (res: any) => this.snackBar.open(res.data.popularBanco, 'Ok', { duration: 3000 }),
      error: (err) => alert(err.message)
    });
  }

  // Funções de Modal
  abrirNovoCliente() { this.dialog.open(UserDialogComponent, { width: '500px' }); }
  
  abrirOperacao() { 
     const conta = this.usuarios[0]?.contas[0]?.numero;
     if(conta) this.dialog.open(OperationDialogComponent, { width: '400px', data: { numeroConta: conta } });
  }
  
  abrirTransferencia(n: number) { if(n) this.dialog.open(TransferDialogComponent, { width: '400px', data: { numeroContaOrigem: n } }); }
  
  abrirExtrato(n: number) { if(n) this.dialog.open(HistoryDialogComponent, { width: '600px', data: { numeroConta: n } }); }
  
  abrirLimite(n: number, l: number) { this.dialog.open(LimitDialogComponent, { width: '300px', data: { numeroConta: n, limiteAtual: l } }); }
}