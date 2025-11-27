import strawberry
from typing import List, Optional
from sqlalchemy import func
from datetime import datetime
import random # Para gerar dados aleatorios

from models import Usuario, Conta, Transacao
from database import SessionLocal, engine, Base
from auth import get_password_hash, verify_password, create_access_token

Base.metadata.create_all(bind=engine)

@strawberry.type
class Token:
    access_token: str
    token_type: str
    usuario_nome: str
    usuario_id: int

@strawberry.type
class TransacaoType:
    tipo: str
    valor: float
    data: str

@strawberry.type
class ContaType:
    id: int
    numero: int
    agencia: str
    saldo: float
    limite: float # <--- Expor o limite no GraphQL
    transacoes: List[TransacaoType]

@strawberry.type
class UsuarioType:
    id: int
    nome: str
    cpf: str
    contas: List[ContaType]

def get_session():
    return SessionLocal()

@strawberry.type
class Query:
    @strawberry.field
    def usuarios(self) -> List[UsuarioType]:
        db = get_session()
        return db.query(Usuario).all()

    @strawberry.field
    def conta_por_numero(self, numero: int) -> Optional[ContaType]:
        db = get_session()
        return db.query(Conta).filter(Conta.numero == numero).first()

@strawberry.type
class Mutation:
    @strawberry.mutation
    def login(self, cpf: str, senha: str) -> Token:
        db = get_session()
        user = db.query(Usuario).filter(Usuario.cpf == cpf).first()
        if not user or not verify_password(senha, user.senha_hash):
            raise Exception("CPF ou Senha incorretos")
        token = create_access_token({"sub": user.cpf})
        return Token(access_token=token, token_type="bearer", usuario_nome=user.nome, usuario_id=user.id)

    @strawberry.mutation
    def criar_usuario(self, nome: str, cpf: str, data_nascimento: str, endereco: str, senha: str) -> UsuarioType:
        db = get_session()
        if db.query(Usuario).filter(Usuario.cpf == cpf).first():
            raise Exception("CPF já cadastrado!")
        
        senha_criptografada = get_password_hash(senha)
        novo_usuario = Usuario(nome=nome, cpf=cpf, data_nascimento=data_nascimento, endereco=endereco, senha_hash=senha_criptografada)
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        return novo_usuario

    @strawberry.mutation
    def criar_conta(self, cpf_usuario: str) -> Optional[ContaType]:
        db = get_session()
        usuario = db.query(Usuario).filter(Usuario.cpf == cpf_usuario).first()
        if not usuario:
            raise Exception("Usuario nao encontrado!")
        num_contas = db.query(Conta).count()
        nova_conta = Conta(numero=num_contas + 1, usuario_id=usuario.id, limite=500.0)
        db.add(nova_conta)
        db.commit()
        db.refresh(nova_conta)
        return nova_conta

    # --- NOVO: ALTERAR LIMITE ---
    @strawberry.mutation
    def atualizar_limite(self, numero_conta: int, novo_limite: float) -> ContaType:
        db = get_session()
        conta = db.query(Conta).filter(Conta.numero == numero_conta).first()
        if not conta:
            raise Exception("Conta não encontrada")
        if novo_limite < 0:
            raise Exception("Limite não pode ser negativo")
        
        conta.limite = novo_limite
        db.commit()
        db.refresh(conta)
        return conta

    # --- NOVO: POPULAR BANCO (SEED) ---
    @strawberry.mutation
    def popular_banco(self) -> str:
        db = get_session()
        
        # Lista de bilionários para adicionar
        senha_padrao = get_password_hash("1234")
        users_data = [
            {"nome": "Elon Musk", "cpf": "11111111111", "saldo": 10000.0},
            {"nome": "Jeff Bezos", "cpf": "22222222222", "saldo": 5000.0},
            {"nome": "Bill Gates", "cpf": "33333333333", "saldo": 8000.0}
        ]

        count_adicionados = 0

        for u in users_data:
            # Verifica se ESTE CPF específico já existe
            if db.query(Usuario).filter(Usuario.cpf == u["cpf"]).first():
                continue # Pula para o próximo se já existir

            # Cria Usuário
            user = Usuario(
                nome=u["nome"], cpf=u["cpf"], data_nascimento="01/01/1980", 
                endereco="Silicon Valley", senha_hash=senha_padrao
            )
            db.add(user)
            db.commit() # Comita para gerar o ID
            
            # Cria Conta
            # Pega o último número de conta para não dar conflito
            ultimo_num = db.query(func.max(Conta.numero)).scalar() or 0
            
            conta = Conta(
                numero=ultimo_num + 1, 
                usuario_id=user.id, 
                saldo=u["saldo"], 
                limite=10000.0 # Limite alto para eles
            )
            db.add(conta)
            db.commit()

            # Cria Transação Inicial
            t1 = Transacao(tipo="depositar", valor=u["saldo"], conta_id=conta.id, data=datetime.now())
            db.add(t1)
            
            count_adicionados += 1
        
        db.commit()
        
        if count_adicionados == 0:
            return "Todos os usuários de teste já estão cadastrados."
            
        return f"{count_adicionados} usuários de teste adicionados com sucesso!"

    @strawberry.mutation
    def realizar_operacao(self, numero_conta: int, tipo: str, valor: float) -> ContaType:
        db = get_session()
        conta = db.query(Conta).filter(Conta.numero == numero_conta).first()
        if not conta:
            raise Exception("Conta não encontrada")
        if valor <= 0:
            raise Exception("O valor deve ser positivo")

        if tipo == "sacar":
            # USAR O LIMITE DO BANCO, NÃO MAIS 500 FIXO
            if valor > conta.limite:
                raise Exception(f"Operação falhou! Seu limite é de R$ {conta.limite}")
            
            if conta.saldo < valor:
                 raise Exception("Saldo insuficiente.")
            conta.saldo -= valor

        elif tipo == "depositar":
            conta.saldo += valor
        
        nova_transacao = Transacao(tipo=tipo, valor=valor, conta_id=conta.id)
        db.add(nova_transacao)
        db.commit()
        db.refresh(conta)
        return conta

    @strawberry.mutation
    def transferir(self, conta_origem: int, conta_destino: int, valor: float) -> str:
        db = get_session()
        origem = db.query(Conta).filter(Conta.numero == conta_origem).first()
        destino = db.query(Conta).filter(Conta.numero == conta_destino).first()

        if not origem or not destino:
            raise Exception("Conta não encontrada")
        if origem.saldo < valor:
            raise Exception("Saldo insuficiente")
        
        # Valida limite na transferência também
        if valor > origem.limite:
             raise Exception(f"Transferência acima do limite de R$ {origem.limite}")

        try:
            origem.saldo -= valor
            t1 = Transacao(tipo="transferencia_enviada", valor=valor, conta_id=origem.id)
            destino.saldo += valor
            t2 = Transacao(tipo="transferencia_recebida", valor=valor, conta_id=destino.id)
            db.add(t1)
            db.add(t2)
            db.commit()
            return "Transferência realizada!"
        except Exception as e:
            db.rollback()
            raise Exception(f"Erro: {str(e)}")

schema = strawberry.Schema(query=Query, mutation=Mutation)