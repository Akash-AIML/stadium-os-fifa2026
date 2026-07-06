# FIFA 2026 Smart Guide — Technical Implementation Plan

## 1. Project Overview & Target Evaluation

This plan targets the following challenge priority tiers:

| Judging Criteria | Impact | How Project Earns Points |
| :--------------- | :----- | :--------------------------------------------------------------------- |
| **Code Quality** | High | Feature-based architecture, typed APIs, service layers, clean separation of concerns |
| **Security** | High | Input validation, prompt injection protection, rate limiting, CORS, env isolation |
| **Efficiency** | High | SVG map, memoization, AI response caching, context compression, lazy loading |
| **Testing** | Medium | Backend/frontend unit tests, mocked Gemini integration, deterministic demo mode |
| **Accessibility** | High | WCAG AA, keyboard navigation, screen readers, high contrast, reduced motion support |

---

## 2. Core Persona & Vertical

| Item | Details |
| :------------------ | :------------------------------------------------------------------------------- |
| **Primary Persona** | Football Fans |
| **Secondary Persona** | Venue Staff (future extension) |
| **Vertical** | **Multilingual Stadium Assistant + Navigation + Crowd Management** |
| **Core Problem** | Fans struggle with navigation, language barriers, crowd avoidance, and finding amenities in large stadiums |

---

## 3. Architecture

### 3.1 High-Level Flow

```
React UI
├── Fan Assistant (Primary)
│   ├── AI Chat
│   ├── Interactive Stadium Map
│   └── Quick Actions
├── Crowd Status Cards
└── Operations Dashboard (Demo)

React Context + Custom Hooks (e.g., useCrowdData, useAISummary)
      │
      ▼
Service Layer (api.ts)
      │
      ▼
FastAPI Backend
 ├── /chat (Gemini AI)      → Smart, Summarized, Contextual Responses
 ├── /crowd (Simulation)    → Real-time JSON data
 ├── /navigate (Pathfinding) → Weighted route reasoning
 └── /recommend (Engine)    → Proactive suggestions
      │
      ▼
Google Gemini API           → Natural Language Generation & Reasoning
```

### 3.2 Tech Stack

| Category | Technology | Rationale |
| :------- | :--------- | :-------- |
| Frontend | React (Vite) + shadcn/ui + Tailwind CSS | Lightweight, modern, modular, accessible |
| Backend | FastAPI (Python) | Fast, typed, efficient for REST APIs |
| AI | Google Gemini API (Flash) | Intelligent reasoning, multilingual, cost-effective |
| Data | In-Memory Simulation | No database, lightweight setup |
| Map | SVG-based custom map | Zero dependencies, small bundle (<1MB) |

---

## 4. AI Workflow Diagram

```
User Input
    │
    ▼
Input Validation & Sanitization
(Pydantic, regex filters, length limits)
    │
    ▼
Rule-Based Intent Detection
(keywords, patterns, no AI call)
    │
    ▼
Context Builder
(injects only relevant crowd/map data)
    │
    ▼
Crowd Engine / Navigation Engine
(fetch live simulation data)
    │
    ▼
Gemini (Single API Call)
    │
    ▼
Response Validator
(check for hallucinations, safety)
    │
    ▼
Frontend Display
(chat bubble, map update, alert)
```

---

## 5. Feature-Based Directory Structure

### 5.1 Root Layout

```text
fifa-2026-smart-guide/
├── .github/
│   └── workflows/
│       └── ci.yml            # CI: install, test, format
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings (Pydantic)
│   │   ├── models.py         # Pydantic Schemas
│   │   ├── services/
│   │   │   ├── gemini.py     # AI Client + Prompt Engineering
│   │   │   ├── crowd.py      # Crowd Simulation Engine
│   │   │   ├── navigation.py # Pathfinding Logic (Dijkstra)
│   │   │   └── recommendation.py # Proactive Suggestions
│   │   ├── routes/
│   │   │   ├── chat.py       # AI Chat Endpoint
│   │   │   ├── crowd.py      # Data Endpoint
│   │   │   ├── navigate.py   # Route Endpoint
│   │   │   └── recommend.py  # Suggestions Endpoint
│   │   └── utils/
│   │       ├── exceptions.py # Custom Error Classes
│   │       ├── validators.py # Sanitization
│   │       └── intent.py     # Rule-Based Intent Classifier
│   ├── tests/              # pytest suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── features/
│   │   │   ├── chat/         # Chat UI + AI Logic
│   │   │   ├── navigation/   # Interactive Map
│   │   │   ├── crowd/        # Crowd Data Cards
│   │   │   └── dashboard/    # Ops Overview (Demo)
│   │   ├── shared/
│   │   │   ├── components/   # Reusable UI (shadcn)
│   │   │   ├── hooks/        # useCrowdData, useAI
│   │   │   ├── utils/        # Formatters, constants
│   │   │   └── types/        # Global interfaces
│   │   └── services/
│   │       └── api.ts        # Axios/Fetch wrapper
│   ├── public/
│   ├── tests/               # Vitest suite
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── README.md
└── IMPLEMENTATION.md        # This plan
```

