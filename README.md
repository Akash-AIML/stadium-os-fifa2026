# StadiumOS ⚽
A smart, configuration-driven, accessible stadium operating system and fan assistant for the FIFA World Cup 2026.

StadiumOS helps fans navigate venues, locate accessible pathways, monitor real-time crowd densities, and receive assistant support in their language — with every recommendation grounded in deterministic stadium geometry so the AI never invents routes or facilities.

Modelled venues: MetLife Stadium (New Jersey), SoFi Stadium (Los Angeles), and Estadio Azteca (Mexico City). Languages supported: **English, Spanish, French, German, Portuguese, Arabic, Japanese, Chinese, Hindi, and Tamil**.

🌐 Live demo (Frontend): ""  
🌐 Backend API (Hugging Face Spaces): ""  
🐙 GitHub Repository: https://github.com/Akash-AIML/stadium-os-fifa2026

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| React 19 + TypeScript + Vite | Core framework with strict type safety and fast HMR |
| Vanilla CSS (HSL variables) | Custom glassmorphic dark theme; zero external CSS frameworks |
| Framer Motion | Micro-animations, route draw transitions, sidebar slide-overs |
| Lucide React | Scalable vector icon set for all amenity markers and UI icons |
| Web Speech API — SpeechSynthesis | Browser-native text-to-speech, reads AI replies in user's language |
| Web Speech API — SpeechRecognition | Browser-native voice-to-text, hands-free query input |
| React Context + useReducer | Singleton global state store, driving all WebSocket stream updates |
| Vitest + React Testing Library + JSDOM | Frontend component unit test suite |

### Backend
| Technology | Purpose |
|:---|:---|
| FastAPI (Python 3.11+) | Fully async REST + WebSocket API server |
| Custom Dijkstra Solver | Deterministic weighted graph pathfinding with accessibility penalties |
| Pydantic v2 | Schema validation and input sanitization |
| Google Generative AI SDK | Gemini 1.5 Flash for explainability and multilingual responses |
| Token-Bucket Rate Limiter | Custom middleware to protect endpoints from spamming |
| python-dotenv | Environment management; key-free mode falls back to MockLLM |
| Docker (Multi-stage) | Production container for Hugging Face Spaces deployment |
| pytest + pytest-asyncio | 39 backend test cases |

---

## 🌟 Feature Overview

| # | Feature | Stack Layer |
|:--|:---|:---|
| 1 | Dijkstra Pathfinder with Accessibility Constraints | Backend → `navigation.py` |
| 2 | Multi-Stadium Configuration Engine | Backend → `stadiums.py` + Frontend → `stadiums.ts` |
| 3 | Interactive SVG Landmark Map | Frontend → `StadiumMap.tsx` |
| 4 | Real-Time Crowd Intelligence (WebSockets) | Backend → `crowd.py` + Frontend → `AppContext.tsx` |
| 5 | GenAI Smart Guide (Gemini) | Backend → `gemini.py` + `chat.py` |
| 6 | AI → Map Synchronization | Frontend → `App.tsx` |
| 7 | Browser Text-to-Speech (TTS) | Frontend → `useTextToSpeech.ts` |
| 8 | Browser Voice Input | Frontend → `ChatWindow.tsx` |
| 9 | Local Multi-language Translation | Frontend → `useTranslation.ts` |
| 10 | Match Simulation Timeline | Backend → `crowd.py` + Frontend → `TimelineSlider.tsx` |
| 11 | Rate Limiting | Backend → `rate_limit.py` |
| 12 | Dev Monitor Panel | Frontend → `DevModePanel.tsx` |

---

## 🔬 How Each Feature Was Developed

### 1. Dijkstra Pathfinder with Accessibility Constraints
**Files**: `backend/app/services/navigation.py`, `backend/app/routes/navigate.py`

The pathfinder is a fully custom Dijkstra implementation built on top of each stadium's adjacency-list graph. Every zone (gates, concourses, sections, concessions, restrooms, medical stations) is a node, and every corridor or passage is a weighted directed edge.

**Standard routing**: Finds the minimum-cost path between any two zones by traversing the graph with a priority queue (`heapq`), respecting edge weights (distance + congestion factor).

**Accessibility routing**: When `accessible=true` is passed, the algorithm applies a `+1000.0` cost penalty to any edge that involves stairs or non-accessible nodes. This forces the solver to route exclusively through elevator lobbies and step-free corridors. The penalty is large enough to never choose stairs unless no alternative exists at all.

