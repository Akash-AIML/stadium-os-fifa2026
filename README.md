# FIFA 2026 Smart Guide

[![CI](https://github.com/yourusername/fifa-2026-smart-guide/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/fifa-2026-smart-guide/actions/workflows/ci.yml)

An AI-powered multilingual stadium assistant for FIFA 2026 World Cup, designed to help fans navigate stadiums, avoid crowds, and get real-time recommendations.

## 🎯 Challenge Vertical

**Primary Persona:** Football Fans  
**Vertical:** Multilingual Stadium Assistant + Navigation + Crowd Management

## ✨ Features

### For Fans
- **AI Chat Assistant**: Multilingual conversational interface powered by Google Gemini
- **Interactive Stadium Map**: Real-time crowd visualization with clickable zones
- **Smart Navigation**: Optimal route planning avoiding congested areas
- **Proactive Recommendations**: Food, restroom, exit, and safety suggestions
- **Live Dashboard**: Stadium-wide status overview

### Technical Highlights
- **Rule-Based Intent Detection**: Efficient classification without extra AI calls
- **Dijkstra's Algorithm**: Weighted pathfinding considering distance and crowd density
- **Deterministic Simulation**: Match-time based crowd generation for demos
- **Fallback System**: Graceful degradation when AI is unavailable
- **Developer Mode**: Real-time debugging and system transparency

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Map    │  │   Chat   │  │Dashboard │  │Recommend │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  /chat   │  │  /crowd  │  │ /navigate│  │/recommend│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │             │             │              │        │
│         ▼             ▼             ▼              ▼        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Services Layer                         │   │
│  │  Gemini │ Crowd Engine │ Navigation │ Recommendation│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  Google Gemini API
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## 📁 Project Structure

```
fifa-2026-smart-guide/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings
│   │   ├── models.py            # Pydantic schemas
│   │   ├── services/
│   │   │   ├── gemini.py        # AI client
│   │   │   ├── crowd.py         # Simulation engine
│   │   │   ├── navigation.py    # Dijkstra's algorithm
│   │   │   └── recommendation.py# Suggestions engine
│   │   ├── routes/
│   │   │   ├── chat.py          # Chat endpoint
│   │   │   ├── crowd.py         # Crowd data endpoints
│   │   │   └── navigate.py      # Route endpoint
│   │   └── utils/
│   │       ├── validators.py    # Input sanitization
│   │       ├── intent.py        # Rule-based intent detection
│   │       └── exceptions.py    # Custom errors
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   ├── navigation/
│   │   │   └── crowd/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── context/
│   │   │   └── types/
│   │   └── services/
│   └── package.json
├── .github/workflows/ci.yml
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/crowd/` | Get all crowd snapshots |
| `GET` | `/api/v1/crowd/alerts` | Get active alerts |
| `GET` | `/api/v1/crowd/recommendations` | Get proactive recommendations |
| `GET` | `/api/v1/navigate/` | Get optimal route |
| `POST` | `/api/v1/chat/` | Send chat message |
| `GET` | `/health` | Health check |

## 🎮 Demo Mode

Use the simulation controls in the header to demonstrate different match scenarios:

- **Pre-Match (15 min)**: Gates and entrances are busy
- **Halftime (50 min)**: Food courts and restrooms congested
- **Full-Time (95 min)**: Exits are crowded

## ♿ Accessibility

- ✅ WCAG AA compliant
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support with ARIA labels
- ✅ High contrast mode support
- ✅ Focus indicators on all interactive elements
- ✅ Reduced motion support via `prefers-reduced-motion`

## 🔒 Security Features

- Input validation with Pydantic
- Prompt injection protection
- Rate limiting (20 requests/minute)
- CORS configuration
- HTML/JSX sanitization
- Environment variable isolation

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

**Coverage**: 32 tests covering crowd simulation, navigation, recommendations, and validation.

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📊 Evaluation Criteria Mapping

| Criteria | Implementation |
|----------|----------------|
| **Code Quality** | Feature-based architecture, typed APIs, service layers, clean separation of concerns |
| **Security** | Input validation, prompt injection protection, rate limiting, CORS, env isolation |
| **Efficiency** | SVG map, memoization, single AI call, context compression, lazy loading |
| **Testing** | 32 backend tests, frontend tests, mocked AI integration, deterministic scenarios |
| **Accessibility** | WCAG AA, keyboard nav, screen readers, high contrast, reduced motion |

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript
- Tailwind CSS
- Vite

**Backend**
- FastAPI
- Pydantic
- Google Generative AI

**AI**
- Google Gemini 2.5 Flash

## 📝 Assumptions

1. Gemini API key is provided via environment variable
2. Stadium layout is fixed (17 zones)
3. No real-time data source (uses deterministic simulation)
4. Single-page application for demo purposes

## 🚀 Future Enhancements

- Real-time GPS integration
- Push notifications for alerts
- Multi-stadium support
- Machine learning for crowd prediction
- Volunteer/staff mobile app
- WebSocket for live updates

## 📄 License

MIT License - Built for FIFA 2026 Hackathon

## 👥 Team

Built with ❤️ for the Google GenAI Challenge