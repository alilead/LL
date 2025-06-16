#!/bin/bash

# Hata durumunda scripti durdur
set -e

echo "Deploying The LeadLab Platform..."

# Plesk dizin yapısı
BACKEND_PATH="/var/www/vhosts/the-leadlab.com/backend"
FRONTEND_PATH="/var/www/vhosts/the-leadlab.com/frontend"
STATIC_PATH="$BACKEND_PATH/static"
MEDIA_PATH="$BACKEND_PATH/media"
LOG_PATH="$BACKEND_PATH/logs"
FRONTEND_DIST="$FRONTEND_PATH/dist"
FRONTEND_LOGS="$FRONTEND_PATH/logs"

# Python 3.9 veya üzeri kurulu olduğundan emin ol
if ! command -v python3.9 &> /dev/null; then
    echo "Python 3.9 veya üzeri gerekli. Lütfen önce Python'u güncelleyin."
    exit 1
fi

echo "Creating directory structure..."
# Gerekli dizinleri oluştur
sudo mkdir -p $BACKEND_PATH $STATIC_PATH $MEDIA_PATH $LOG_PATH
sudo mkdir -p $FRONTEND_PATH $FRONTEND_DIST $FRONTEND_LOGS

# İzinleri ayarla
echo "Setting permissions..."
sudo chown -R the-leadlab-firat:psacln $BACKEND_PATH $FRONTEND_PATH
sudo chmod -R 755 $BACKEND_PATH $FRONTEND_PATH

# Backend deployment
echo "Deploying backend..."
# Kodları kopyala
rsync -av --exclude 'venv' --exclude '__pycache__' --exclude '.git' --exclude 'nginx.conf' . $BACKEND_PATH/

# Virtual environment oluştur
cd $BACKEND_PATH
python3.9 -m venv venv
source venv/bin/activate

# Bağımlılıkları yükle
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Log dosyaları için izinler
touch $LOG_PATH/app.log $LOG_PATH/nginx-access.log $LOG_PATH/nginx-error.log
sudo chown the-leadlab-firat:psacln $LOG_PATH/*.log
sudo chmod 664 $LOG_PATH/*.log

# Frontend log dosyaları
touch $FRONTEND_LOGS/nginx-access.log $FRONTEND_LOGS/nginx-error.log
sudo chown the-leadlab-firat:psacln $FRONTEND_LOGS/*.log
sudo chmod 664 $FRONTEND_LOGS/*.log

# Nginx konfigürasyonlarını kopyala
echo "Configuring Nginx..."
sudo mkdir -p /etc/nginx/conf.d
sudo cp nginx/api.the-leadlab.com.conf /etc/nginx/conf.d/
sudo cp nginx/the-leadlab.com.conf /etc/nginx/conf.d/

# Nginx konfigürasyonunu test et
echo "Testing Nginx configuration..."
sudo nginx -t

# Backend service dosyasını kopyala ve başlat
echo "Configuring backend service..."
sudo cp leadlab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable leadlab
sudo systemctl restart leadlab

# Nginx'i yeniden başlat
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Sağlık kontrolü
echo "Performing health checks..."
sleep 5  # Servislerin başlaması için bekle

# Backend sağlık kontrolü
if curl -s -f -o /dev/null http://127.0.0.1:8000/health; then
    echo "Backend health check: OK"
else
    echo "Backend health check: FAILED"
    echo "Check logs at $LOG_PATH/app.log"
fi

# Frontend erişim kontrolü
if curl -s -f -o /dev/null https://the-leadlab.com; then
    echo "Frontend access check: OK"
else
    echo "Frontend access check: FAILED"
    echo "Check logs at $FRONTEND_LOGS/nginx-error.log"
fi

echo "Deployment completed!"
echo "
Next steps:
1. Frontend URL: https://the-leadlab.com
2. Backend API: https://api.the-leadlab.com
3. Backend logs: $LOG_PATH/app.log
4. Nginx logs: $LOG_PATH/nginx-*.log
"
