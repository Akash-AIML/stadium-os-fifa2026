# StadiumOS ⚽
A smart, configuration-driven, accessible stadium operating system and fan assistant for the FIFA World Cup 2026.

StadiumOS helps fans navigate venues, locate accessible pathways, monitor real-time crowd densities, and receive assistant support in their language — with every recommendation grounded in deterministic stadium geometry so the AI never invents routes or facilities.

Modelled venues: MetLife Stadium (FIFA name New Jersey Stadium), SoFi Stadium (Los Angeles), and Estadio Azteca (Mexico City). Languages: English, Spanish & French (the three host nation languages for the 2026 World Cup) — the entire client interface and response payloads support local translations.

🌐 Live demo (Frontend): ""  
🌐 Backend API (Hugging Face Spaces): ""  

---

## 🛠️ Technology Stack
### Frontend
- **Framework**: React 19 (Strict Mode) + TypeScript + Vite
- **Styling**: Vanilla HSL-variable Custom Theme (Premium Glassmorphic Design, Harmonious Dark Mode)
- **Animations**: Framer Motion (Fluid micro-animations, slide-overs, and route draw transitions)
- **Icons**: Lucide React (Scalable vector glyphs replacing plain labels/emojis)
- **Browser Web APIs**: 
  - **Web Speech API SpeechSynthesis**: Browser-native Text-to-Speech (TTS) reading assistant replies aloud.
  - **Web Speech API SpeechRecognition**: Native voice input to capture fan queries hands-free.
- **State Management**: React Context (`AppProvider` singleton with global WebSocket stream handlers)
- **Unit Testing**: Vitest + React Testing Library + JSDOM

### Backend
- **Framework**: FastAPI (Python 3.11+, fully async handlers, CORS setup)
- **Pathfinder**: Deterministic Custom Weighted Dijkstra Solver (Adjacency-list graphs with step-free nodes & lobbies)
- **GenAI Layer**: Google Generative AI (`google-generativeai` SDK leveraging Gemini 1.5 Flash)
- **Schemas & Validators**: Pydantic v2 schemas + regex input sanitization
- **Rate Limiting**: Custom token-bucket rate limiter middleware
- **Real-time Server**: Bidirectional WebSockets (`/ws/{stadium_id}` channel)
- **Packaging**: Docker (Multi-stage build)

---

## 🌟 Premium Features
1. **Dijkstra Pathfinder with Accessibility Constraints**:
   - standard pathfinding vs **Step-Free Accessibility Route** (wheelchair-accessible paths routing strictly through elevators, applying a `+1000.0` penalty to stairs). Routes render in vivid purple/violet vectors.
2. **Interactive SVG Landmark Map**:
   - Interactive maps with hover cards detailing named facilities, landmark identifiers, and status.
   - Amenities (restrooms, food concessions, exits, medical aid) rendered as clean Lucide Icons positioned at precise coordinate nodes.
3. **Real-time Bidirectional WebSockets**:
   - Replaced REST polling with a single WebSocket stream per stadium location, pushing crowd densities, active alerts, recommendations, and simulation ticks down to the client.
4. **Gemini Smart Guide AI Assistant**:
   - Explainable AI explaining routing, reasoning (congestion avoided), estimated time saved, confidence scores, and alternative paths.
   - Prompt-injection defenses wrapping user messages in strict delimiter schemas.
5. **Browser-Native Voice & TTS Assistant**:
   - **Voice Input**: Translate voice utterances to text queries natively.
   - **TTS Audio (Speak)**: Speak button 🔊 next to chatbot messages reads text in the user's active language voice natively.
6. **Local Translation & Multi-language Support**:
   - Client-side dictionary translating the UI without LLM queries to protect free-tier API limits.
   - Supported languages: **English, Spanish, French, German, Portuguese, Arabic, Japanese, Chinese, Hindi, and Tamil**.
7. **Simulation Sandbox**:
   - Live timeline slider with match stage scenarios (Kickoff, Halftime, Fulltime post-match) dynamically scaling zone congestion, gate surges, and concession wait times.

---

## 2. Approach & Logic — Rules Before LLM
The core design principle is **deterministic decisions first, language model last**:

```
UserContext ──▶ Rules & Path Engines (Dijkstra) ──▶ Resolved Facts ──▶ LLM Phrasing ──▶ Answer
                  • Resolve active stadium config       • Shortest path list
                  • Calculate Dijkstra route graph      • Crowd density level
                  • Apply accessibility penalties       • Step-free route list
                  • Locate nearest AED / safety zone    • Offline fallback state
```

1. The pathfinding and simulation layers resolve every fact — the shortest path, the simulated crowd level, the accessibility modes, and nearest facilities — using the structured metadata configurations. No LLM is involved in routing decisions.
2. The LLM only phrases and explains those already-resolved facts into natural language in the requested language. It is explicitly forbidden (via strict system prompt formatting instructions) from inventing facilities or following instructions embedded in user questions.
3. If the user asks a standard navigational query without custom text, the application short-circuits and produces the answer from offline EN/ES/FR template mappings, avoiding LLM calls entirely.

### Rules Implemented
| Rule | Behaviour |
| :--- | :--- |
| **Wheelchair / Step-Free** | Applies a `+1000.0` traversal penalty to non-accessible nodes (stairs/stairs). Pathfinding routes strictly through elevator lobbies. Routes render in violet/purple. |
| **Emergency Guidance** | Routes dynamically to the nearest safety assembly point and medical AED equipment in emergency modes. |
| **Crowd Surge Adjustments** | Timeline adjustments automatically scale crowd levels. Gates and concourses surge near kickoff, restrooms and concessions peak at halftime. |
| **Explainable AI** | Gemini acts as a translation layer, returning layout structured options: Recommendation, Reasoning, Time Saved, Confidence Score, and Alternative Options. |

