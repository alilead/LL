# Python 3.12.7 slim image kullan
FROM python:3.12.7-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıklarını kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY . .

# Port 8000'i aç
EXPOSE 8000

# Uygulama komutlarını tanımla
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 