---

## 6. Data Models & API Contracts

### 6.1 TypeScript Interfaces (Shared)

```typescript
// shared/types/index.ts
export enum ZoneStatus {
  CLEAR = 'clear',
  MODERATE = 'moderate',
  BUSY = 'busy',
  CONGESTED = 'congested',
}

export enum IntentType {
  NAVIGATION = 'navigation',
  CROWD_STATUS =igens't'crowd_status',
  RECOMMENDATION = 'recommendation',
  GENERAL = 'general',
}

export interface CrowdSnapshot {
  zoneId: string;
  density: number;     // 0-1
  status: ZoneStatus;
  queueTime: number;   // minutes
}

export interface Zone {
  id: string;
  label: string;
  type: 'entrance' | 'seating' | 'food' | 'wc' | 'medical' | 'exit';
  location: [number, number]; // SVG coordinates
  status: ZoneStatus;
}

export interface Route {
  id: string;
  path: string[];     // Sequence of zone IDs
  estimatedTime: number;
  crowdLevel: number;
  rationale: string;   // AI explanation
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  intent: IntentType;
  contextSnapshot: CrowdSnapshot[];
  isFallback: boolean; // True if from rule-based
  language: string;    // Detected user language
  routeId?: string;    // Associated route if navigation
  responseTime?: number; // API latency in ms
  confidence?: number; // AI confidence score
}

export interface Alert {
  id: string;
  level: 'warning' | 'critical';
  message: string;
  zoneId: string;
}

export interface Recommendation {
  id: string;
  type: 'food' | 'restroom' | 'exit' | 'safety';
  message: string;
  zoneId: string;
  priority: 'low' | 'medium' | 'high';
}
```

### 6.2 API Specification

**Base URL**: `/api/v1`

**Endpoints**:

| Method | Endpoint | Description |
| :----- | :------- | :---------- |
| `GET` | `/crowd` | Returns current stadium-wide crowd data |
| `POST` | `/chat` | Handles AI chat requests |
| `GET` | `/navigate?from={zoneId}&to={zoneId}` | Returns optimal route |
| `GET` | `/recommend?zoneId={zoneId}` | Returns proactive suggestions |

---

## 7. Backend Service Design

### 7.1 `services/gemini.py`

**Responsibilities**:
- API Key management
- System prompt injection
- Response formatting and safety

**System Prompt Strategy**:

```python
SYSTEM_PROMPT = """
You are FIFA SmartGuide, an AI assistant for football fans at the 2026 World Cup.
Use the provided real-time stadium data to answer questions clearly, concisely, and helpfully.
Always respond in the user's language.
Do not make up information. If data is missing, say so.

Current Data:
{context_data}

User Question:
{user_message}
"""
```

**Sanitization**:
- Reject prompts containing "ignore previous", "system prompt", "reveal your prompt", etc.
- Validate user input length (max 500 chars).
- Strip HTML/JSX tags from user input.

### 7.2 `services/crowd.py`

**Functionalities**:
- Generate deterministic data based on match timeline.
- Accept "Time of Day" parameter for testing.

**Simulation Logic**:
```python
def get_crowd_data(match_time_minutes: int) -> list[CrowdSnapshot]:
    # Before match -> Gates & Food are BUSY
    # Halftime -> WCs & Food are CONGESTED
    ...
```

### 7.3 `services/navigation.py`

**Algorithm**: Dijkstra's (single, deterministic choice)

**Graph Generation**:
- Vertices: All zones.
- Edges: Defined in `data/zones.json` (distance, connectivity).

**Weighting Formula**:
```
weight = (distance * 0.6) + (crowd_density * 0.4)
```

**Flow**:
1. User requests a route.
2. Fetch current `CrowdSnapshot`.
3. Prune `CONGESTED` zones.
4. Run Dijkstra's on the pruned graph.
5. Return `Route` with an AI-generated `rationale`.

### 7.4 `services/recommendation.py`

**Responsibilities**:
- Analyze crowd data for proactive suggestions.
- Generate contextual recommendations for fans.

**Logic Examples**:
- Food: "Food Court A is crowded. Food Court C has a shorter queue."
- Restroom: " facilities near Section D are congested. Try the one near Section B."
- Exit: "Gate 4 is congested. Use Gate 2 for a faster exit."
- Safety: "Heavy congestion near Section D. Take Corridor B."