**Emergency routing**: A separate branch resolves the nearest medical AED device or safety assembly zone from the current position by running Dijkstra from the fan's current node to every safety-flagged node and returning the minimum.

The endpoint `POST /api/v1/navigate` receives `{from_zone, to_zone, accessible, stadium_id}` and returns the ordered zone list, total estimated minutes, and accessibility flag.

---

### 2. Multi-Stadium Configuration Engine
**Files**: `backend/app/services/stadiums.py`, `frontend/src/shared/utils/stadiums.ts`

Each of the three FIFA 2026 venues — MetLife Stadium, SoFi Stadium, Estadio Azteca — is modelled as a self-contained configuration dictionary in `stadiums.py`. The dictionary for each venue contains:
- Zone registry (IDs, labels, coordinates, types, accessibility flags)
- Adjacency list (edges with weights)
- Elevator lobby node IDs
- Medical AED and safety assembly point IDs
- Crowd capacity numbers per zone

On every API request, `stadiums.py` resolves the active stadium config by `stadium_id`, making all services (pathfinder, crowd simulator, recommendation engine) fully stadium-aware without sharing any state between venues.

The frontend mirrors this config in `stadiums.ts` (a TypeScript dictionary), giving `StadiumMap.tsx` the zone coordinates and labels to render the SVG without additional API calls.

A **Stadium Selector dropdown** was added to `TopNavbar.tsx`, dispatching a `SET_STADIUM` action to the global `AppContext`, which triggers a new WebSocket connection and re-fetches crowd data for the selected venue.

---

### 3. Interactive SVG Landmark Map
**Files**: `frontend/src/features/navigation/StadiumMap.tsx`

The map is a hand-authored SVG rendered inside a React component. Each stadium has its own blueprint geometry:
- **MetLife Stadium**: Concentric ring layers representing the stadium bowl tiers, drawn as SVG `ellipse` and `path` elements.
- **SoFi Stadium**: Asymmetric roofline contours reflecting the modern canopy design.
- **Estadio Azteca**: Circular ring structure with corner spiral access ramp paths.

**Zone nodes** are rendered as SVG `circle` elements, each positioned by the `(x, y)` coordinates from the `stadiums.ts` config. **Amenity markers** (restrooms, food, exits, medical, parking) use `<foreignObject>` to embed Lucide React icons directly into the SVG canvas at each facility's exact coordinate position — replacing the previous text or emoji labels.

**Hover cards** appear on `mouseenter` showing the zone name, type, capacity %, and a "Navigate Here" button. Clicking any zone sets it as the destination in the chat context.

**Route overlays**: When a navigation path is resolved, the component draws an animated SVG `polyline` connecting the ordered zone coordinates, colored green for standard routes and violet/purple for accessible ones. Framer Motion drives the `pathLength` animation from 0 → 1 for a smooth route draw-in effect.

---

### 4. Real-Time Crowd Intelligence via WebSockets
**Files**: `backend/app/routes/crowd.py`, `frontend/src/shared/context/AppContext.tsx`, `frontend/src/shared/hooks/useCrowdData.ts`

The backend exposes a **bidirectional WebSocket** at `ws://.../api/v1/crowd/ws/{stadium_id}`. On connection, the server begins streaming a JSON payload every 3 seconds containing:
- `crowd`: per-zone density percentages, wait times, congestion labels
- `alerts`: active crowd surge warnings
- `recommendations`: AI-generated action cards (e.g. "Use Gate C — 40% less crowded")
- `match_time`: current simulation minute

On the frontend, **a single WebSocket connection** is maintained at the root `AppProvider` level in `AppContext.tsx` using a module-level singleton cache (`globalSocket`). This prevents React 18 Strict Mode double-renders from creating duplicate TCP connections and producing "WebSocket closed before connection established" console warnings. The connection is reused for re-renders and only replaced when the stadium changes.

`useCrowdData.ts` was decoupled from directly managing a WebSocket and now purely reads state from `AppContext`, ensuring a single source of truth.

---

### 5. GenAI Smart Guide — Gemini Assistant
**Files**: `backend/app/services/gemini.py`, `backend/app/routes/chat.py`

The assistant follows a strict **Rules Before LLM** principle:

