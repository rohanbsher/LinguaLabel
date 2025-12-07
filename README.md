# LinguaLabel

**The Multilingual AI Annotation Platform for Low-Resource Languages**

LinguaLabel is a cutting-edge annotation platform and marketplace connecting AI companies with native speakers of underserved languages. We serve the 3 billion people whose languages lack adequate NLP tools.

## The Problem

- Only ~20 of 7,000+ world languages have adequate NLP tools
- AI companies spend $1B+ annually on annotation but can't access rare language speakers
- Scale AI, Mercor, and Surge AI focus on English-first markets

## Our Solution

- **Purpose-built annotation tools** for multilingual NLP (RTL support, complex scripts, audio)
- **Native speaker marketplace** with diaspora and in-country recruitment
- **Quality-first approach** with multi-annotator consensus and expert review

## Target Languages (Phase 1)

| Region | Languages |
|--------|-----------|
| Indian | Hindi, Bengali |
| African | Swahili, Yoruba |
| Arabic | Egyptian Arabic, Gulf Arabic |

## Tech Stack

- **Frontend**: Next.js 15 (TypeScript, Tailwind CSS)
- **Backend**: Python 3.10+ (FastAPI, SQLAlchemy)
- **Database**: PostgreSQL
- **Annotation**: Label Studio SDK integration
- **Payments**: Stripe Connect for annotator payouts
- **Infrastructure**: Vercel (frontend) + Railway (backend)

## Project Structure

```
LinguaLabel/
├── frontend/          # Next.js web application
│   ├── src/app/       # App router pages
│   └── src/lib/       # API client and utilities
├── backend/           # FastAPI server
│   ├── app/
│   │   ├── core/      # Config, database, security
│   │   ├── models/    # SQLAlchemy models
│   │   ├── routers/   # API endpoints
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # External integrations
│   └── alembic/       # Database migrations
├── annotation/        # Label Studio customizations
├── docs/              # Documentation
└── scripts/           # Deployment and utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 15+
- Docker (optional, for Label Studio)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/rohanbsher/LinguaLabel.git
cd LinguaLabel

# Frontend setup
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000

# Backend setup (in another terminal)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --port 8000
# API docs at http://localhost:8000/docs

# Label Studio (optional, in another terminal)
docker run -d -p 8080:8080 -v labelstudio-data:/label-studio/data heartexlabs/label-studio:latest
# Runs on http://localhost:8080
```

### Environment Variables

**Backend (.env)**:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/lingualabel

# Security
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Label Studio (optional)
LABEL_STUDIO_URL=http://localhost:8080
LABEL_STUDIO_API_KEY=your-api-key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = Your Railway backend URL

```bash
# Or deploy via CLI
cd frontend
npx vercel --prod
```

### Backend (Railway)

1. Create a new Railway project
2. Add PostgreSQL from the Railway marketplace
3. Connect your GitHub repository
4. Set the root directory to `backend`
5. Add environment variables:
   - `DATABASE_URL` = (auto-filled from PostgreSQL addon)
   - `SECRET_KEY` = (generate a secure random string)
   - `CORS_ORIGINS` = `["https://your-app.vercel.app"]`
   - `LABEL_STUDIO_URL` = (optional)
   - `STRIPE_SECRET_KEY` = (optional)

The `railway.json` config will automatically run migrations on deploy.

### Label Studio (Optional)

For production Label Studio, you can:
- Deploy on Railway using Docker
- Use Label Studio Cloud (https://app.heartex.com/)
- Self-host on any Docker-capable platform

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/tasks` - Add tasks to project
- `POST /api/projects/{id}/sync` - Sync with Label Studio

### Payments (Annotators)
- `GET /api/payments/status` - Get Stripe Connect status
- `POST /api/payments/connect/onboard` - Start Connect onboarding
- `GET /api/payments/earnings` - Get earnings summary
- `POST /api/payments/withdraw` - Request withdrawal

### Languages
- `GET /api/languages` - List supported languages
- `GET /api/stats` - Platform statistics

## Development Progress

- [x] Phase 1-7: Core platform (auth, dashboard, projects)
- [x] Phase 8: Label Studio integration
- [x] Phase 9: Stripe Connect payments
- [x] Phase 10: Deployment configuration

## Business Model

- **Take rate**: 25-35% on annotator payments
- **Target customers**: AI labs, translation companies, research institutions
- **Year 1 goal**: $700K ARR, 800 annotators, 30 languages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Contact

Built with passion for multilingual AI.

Repository: https://github.com/rohanbsher/LinguaLabel

---

*Serving the 3 billion people whose languages are underserved by AI.*