---

## 8. Frontend State Flow

### 8.1 Context API Structure

```typescript
interface AppState {
  user: { name: string; role: 'fan' | 'staff'; lang: string };
  currentZone: string;
  crowdData: CrowdSnapshot[];
  alerts: Alert[];
  recommendations: Recommendation[];
  chatHistory: ChatMessage[];
  simulationTime: number;
  devMode: boolean;
}
```

### 8.2 Hooks

- `useCrowdData(time: number)`: Fetches and caches crowd data.
- `useAI() Photon`: Wraps the chat API, handles loading and errors.
- `useSimulation()`: Controls the match day timeline.
- `useDevMode()`: Toggles developer mode visibility.

---

## 9. AI Prompt Strategy

### 9.1 Rule-Based Intent Detection

**No AI call for intent classification.**

Use keyword/pattern matching:

```python
def detect_intent(user_message: str) -> IntentType:
    msg = user_message.lower()
    if any(word in msg for word in ['gate', 'seat', 'route', 'navigate', 'how to get']):
        return IntentType.NAVIGATION
    elif any(word in msg for word in ['crowd', 'busy', 'queue', 'wait']):
        return IntentType.CROWD_STATUS
    elif any(word in msg for word in ['food', 'eat', 'restroom', 'bathroom', 'toilet', 'where']):
        return IntentType.RECOMMENDATION
    else:
        return IntentType.GENERAL
```

### 9.2 Context Injection

Based on intent, inject ONLY relevant data to minimize tokens.

### 9.3 Fallback Logic

If Gemini fails (timeout, 429 error, invalid response):
1. Catch the exception.
2. Return a pre-formatted `ChatMessage` with `isFallback: true`.
3. Log the failure to Dev Mode.

---

## 10. Implementation Phases

### Phase 1: Foundation (Day 1)
- [ ] Initialize GitHub repo (public, single branch).
- [ ] Set up backend folder structure (`app/`, `tests/`, `.env.example`).
- [ ] Set up frontend folder structure (`src/`, `tests/`, `public/`).
- [ ] Add shared type definitions.
- [ ] Install dependencies (`fastapi`, `uvicorn`, `google-generativeai`, `pydantic`, `react`, `typescript`, `vite`, `shadcn`, `tailwindcss`).
- [ ] Create `.gitignore` (ensure `node_modules` and `.venv` are ignored).
- [ ] **Deliverable**: Initial commit, README skeleton.

