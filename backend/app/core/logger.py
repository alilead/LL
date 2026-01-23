import logging
import sys
from typing import Any, Dict
from pathlib import Path

# Log formatı
log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Log dosyası yolu
log_file = Path("logs/app.log")
log_file.parent.mkdir(exist_ok=True)

# Logger konfigürasyonu
logging.basicConfig(
    level=logging.INFO,
    format=log_format,
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

# Logger instance'ı
logger = logging.getLogger("leadlab")
