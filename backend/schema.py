import strawberry
from typing import List, Optional
from sqlalchemy import func
from datetime import datetime

from models import Usuario, Conta, Transacao
from database import SessionLocal, engine, Base
from auth import get_password_hash, verify_password, create_access_token # <--- Importamos a segurança

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
    # --- NOVO: Login ---
    @strawberry.mutation
    def login(self, cpf: str, senha: str) -> Token:
        db = get_session()
        user = db.query(Usuario).filter(Usuario.cpf == cpf).first()
        
        if not user or not verify_password(senha, user.senha_hash):
            raise Exception("CPF ou Senha incorretos")
        
        # Se passou, gera o token
        token = create_access_token({"sub": user.cpf})
        
        return Token(
            access_token=token, 
            token_type="bearer",
            usuario_nome=user.nome,
            usuario_id=user.id
        )

    # --- ATUALIZADO: Agora pede senha ---
    @strawberry.mutation
    def criar_usuario(self, nome: str, cpf: str, data_nascimento: str, endereco: str, senha: str) -> UsuarioType:
        db = get_session()
        if db.query(Usuario).filter(Usuario.cpf == cpf).first():
            raise Exception("CPF já cadastrado!")
        
        # Criptografa a senha antes de salvar
        senha_criptografada = get_password_hash(senha)
        
        novo_usuario = Usuario(
            nome=nome, 
            cpf=cpf, 
            data_nascimento=data_nascimento, 
            endereco=endereco,
            senha_hash=senha_criptografada # Salva o hash
        )
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        return novo_usuario

    @strawberry.mutation
    def criar_conta(self, cpf_usuario: str) -> Optional[ContaType]:
        db = get_session()
        usuario = db.query(Usuario).filter(Usuario.cpf == cpf_usuario).first()
        if not usuario:
            raise Exception("Utilizador não encontrado!")
        num_contas = db.query(Conta).count()
        nova_conta = Conta(numero=num_contas + 1, usuario_id=usuario.id)
        db.add(nova_conta)
        db.commit()
        db.refresh(nova_conta)
        return nova_conta

    @strawberry.mutation
    def realizar_operacao(self, numero_conta: int, tipo: str, valor: float) -> ContaType:
        db = get_session()
        conta = db.query(Conta).filter(Conta.numero == numero_conta).first()
        if not conta:
            raise Exception("Conta não encontrada")
        if valor <= 0:
            raise Exception("O valor deve ser positivo")

        if tipo == "sacar":
            if valor > 500:
                raise Exception("Limite por saque é de R$ 500,00")
            
            hoje_inicio = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            qtd_saques = db.query(Transacao).filter(
                Transacao.conta_id == conta.id,
                Transacao.tipo == "sacar",
                Transacao.data >= hoje_inicio
            ).count()
            
            if qtd_saques >= 3:
                raise Exception("Excedeu o limite de 3 saques diários")

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
        if valor <= 0:
            raise Exception("Valor inválido")

        origem = db.query(Conta).filter(Conta.numero == conta_origem).first()
        destino = db.query(Conta).filter(Conta.numero == conta_destino).first()

        if not origem or not destino:
            raise Exception("Conta não encontrada")
        if origem.id == destino.id:
            raise Exception("Não pode transferir para a mesma conta")
        if origem.saldo < valor:
            raise Exception("Saldo insuficiente")

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