### Phase 2: Backend Services (Day 2)
- [ ] Implement `CrowdEngine` with deterministic simulation.
- [ ] Implement `Navigation` (Dijkstra's algorithm).
- [ ] Implement `RecommendationEngine` with proactive suggestions.
- [ ] Implement `GeminiClient` with system prompts and sanitization.
- [ ] Create API routes (`/crowd`, `/navigate`, `/chat`, `/recommend`).
- [ ] Add input validation (Pydantic, custom validators).
- [ ] Add rate limiting (in-memory).
- [ ] Implement rule-based intent detection.
- [ ] **Deliverable**: Working backend, tested via curl.

### Phase 3: Frontend Core (Day 3)
- [ ] Implement Context API for global state.
- [ ] Create `api.ts` service layer.
- [ ] Build `StadiumMap` (SVG with zones, interactivity).
- [ ] Build `Dashboard` (status cards, charts, alerts).
- [ ] Build `RecommendationCards` (proactive suggestions).
- [ ] **Deliverable**: Interactive map and dashboard rendering simulated data.

### Phase 4: Smart Assistant (Day 4)
- [ ] Build `ChatInterface` (shadcn `Card`, `ScrollArea`, `Input`).
- [ ] Connect to `/chat` endpoint.
- [ ] Implement intent detection UI (loading states).
- [ ] Add multilingual support (via Gemini).
- [ ] **Deliverable**: Functional bilingual chatbot.

### Phase 5: Polish & Testing (Day 5)
- [ ] Add keyboard navigation (`Tab`, `Enter`, `Escape`).
- [ ] Add ARIA labels for SVG and interactive elements.
- [ ] Add `aria-live="polite"` for crowd updates.
- [ ] Implement skip-to-content link.
- [ ] Add focus trapping in dialogs.
- [ ] Add visible focus rings.
- [ ] Add responsive design (mobile-first, bottom sheet on mobile).
- [ ] Implement Dev Mode (hidden toggle).
- [ ] Write backend tests (`pytest`).
- [ ] Write frontend tests (`vitest`).
- [ ] Optimize bundle size (`vite-bundle-visualizer`).
- [ ] **Deliverable**: Tested, accessible, production-ready code.

### Phase 6: Demo & Submission (Day 6)
- [ ] Create deterministic demo scenarios (`scenario1.json`).
- [ ] Test all demo scenarios thoroughly.
- [ ] Write comprehensive `README.md`.
- [ ] Add architecture diagram to README.
- [ ] Perform final size check (`du -sh .`).
- [ ] Commit, push to single branch.
- [ ] **Deliverable**: Final submission.

---

## 11. Testing Strategy

### 11.1 Backend Tests (pytest)

| Test File | Coverage |
| :-------- | :------- |
| `test_crowd.py` | Deterministic output based on time input |
| `test_navigation.py` | Route correctness, congestion avoidance |
| `test_recommendation.py` | Proactive suggestion logic |
| `test_chat.py` | Sanitization, fallback logic, intent detection |
| `test_rate_limit.py` | In-memory rate limiting |

### 11.2 Frontend Tests (Vitest)

| Test File | Coverage |
| :-------- | :------- |
| `ChatWindow.test.tsx` | Render, submit, display messages |
| `StadiumMap.test.tsx` | Zone click, color changes |
| `Dashboard.test.tsx` | Alerts display, card updates |

### 11.3 Mocking

- Mock Gemini API using `unittest.mock` in Python.
- Mock API calls using `msw` (Mock Service Worker) in Vitest.

---

## 12. Accessibility Checklist

| Item | Implementation |
| :----- | :------------- |
| **Keyboard Nav** | `Tab`, `Enter`, `Escape` for all interactive elements |
| **Screen Reader** | `aria-label` for SVG zones, `role="button"`, `aria-live` for chat |
| **Skip-to-Content** | Visible skip link for keyboard users |
| **Focus Trapping** | Trap focus within modals/dialogs |
| **Visible Focus** | High-contrast focus rings for all interactive elements |
| **Color** | Icons + patterns + text for status (not just red/green) |
| **Motion** | `prefers-reduced-motion` for animations |
| **Font Scaling** | `rem` units, responsive layout (up to 200%) |
| **Contrast** | WCAG AA standard for text and UI elements |

---

## 13. Developer Mode

Toggle via keyboard shortcut (`Ctrl+Shift+D`) or hidden button.

**Displays**:
- AI latency (ms)
- Current context (simulation data injected into prompt)
- Simulation state (match time, active zones)
- Fallback status (AI vs. rule-based)
- Prompt tokens (input/output)
- Intent classification result

---

## 14. CI/CD Pipeline

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run backend tests
        run: |
          cd backend
          pytest
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      - name: Run frontend tests
        run: |
          cd frontend
          npm run test
      - name: Check formatting
        run: |
          cd backend
          black --check .
```

---

## 15. Risk Analysis

| Risk | Mitigation |
| :--- | :--------- |
| **Repo > 10MB** | Use SVG map, no DB, minimal dependencies |
| **Gemini API down** | Robust fallback + rule-based engine |
| **Slow DEV start** | `npm install` only, lightweight Vite |
| **Cross-origin issues** | Proper CORS setup, `proxy` in dev |

---

## 16. Future Enhancements

| Feature | Description |
| :------- | :---------- |
| **Real-time GPS** | Connect to user location data |
| **Push Notifications** | Alerts for critical crowd changes |
| **Volunteer App** | Separate lightweight mobile app |
| **Machine Learning** | Predict crowd spikes before they happen |

---

## 17. Submission Checklist

- [ ] Public GitHub Repository (single branch)
- [ ] Complete project code
- [ ] `README.md` (Approach, Logic, Assumptions, Architecture Diagram, Screenshots, AI Workflow, Security Considerations, Future Roadmap)
- [ ] `.gitignore` (excluding sensitive info & modules)
- [ ] `requirements.txt`
- [ ] Deterministic Demo Mode
- [ ] CI Pipeline (`ci.yml`)
- [ ] Final Size < 10MB

---

## 18. Evaluation Scorecard Mapping

| Judging Criteria | How the Project Addresses It |
| :--------------- | :--------------------------------------------------------------------- |
| **Code Quality** | Feature-based architecture, typed APIs, service layers, clean separation of concerns, reusable components |
| **Security** | Input validation, prompt injection protection, rate limiting, environment variables, restricted CORS |
| **Efficiency** | Lightweight SVG map, memoization, lazy loading, response caching, context-aware AI prompts, single AI call |
| **Testing** | Unit tests (backend and frontend), mocked AI integration, deterministic simulation scenarios, CI pipeline |
| **Accessibility** | WCAG-aware design, keyboard navigation, screen reader support, high contrast, reduced motion, focus trapping |
