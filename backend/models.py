from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    cpf = Column(String, unique=True, index=True)
    data_nascimento = Column(String)
    endereco = Column(String)
    # --- NOVO CAMPO ---
    senha_hash = Column(String) 
    
    contas = relationship("Conta", back_populates="dono")

class Conta(Base):
    __tablename__ = "contas"
    id = Column(Integer, primary_key=True, index=True)
    agencia = Column(String, default="0001")
    numero = Column(Integer, unique=True)
    saldo = Column(Float, default=0.0)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    dono = relationship("Usuario", back_populates="contas")
    transacoes = relationship("Transacao", back_populates="conta")

class Transacao(Base):
    __tablename__ = "transacoes"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)
    valor = Column(Float)
    data = Column(DateTime, default=datetime.utcnow)
    conta_id = Column(Integer, ForeignKey("contas.id"))
    
    conta = relationship("Conta", back_populates="transacoes")