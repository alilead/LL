# LeadLab Backend

Modern lead management system backend built with FastAPI and Python 3.13.

## Requirements

- **Python 3.13.4+** (latest stable version)
- PostgreSQL or MySQL database
- Redis (for caching)

## Installation

### 1. Python Environment Setup

Ensure you have Python 3.13.4 installed:

```bash
python3 --version  # Should show Python 3.13.4 or higher
```

### 2. Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

### 5. Database Setup

```bash
# Run database migrations
alembic upgrade head
```

### 6. Run the Application

```bash
# Development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production server
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Docker Support

### Build and Run with Docker

```bash
# Build image
docker build -t leadlab-backend .

# Run container
docker run -p 8000:8000 leadlab-backend
```

### Docker Compose

```bash
docker-compose up -d
```

## Development

### Code Quality Tools

```bash
# Install development dependencies
pip install -e ".[dev]"

# Format code
black .
isort .

# Lint code
flake8 .
mypy .

# Run tests
pytest
```

### Project Structure

```
backend/
├── app/                    # Main application package
│   ├── api/               # API routes
│   ├── core/              # Core configuration
│   ├── crud/              # Database operations
│   ├── db/                # Database setup
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── tests/                 # Test files
├── requirements.txt       # Production dependencies
├── pyproject.toml        # Project configuration
└── main.py               # Application entry point
```

## Features

- **FastAPI** framework with automatic API documentation
- **SQLAlchemy** ORM with async support
- **PostgreSQL/MySQL** database support
- **Redis** caching
- **JWT** authentication
- **Machine Learning** models for lead scoring
- **Monitoring** with Prometheus
- **Error tracking** with Sentry

## API Documentation

When running the application, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Python 3.13 Features Used

This project leverages the latest Python 3.13.4 features:

- **Improved error messages** for better debugging
- **Performance optimizations** 
- **Enhanced type system** support
- **Better asyncio** performance
- **Improved security** features

## Contributing

1. Ensure you're using Python 3.13.4+
2. Follow the code style guidelines (Black, isort)
3. Add type hints to all functions
4. Write tests for new features
5. Update documentation as needed

## License

MIT License