1. `chat.py` receives the fan's message alongside a full context object: active stadium, current zone, destination zone, crowd snapshot, accessibility mode, simulation minute, and language preference.
2. `navigation.py` resolves the Dijkstra path and nearest facilities deterministically — before any LLM call is made.
3. These resolved facts are injected into a structured system prompt in `gemini.py` using delimiter blocks, so Gemini only phrases and explains already-known facts rather than inventing routes.
4. The system prompt explicitly forbids Gemini from: (a) generating zone names not in the provided config, (b) following user-injected instructions inside the message body (prompt injection defense), and (c) responding in any language other than the one specified.
5. Gemini returns a structured JSON with: `recommendation`, `reasoning`, `time_saved`, `confidence_score`, `alternative_option`.
6. If no API key is set, a `MockLLM` class returns template-based responses in the correct language, enabling full offline functionality.

Language grounding maps 2-letter codes to full names for the prompt (e.g. `ta` → `Tamil`, `ar` → `Arabic (العربية)`), guaranteeing Gemini replies in the correct natural language.

---

### 6. AI → Map Synchronization
**Files**: `frontend/src/App.tsx`

A `useEffect` in `App.tsx` monitors the global chat history array. When a new assistant message arrives, it runs a lightweight intent parser on the response text:
- If a **zone name** from the active stadium config is detected, it dispatches `SET_HIGHLIGHT_ZONE` to pulse and center that zone on the SVG map.
- If a **path description** is detected (e.g. "take elevator to section 112"), it fires `POST /api/v1/navigate` and draws the resolved route overlay automatically.
- If a **Smart Recommendation card** is clicked, it pre-fills the destination, calls the navigate endpoint, and draws the path — all without the fan needing to type.

---

### 7. Browser Text-to-Speech (TTS)
**Files**: `frontend/src/shared/hooks/useTextToSpeech.ts`, `frontend/src/features/chat/ChatWindow.tsx`

`useTextToSpeech.ts` wraps the browser's `window.speechSynthesis` Web API. It exposes a `speak(text, lang)` function that:
1. Cancels any ongoing utterance.
2. Creates a `SpeechSynthesisUtterance` with the message text.
3. Maps the app's active language code (e.g. `es`, `fr`, `ta`) to the corresponding BCP-47 locale tag (e.g. `es-ES`, `fr-FR`, `ta-IN`) for voice selection.
4. Selects the best matching voice from `speechSynthesis.getVoices()`.
5. Speaks the reply.

A 🔊 **Speak** button was added next to every AI reply bubble in `ChatWindow.tsx`. No external audio libraries or cloud TTS APIs are used — this runs entirely in the browser, making it free and offline-capable.

---

### 8. Browser Voice Input
**Files**: `frontend/src/features/chat/ChatWindow.tsx`

A microphone button in the chat input bar activates the browser's `webkitSpeechRecognition` / `SpeechRecognition` API. It listens continuously until the user stops speaking, then transcribes the speech and inserts the text into the chat input field for the user to review and send. The recognition language is set to the app's active language code so multilingual voice queries work correctly.

---

### 9. Local Multi-language Translation (Zero LLM Cost)
**Files**: `frontend/src/shared/hooks/useTranslation.ts`

To avoid spending Gemini free-tier API quota on UI string translation, all interface labels are resolved by a **client-side dictionary** in `useTranslation.ts`. The dictionary covers 10 languages with 40+ translation keys including navigation labels, zone type names, status messages, accessibility button labels, and chat prompts.

The hook exposes a `t(key)` function. Components call `t('find_route')` instead of hardcoding English strings. The active language is read from the global `AppContext`, so changing the language in the navbar instantly refreshes all translated strings across every component without any network request.

---

### 10. Match Simulation Timeline
**Files**: `backend/app/services/crowd.py`, `frontend/src/shared/components/TimelineSlider.tsx`

The simulation models a 90-minute football match with distinct crowd behaviour phases:
- **0–15 min (Pre-match)**: Gates and entrance concourses are at peak density as fans arrive.
- **15–45 min (First Half)**: Interior zones normalise; concessions see moderate traffic.
- **45–50 min (Halftime)**: Restrooms and food stands surge to maximum density.
- **50–90 min (Second Half)**: Densities drop as fans return to seats.
- **90+ min (Post-match)**: Exit gates and transit zones spike to maximum.

`crowd.py` applies time-based multipliers to each zone's base capacity to calculate current density. The `TimelineSlider.tsx` component sends the selected minute to the backend via the WebSocket stream, which recalculates and pushes back updated density data in real time.

