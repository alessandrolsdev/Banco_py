# Usa uma imagem leve do Python 3.12
FROM python:3.12-slim

# Evita que o Python gere arquivos .pyc e garante logs em tempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências primeiro (para aproveitar o cache do Docker)
COPY requirements.txt .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o resto do código para dentro do container
COPY . .

# Expõe a porta 8000
EXPOSE 8000

# Comando para rodar o servidor (host 0.0.0.0 é essencial no Docker)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]