import os
import sys

# Python interpreter path'ini ayarla
INTERP = "/home/httpdvic1/virtualenv/backend/3.9/bin/python"
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Backend dizinini sys.path'e ekle
cwd = os.path.dirname(os.path.abspath(__file__))
sys.path.append(cwd)

# Gerekli environment variable'ları ayarla
os.environ['PYTHONPATH'] = cwd
os.environ['ENV'] = 'production'

# Log dizinini oluştur
log_dir = os.path.join(cwd, 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
    for log_file in ['error.log', 'access.log', 'performance.log']:
        open(os.path.join(log_dir, log_file), 'a').close()

# FastAPI uygulamasını import et
from main import app

# WSGI uygulamasını oluştur
application = app