Preset buttons — **Kickoff**, **Halftime**, **Fulltime** — jump the slider to the highest-impact moments for quick demonstration.

---

### 11. Token-Bucket Rate Limiter
**Files**: `backend/app/utils/rate_limit.py`

A custom FastAPI middleware implements a **token-bucket** algorithm. Each client IP address gets a bucket of 20 tokens that refills at 1 token per second. Every API request deducts one token. When a bucket empties, subsequent requests receive a `429 Too Many Requests` response, protecting the backend from flooding and shielding the Gemini API quota from accidental or malicious exhaustion.

---

### 12. Dev Monitor Panel
**Files**: `frontend/src/shared/components/DevModePanel.tsx`

A collapsible glassmorphic side panel (toggled via a 🛠 button in the navbar) displays real-time internal decision telemetry:
- Active stadium and current simulation minute
- Accessibility mode status
- Last AI response intent (navigation / crowd query / general)
- LLM response latency (ms)
- Confidence score from Gemini's structured output
- Fallback source (Gemini / MockLLM / template)
- Resolved Dijkstra path node sequence

This panel is designed for judges and reviewers to inspect the system's decision-making process transparently without needing to read server logs.

---

## 2. Approach & Logic — Rules Before LLM

```
UserContext ──▶ Rules & Path Engines (Dijkstra) ──▶ Resolved Facts ──▶ LLM Phrasing ──▶ Answer
                  • Resolve active stadium config       • Shortest path list
                  • Calculate Dijkstra route graph      • Crowd density level
                  • Apply accessibility penalties       • Step-free route list
                  • Locate nearest AED / safety zone    • Offline fallback state
```

1. The pathfinding and simulation layers resolve every fact before any LLM call.
2. The LLM only phrases and explains already-resolved facts in the requested language.
3. Standard navigational queries short-circuit to offline template responses, avoiding LLM calls entirely.

### Rules Implemented
| Rule | Behaviour |
| :--- | :--- |
| **Wheelchair / Step-Free** | `+1000.0` traversal penalty forces paths through elevator lobbies. Routes render in violet/purple. |
| **Emergency Guidance** | Routes to nearest safety assembly point and AED automatically. |
| **Crowd Surge** | Timeline multipliers scale zone densities by match phase. |
| **Explainable AI** | Gemini returns structured: Recommendation, Reasoning, Time Saved, Confidence, Alternative. |
| **Prompt Injection Defense** | User text wrapped in delimiter blocks; routing resolved before LLM sees the message. |

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
# Windows: .venv\Scripts\activate

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
4. Push the contents of the `backend/` directory to the Space repository. Hugging Face will build the multi-stage container from the included `Dockerfile` and bind to port `7860` automatically.