---

## 3. How It Works — Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend Setup
```bash
cd backend
python -m venv .venv

# Activate virtualenv (Linux/macOS)
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open `http://localhost:8000/docs` to view the interactive FastAPI documentation.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to interact with the application.

---

## 🚀 Deployment

### Backend — Hugging Face Spaces (Docker Space)
1. Create a new Space on [Hugging Face](https://huggingface.co/new-space).
2. Choose **Docker** as the SDK template.
3. Set your environment variables in Space Settings:
   - `GEMINI_API_KEY` (Your Google Gemini key. If unset, it falls back to MockLLM offline mode).
4. Push the contents of the `backend/` directory to the Space repository. Hugging Face will build the container from the included Dockerfile and host the API.

### Frontend — Vercel
1. Import the `frontend/` directory to [Vercel](https://vercel.com).
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure the environment variables:
   - Set the API URL to point to your Hugging Face Space backend URL.
4. Deploy the project.

---

## 4. Assumptions
- Stadium layouts (MetLife, SoFi, Azteca), facilities coordinates, and adjacency lists are illustrative configurations, not official CAD data.
- Crowd densities are simulated dynamically from the simulation match timeline rather than live sensor feeds.
- The Google Gemini key is optional; when unset, the backend MockLLM provides offline functionality.

---

## 5. Quality Attributes

### 🔒 Security
- **No Secrets in Code**: Environment variables manage all configurations. Unknown API key leads to MockLLM offline fallback.
- **Input Validation**: Strictly enforced Pydantic v2 schemas reject malformed zone IDs or unauthorized request parameters.
- **Prompt-Injection Defense**: User text is wrapped in clear system prompt delimiters and treated as raw data only. Dijkstra path calculations happen before the LLM step, preventing injection attacks from altering routes.
- **Rate Limiting**: Protects backend endpoints against spamming using a token-bucket rate limiter.

### ⚡ Efficiency
- **JSON Configuration Cache**: Stadium metadata and graphs load once at startup.
- **Short-circuiting**: Basic navigation and crowd requests resolve instantly via templates without triggering LLM calls.
- **Async Endpoints**: FastAPI runs non-blocking handlers to handle concurrent requests efficiently.
- **Connection Singleton**: WebSocket uses a module-level global cache with debounced cleanup to avoid duplicate TCP sockets.

### ♿ Accessibility — WCAG 2.1 AA
- **Visual Paths**: Wheelchair-accessible routes are clearly rendered in high-contrast purple/violet vectors.
- **Semantic HTML**: Features logical heading structures, single `<h1>` headers, landmarks, and Tab-nav outlines.
- **A11y Theme**: A high-visibility mode provides high-contrast borders and large text layouts.

### 🧪 Testing
- **Backend Tests**: 39 test cases verifying Dijkstra calculations, accessibility constraints, rate-limiters, and timeline generators. Run using:
  ```bash
  cd backend && pytest tests/ -v
  ```
- **Frontend Tests**: 6 Vitest component testing for maps, dashboards, and chat assistants. Run using:
  ```bash
  cd frontend && npx vitest run
  ```

---

## 6. Architecture & File Tree

```
                       ┌─────────────────────────────┐
  Vercel Frontend ────▶│  FastAPI Backend (HF Space) │
  (React 19 + Vite)    │  • CORS + Security headers  │
                       │  • Rate Limiting Middleware │
                       └──────────────┬──────────────┘
                                      │ POST /api/v1/chat (Context)
                                      ▼
                       ┌─────────────────────────────┐
                       │  Services Engine            │
                       │  ├─ stadiums.py (Configs)    │
                       │  ├─ navigation.py (Dijkstra)│
                       │  └─ crowd.py (Simulation)    │
                       └──────────────┬──────────────┘
                                      │ Resolved Path & Facts
                                      ▼
                       ┌─────────────────────────────┐
                       │  LLM Phrasing Layer         │
                       │  ├─ MockLLM (Offline)       │
                       │  └─ Gemini API (Flash)      │
                       └─────────────────────────────┘
```

### Directory Structure
```
fifa-2026-smart-guide/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI startup
│   │   ├── config.py            # Environment configurations
│   │   ├── models.py            # Pydantic schemas
│   │   ├── services/
│   │   │   ├── gemini.py        # Gemini client
│   │   │   ├── crowd.py         # Crowd data calculator
│   │   │   ├── navigation.py    # Weighted Dijkstra pathfinder
│   │   │   ├── recommendation.py# Facilities recommendations
│   │   │   └── stadiums.py      # Venues setup dictionary
│   │   ├── routes/
│   │   │   ├── chat.py          # LLM assistant endpoint
│   │   │   ├── crowd.py         # Crowd snapshots
│   │   │   └── navigate.py      # Dijkstra path endpoint
│   │   └── utils/
│   │       ├── rate_limit.py    # Token-bucket limiter
│   │       └── validators.py    # Regex sanitization
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── chat/            # Chat window UI components
│   │   │   ├── navigation/      # Interactive SVG StadiumMap
│   │   │   └── crowd/           # Dashboard gauges & leaderboard
│   │   ├── shared/
│   │   │   ├── components/      # Navbars, Timeline, DevModePanel
│   │   │   ├── hooks/           # useAI, useSimulation, useTranslation hooks
│   │   │   ├── context/         # AppProvider central state & WebSocket
│   │   │   └── utils/           # Frontend stadiums configurations
│   │   └── services/
│   │       └── api.ts           # Axios/Fetch API client
│   ├── tests/
│   └── package.json
└── README.md
```

---

## 👥 License
MIT License - Built for the FIFA 2026 Stadium Challenge.