# LeadLab - Advanced Lead Management & Psychometric Analysis Platform

LeadLab is a comprehensive lead management system with advanced psychometric analysis capabilities, built with React (TypeScript) frontend and FastAPI (Python) backend.

## 🚀 Features

### Core Lead Management
- **Lead Database**: Complete lead information management with contact details, professional info, and custom fields
- **Advanced Search & Filtering**: Multi-criteria search with real-time filtering
- **Lead Stages**: Customizable pipeline stages with progress tracking
- **Bulk Operations**: Import/export leads, bulk status updates
- **LinkedIn Integration**: Direct LinkedIn profile access and connection management

### Psychometric Analysis Engine
- **DISC Profile Analysis**: Comprehensive personality profiling using DISC methodology
- **Big Five Personality Assessment**: Five-factor model analysis
- **Communication Style Analysis**: Tailored communication recommendations
- **Sales Strategy Intelligence**: Personalized sales approaches based on personality
- **Behavioral Predictions**: Work style, stress response, and team role analysis
- **Multi-layer Caching**: Database and in-memory caching for optimal performance

### AI-Powered Insights
- **Internal Psychometric Analyzer**: Custom AI system for personality analysis
- **LinkedIn Data Enhancement**: Advanced profile data extraction and analysis
- **Sales Intelligence**: Meeting recommendations, email guidelines, negotiation strategies
- **Confidence Scoring**: Analysis quality and reliability indicators

### Technical Features
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first, modern UI with dark/light themes
- **Performance Optimized**: Lazy loading, caching, and efficient data handling
- **Secure Authentication**: JWT-based authentication with role management
- **Database Integration**: MySQL with SQLAlchemy ORM
- **API Documentation**: Auto-generated API docs with FastAPI

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **FastAPI** with Python 3.8+
- **SQLAlchemy** ORM with MySQL
- **Pydantic** for data validation
- **JWT** authentication
- **Alembic** for database migrations
- **Uvicorn** ASGI server

### Database
- **MySQL** primary database
- **Redis** for caching (optional)
- **JSON fields** for flexible data storage

## 📋 Prerequisites

- **Node.js** 16+ and npm/yarn
- **Python** 3.8+
- **MySQL** 8.0+
- **Git**

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd leadlab
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API endpoint

# Start development server
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
leadlab/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── core/           # Core functionality
│   │   │   ├── models/         # Database models
│   │   │   ├── services/       # Business logic
│   │   │   └── main.py         # Application entry point
│   │   ├── alembic/            # Database migrations
│   │   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── main.tsx        # Application entry point
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
└── README.md
```

## 🔧 Key Components

### Psychometric Analysis System
The core psychometric analysis engine provides:

- **DISC Analysis**: Dominance, Influence, Steadiness, Conscientiousness profiling
- **Personality Type Detection**: Primary and secondary personality traits
- **Communication Preferences**: Tailored communication strategies
- **Sales Approach Recommendations**: Personalized sales methodologies
- **Behavioral Prediction Models**: Work style and team interaction patterns

### Database Schema
- **Leads**: Core lead information and metadata
- **AI Insights**: Psychometric analysis results and caching
- **Users**: Authentication and user management
- **Organizations**: Multi-tenant support
- **Lead Stages**: Pipeline management

### API Endpoints
- `/api/v1/leads/` - Lead management operations
- `/api/v1/ai-insights/` - Psychometric analysis endpoints
- `/api/v1/auth/` - Authentication and user management
- `/docs` - Interactive API documentation

## 🔒 Environment Variables

### Backend (.env)
```
DATABASE_URL=mysql://user:password@localhost/leadlab
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=LeadLab
```

## 📚 Usage Examples

### Psychometric Analysis
```typescript
// Trigger psychometric analysis
const analysis = await psychometricService.analyzeLead(leadId, {
  refresh: false,  // Use cached if available
  useCrystal: false  // Use internal analyzer
});

// Access DISC scores
const discScores = analysis.combined_insights.disc_scores;
const personalityType = analysis.combined_insights.personality_type;
```

### Lead Management
```typescript
// Search leads with filters
const leads = await leadService.searchLeads({
  query: "software engineer",
  company: "Microsoft",
  stage: "qualified"
});

// Update lead information
await leadService.updateLead(leadId, {
  job_title: "Senior Developer",
  stage_id: 3
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs`

## 🔄 Updates & Changelog

### Recent Updates
- ✅ Enhanced psychometric analysis with database persistence
- ✅ Multi-layer caching system (database + memory)
- ✅ Improved DISC profiling accuracy
- ✅ Manual analysis control with user-triggered analysis
- ✅ Real-time confidence scoring
- ✅ LinkedIn integration improvements

---

**LeadLab** - Advanced Lead Management & Psychometric Analysis Platform 