### Frontend — Vercel
1. Import the `frontend/` directory to [Vercel](https://vercel.com).
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set the `VITE_API_BASE_URL` environment variable to your Hugging Face Space backend URL.
4. Deploy the project.

---

## 4. Assumptions
- Stadium layouts (MetLife, SoFi, Azteca), facilities coordinates, and adjacency lists are illustrative configurations, not official CAD data.
- Crowd densities are simulated from the match timeline, not live sensor feeds.
- The Google Gemini key is optional; when unset, MockLLM provides offline functionality.

---

## 5. Quality Attributes

### 🔒 Security
- **No Secrets in Code**: All configs via environment variables. Keyless mode triggers MockLLM fallback.
- **Input Validation**: Pydantic v2 schemas reject malformed zone IDs and parameters.
- **Prompt-Injection Defense**: User text is delimited in the system prompt. Dijkstra runs before the LLM.
- **Rate Limiting**: Token-bucket middleware prevents API flooding.

### ⚡ Efficiency
- **Config Cache**: Stadium metadata loaded once at startup.
- **Short-circuiting**: Navigation templates bypass LLM calls for standard queries.
- **Async Endpoints**: FastAPI's non-blocking handlers serve concurrent requests.
- **WebSocket Singleton**: Module-level socket cache prevents duplicate TCP connections.

### ♿ Accessibility — WCAG 2.1 AA
- **Visual Paths**: Wheelchair routes rendered in high-contrast purple/violet SVG vectors.
- **Semantic HTML**: Logical heading hierarchy, single `<h1>`, tab-navigable outlines.
- **A11y Theme**: High-visibility mode with large text and high-contrast borders.
- **TTS**: Every AI reply can be spoken aloud in the user's language.

### 🧪 Testing
- **Backend** — 39 test cases (Dijkstra, accessibility, rate limiters, timeline generators):
  ```bash
  cd backend && pytest tests/ -v
  ```
- **Frontend** — 6 Vitest component tests (StadiumMap, Dashboard, ChatWindow):
  ```bash
  cd frontend && npx vitest run
  ```

---

## 6. Architecture & File Tree

```
                       ┌─────────────────────────────┐
  Vercel Frontend ────▶│  FastAPI Backend (HF Space) │
  (React 19 + Vite)    │  • CORS + Security headers  │
                       │  • Rate Limiting Middleware  │
                       └──────────────┬──────────────┘
                                      │ WS /api/v1/crowd/ws/{id}
                                      │ POST /api/v1/chat
                                      │ POST /api/v1/navigate
                                      ▼
                       ┌─────────────────────────────┐
                       │  Services Engine            │
                       │  ├─ stadiums.py (Configs)   │
                       │  ├─ navigation.py (Dijkstra)│
                       │  └─ crowd.py (Simulation)   │
                       └──────────────┬──────────────┘
                                      │ Resolved Path & Facts
                                      ▼
                       ┌─────────────────────────────┐
                       │  LLM Phrasing Layer         │
                       │  ├─ MockLLM (Offline)       │
                       │  └─ Gemini 1.5 Flash        │
                       └─────────────────────────────┘
```

### Directory Structure
```
stadium-os-fifa2026/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI startup & CORS config
│   │   ├── config.py            # Environment / dotenv settings
│   │   ├── models.py            # Pydantic v2 request/response schemas
│   │   ├── services/
│   │   │   ├── stadiums.py      # Venue config dictionaries (MetLife/SoFi/Azteca)
│   │   │   ├── navigation.py    # Weighted Dijkstra + accessibility solver
│   │   │   ├── crowd.py         # Match-phase crowd simulation engine
│   │   │   ├── recommendation.py# Smart facility recommendation engine
│   │   │   └── gemini.py        # Gemini API client + MockLLM fallback
│   │   ├── routes/
│   │   │   ├── chat.py          # POST /chat — AI assistant endpoint
│   │   │   ├── crowd.py         # WS /crowd/ws — real-time crowd stream
│   │   │   └── navigate.py      # POST /navigate — Dijkstra path endpoint
│   │   └── utils/
│   │       ├── rate_limit.py    # Token-bucket rate limiter middleware
│   │       └── validators.py    # Regex input sanitization helpers
│   ├── tests/                   # 39 pytest test cases
│   ├── Dockerfile               # Multi-stage build for Hugging Face Spaces
│   ├── .env.example             # API key template
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root layout + AI→Map sync logic
│   │   ├── index.css            # HSL design tokens + glassmorphic theme
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   │   └── ChatWindow.tsx    # AI chat UI, voice input, TTS buttons
│   │   │   ├── navigation/
│   │   │   │   └── StadiumMap.tsx    # SVG map, route overlays, amenity icons
│   │   │   └── crowd/
│   │   │       └── Dashboard.tsx     # Crowd gauges, alerts, leaderboard
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── TopNavbar.tsx     # Stadium selector, lang picker, a11y toggle
│   │   │   │   ├── TimelineSlider.tsx# Match simulation timeline control
│   │   │   │   └── DevModePanel.tsx  # Decision telemetry inspector panel
│   │   │   ├── hooks/
│   │   │   │   ├── useAI.ts          # Chat message state + API calls
│   │   │   │   ├── useCrowdData.ts   # Reads crowd state from AppContext
│   │   │   │   ├── useTextToSpeech.ts# Web Speech SpeechSynthesis wrapper
│   │   │   │   └── useTranslation.ts # 10-language local dictionary hook
│   │   │   ├── context/
│   │   │   │   └── AppContext.tsx    # Singleton global state + WebSocket root
│   │   │   └── utils/
│   │   │       └── stadiums.ts      # Frontend venue zone configs & coordinates
│   │   └── services/
│   │       └── api.ts               # Fetch/Axios API client
│   ├── tests/                       # 6 Vitest component tests
│   └── package.json
└── README.md
```

---

## 👥 License
MIT License — Built for the FIFA 2026 Stadium Challenge.