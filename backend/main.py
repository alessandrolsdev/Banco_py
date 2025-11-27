from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from schema import schema

app = FastAPI()

# --- CONFIGURAÇÃO DO CORS (Liberando Geral) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <--- Aceita qualquer origem (resolve o erro 400/403)
    allow_credentials=True,
    allow_methods=["*"],  # Aceita GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Aceita qualquer cabeçalho
)

graphql_app = GraphQLRouter(schema)

app.include_router(graphql_app, prefix="/graphql")