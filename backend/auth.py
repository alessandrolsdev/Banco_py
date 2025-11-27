from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

# Configurações de Segurança
SECRET_KEY = "segredo-super-secreto-do-banco-new" # Num projeto real, isso vem de variáveis de ambiente
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Função para criar o Hash da senha (o que vai pro banco)
def get_password_hash(password):
    return pwd_context.hash(password)

# Função para conferir se a senha bate
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Função para gerar o Token JWT
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt