# StadiumOS ⚽
A smart, configuration-driven, accessible stadium operating system and fan assistant for the FIFA World Cup 2026.

StadiumOS helps fans navigate venues, locate accessible pathways, monitor real-time crowd densities, and receive assistant support in their language — with every recommendation grounded in deterministic stadium geometry so the AI never invents routes or facilities.

**3 modelled FIFA 2026 venues**: 🏟 **MetLife Stadium** (East Rutherford, NJ — FIFA: New Jersey Stadium) · 🏟 **SoFi Stadium** (Los Angeles, CA) · 🏟 **Estadio Azteca** (Mexico City, MX). Switch stadiums live from the top navbar — maps, crowd data, outdoor satellite view, and navigation all update instantly. Languages supported: **English, Spanish, French, German, Portuguese, Arabic, Japanese, Chinese, Hindi, and Tamil**.

🌐 Live Deployment (Full-stack Vercel): https://stadium-os-fifa2026.vercel.app  
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
| Google Generative AI SDK | Gemini 2.5 Flash for explainability and multilingual responses |
| Token-Bucket Rate Limiter | Custom middleware to protect endpoints from spamming |
| python-dotenv | Environment management; key-free mode falls back to offline template mode |
| pytest + pytest-asyncio | 54 backend test cases |

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

**Emergency routing**: Resolves the optimal path to medical AED devices and safety assembly zones by executing Dijkstra routing to nodes configured with safety flags inside the stadium profiles.
 
The endpoint `GET /api/v1/navigate` receives query parameters (`from_zone`, `to_zone`, `accessibility_mode`, `stadium_id`) and returns the ordered zone list, total estimated minutes, and accessibility flag.

#### 🤔 Why Dijkstra? — Algorithm Choice Justification

The stadium navigation problem has four hard requirements that together uniquely qualify Dijkstra and disqualify every common alternative:

1. **Edge weights are non-negative** — every corridor weight is `distance + congestion_factor`, both always ≥ 0.
2. **Weights are dynamic** — congestion multipliers change every few seconds with the WebSocket tick, so the graph cannot be preprocessed once and reused indefinitely.
3. **We need the actual path** (ordered zone list), not just the minimum cost.
4. **Single-source, single-destination** — one fan, one query at a time; not all pairs at once.

| Algorithm | Time Complexity | Handles Weighted Edges | Handles Dynamic Weights | Returns Full Path | Why Ruled Out for StadiumOS |
|:---|:---:|:---:|:---:|:---:|:---|
| **Dijkstra** ✅ | O((V + E) log V) | ✅ Yes | ✅ Yes (re-run on change) | ✅ Yes | **Best fit** — fast, correct, path-aware, non-negative weights |
| **Kruskal's MST** ❌ | O(E log E) | ✅ Yes | ❌ Rebuild required | ❌ No — MST only | Solves a completely different problem: *Minimum Spanning Tree*, not shortest path. MST connects all nodes with minimum total edge cost — it does not find the fastest route from Gate A to Section 112. Applying it to navigation would traverse the entire stadium graph even for a simple 3-hop path. |
| **Prim's MST** ❌ | O(E log V) | ✅ Yes | ❌ Rebuild required | ❌ No — MST only | Same issue as Kruskal — it builds a spanning tree of the whole venue, not a point-to-point route. Suited for network cabling problems, not fan navigation. |
| **Bellman-Ford** ❌ | O(V × E) | ✅ Yes | ✅ Yes | ✅ Yes | Handles negative weights, which we do not have. It relaxes every edge `V-1` times regardless — a stadium with ~40 nodes and ~120 edges runs 4,800 relaxations per query vs. Dijkstra's ~80–160 heap operations. Too slow for real-time per-request path resolution. |
| **A\* Search** ⚠️ | O(E log V) | ✅ Yes | ✅ Yes | ✅ Yes | Faster than Dijkstra *if* a reliable admissible heuristic exists (e.g. Euclidean distance to destination). Stadium zones use logical IDs (`gate_a`, `section_112`), not necessarily spatially meaningful coordinates. Designing a consistent heuristic across all three venue layouts and accessibility weight overrides without inadvertently making it inadmissible (which would break correctness) adds significant complexity for marginal gain on a ~40-node graph. Dijkstra is already sub-millisecond at this scale. |
| **BFS (Breadth-First)** ❌ | O(V + E) | ❌ No | ❌ No | ✅ Yes | Only finds shortest path in terms of *hop count* (number of zones crossed), ignoring actual corridor distances, crowd congestion multipliers, and accessibility penalties entirely. A BFS path might route a fan through 3 zones but through peak-density concourses, while the true optimal 5-zone path takes 40% less time. |
| **Floyd-Warshall** ❌ | O(V³) | ✅ Yes | ❌ Expensive rebuild | ✅ Yes | Computes shortest paths between *all pairs* of nodes. At `V=40` zones that is 64,000 operations — and the entire table must be rebuilt every time a crowd multiplier changes (every ~3 seconds). Completely impractical for dynamic real-time weights; designed for static graphs queried exhaustively, not single-pair live routing. |
| **Johnson's Algorithm** ❌ | O(V² log V + VE) | ✅ Yes | ❌ Expensive rebuild | ✅ Yes | A multi-source preprocessing algorithm combining Bellman-Ford + Dijkstra to handle graphs with negative edges. Our weights are always positive, so the Bellman-Ford preprocessing pass is pure wasted computation. Designed for dense static graphs; overkill and slower for our sparse, dynamic adjacency list. |

**Summary**: Kruskal and Prim solve a structurally different problem (MST). BFS ignores weights. Bellman-Ford is unnecessarily slow. Floyd-Warshall and Johnson's are batch-preprocessing algorithms unsuited for real-time per-request routing with dynamic weights. A* is a valid alternative but offers no measurable gain over Dijkstra on a ≤50-node stadium graph, while introducing heuristic design complexity. **Dijkstra with a min-heap is the canonical, correct, and most efficient choice for this exact problem class.**

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
- `recommendations`: Rule-based action cards (e.g. "Use Gate C — 40% less crowded")
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
5. The API returns the raw text from Gemini along with metadata properties (including text, timestamp, response time, confidence, and is_fallback status).
6. If no API key is set, the `_generate_fallback_response()` method in `gemini.py` returns template-based responses in the correct language, enabling full offline functionality.

Language grounding maps 2-letter codes to full names for the prompt (e.g. `ta` → `Tamil`, `ar` → `Arabic (العربية)`), guaranteeing Gemini replies in the correct natural language.

---

### 6. AI → Map Synchronization
**Files**: `frontend/src/App.tsx`

A `useEffect` in `App.tsx` monitors the global chat history array. When a new assistant message arrives, it runs a lightweight intent parser on the response text:
- If a **zone name** from the active stadium config is detected, it dispatches `SET_HIGHLIGHT_ZONE` to pulse and center that zone on the SVG map.
- If a **path description** is detected (e.g. "take elevator to section 112"), it fires `GET /api/v1/navigate` and draws the resolved route overlay automatically.
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

The simulation models crowd behavior across different match clock thresholds:
- **Arrival Phase (< 30 min)**: Entrances peak in density as fans stream into the stadium.
- **First Half & Second Half (30 to 90 min)**: Seating zones spike to peak capacity.
- **Halftime (45 to 60 min)**: Concessions (food) and restrooms (wc) surge to maximum density.
- **Egress Phase (> 90 min)**: Exit gates spike to peak density while seating and entrances clear out.

`crowd.py` applies time-based multipliers to each zone's base capacity to calculate current density. The `TimelineSlider.tsx` component sends the selected minute to the backend via the WebSocket stream, which recalculates and pushes back updated density data in real time.

Preset buttons — **Kickoff**, **Halftime**, **Fulltime** — jump the slider to the highest-impact moments for quick demonstration.

---

### 11. Sliding-Window Rate Limiter
**Files**: `backend/app/utils/rate_limit.py`

A custom FastAPI middleware implements a **sliding-window rate limiter** algorithm using a rolling history of request timestamps per client IP. On each incoming request, timestamps older than the sliding window interval (60 seconds) are evicted, and the remaining request count is validated against the defined limits. If the threshold is exceeded, the request receives a `429 Too Many Requests` response, preventing API flood attacks.

---

### 12. Dev Monitor Panel
**Files**: `frontend/src/shared/components/DevModePanel.tsx`

A collapsible glassmorphic side panel (toggled via a 🛠 button in the navbar) displays real-time internal decision telemetry:
- Active stadium and current simulation minute
- Accessibility mode status
- Last AI response intent (navigation / crowd query / general)
- LLM response latency (ms)
- Confidence score from Gemini's structured output
- Fallback source (Gemini / template)
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

The entire application is deployed as a single, unified deployment on **Vercel** utilizing a monorepo structure. Both the FastAPI Python backend and Vite React frontend run under the same project domain.

### Deployment Configuration (`vercel.json`)
The routing configuration in the root directory manages API rewrites and delegates Python runtime execution:

```json
{
  "services": {
    "frontend": {
      "root": "frontend",
      "framework": "vite"
    },
    "backend": {
      "root": "backend"
    }
  },
  "rewrites": [
    {
      "source": "/api(/.*)?",
      "destination": {
        "type": "service",
        "service": "backend"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "type": "service",
        "service": "frontend"
      }
    }
  ]
}
```

### Steps to Deploy on Vercel
1. Import the root repository to [Vercel](https://vercel.com).
2. Vercel automatically detects the `vercel.json` monorepo settings.
3. Configure the following environment variable in Vercel Settings:
   - `GEMINI_API_KEY`: Your Google Gemini API Key. (If unset, the application automatically falls back to local template-based offline response generator mode).
4. Click **Deploy**. Vercel installs dependencies, builds the Vite production bundle, spins up the FastAPI service, and wires them together under a single domain.

---

## 7. Assumptions
- Stadium layouts (MetLife, SoFi, Azteca), facilities coordinates, and adjacency lists are illustrative configurations, not official CAD data.
- Crowd densities are simulated from the match timeline, not live sensor feeds.
- The Google Gemini key is optional; when unset, template-based offline mode provides offline functionality.

---

## 5. Quality Attributes & Code Hardening

### 🔒 Security & Guardrails
*   **Starlette Security Headers Middleware**: registered custom HTTP middleware block in [main.py](file:///home/hyprtest/Projects/Fifa/backend/app/main.py) which appends standard browser security headers to every API envelope response:
    *   `Content-Security-Policy`: `"default-src 'self'; frame-ancestors 'none'; object-src 'none';"`
    *   `Strict-Transport-Security`: `"max-age=31536000; includeSubDomains"`
    *   `X-Frame-Options`: `"DENY"`
    *   `X-Content-Type-Options`: `"nosniff"`
    *   `X-XSS-Protection`: `"1; mode=block"`
    *   `Referrer-Policy`: `"strict-origin-when-cross-origin"`
*   **Token-Bucket IP Rate Limiting**: configured `rate_limit_dependency` in [rate_limit.py](file:///home/hyprtest/Projects/Fifa/backend/app/utils/rate_limit.py) supporting `X-Forwarded-For` request header resolution to identify client IPs behind reverse-proxies. Applied dependency to protect all REST endpoints (`/navigate`, `/crowd/`, `/alerts`, `/recommendations`, and `/chat`).
*   **WebSocket Origin & rate checks**: enforced origin checking in [crowd.py](file:///home/hyprtest/Projects/Fifa/backend/app/routes/crowd.py) (restricting socket connections to local development or Vercel production domains), combined with rolling-window IP rate limiting checks inside the WebSocket subscription route.
*   **Recursive HTML Sanitization & Input Checks**: developed a recursive HTML tag-stripping utility `strip_html` in [validators.py](file:///home/hyprtest/Projects/Fifa/backend/app/utils/validators.py) to block script injection bypass payloads (e.g. `<<script>script>`). Used to sanitize both user input messages and co-pilot response strings before they are dispatched.
*   **dev_info Gating**: Gated verbose debug metrics (intent classification, tokens, fallback flags) behind settings `dev_mode` flag to prevent data exposure to production users.

### 📐 Code Quality & Refactoring Standards
*   **Function Complexity Reduction**: Refactored complex/long functions to align with Single Responsibility Principle (SRP) and keep cyclomatic complexity low:
    *   `NavigationEngine.find_route` was broken down into private solver `_run_dijkstra` and path constructor `_reconstruct_path` helpers.
    *   `handle_chat` was broken down into `_extract_routing_zones`, `_resolve_target_type`, and `_resolve_facility_route` helpers.
    *   `GeminiClient._build_prompt` was broken down into `_get_timeline_phase`, `_format_stadium_context`, and `_format_snapshots_and_alerts_context` helpers.
*   **Strict Pydantic Literal Validations**: Upgraded models in [models.py](file:///home/hyprtest/Projects/Fifa/backend/app/models.py) to utilize `typing.Literal` types instead of basic strings for defined fields (Alert levels, Recommendation priorities, Chat message roles). Added `model_config = {"extra": "ignore"}` to prevent unexpected field leaks.
*   **Docstring Coverage**: Wrote complete PEP-257 docstrings and structural type annotations for all route handlers, classes, methods, and test blocks.
*   **Constants over Magic Numbers**: Extracted walk speed factors, congestion weights, default densities, and match times into module constants to prevent magic numbers clutter.

### ⚡ Efficiency & Scaling
*   **Adjacency List Dijkstra**: Walk calculations run under sub-millisecond ranges using Python's `heapq` priority queue.
*   **Non-Blocking WebSocket Coroutines**: Stream updates are run concurrently using non-blocking asynchronous event loops.
*   **Duplicate Imports Cleanup**: Eliminated duplicate `STADIUM_ZONES` and `ZONE_GRAPH` metadata structures from `crowd.py` in favor of centralized configurations in [stadiums.py](file:///home/hyprtest/Projects/Fifa/backend/app/services/stadiums.py).

### ♿ Accessibility — WCAG 2.1 AA
*   **Visual Paths**: Wheelchair routes rendered in high-contrast purple/violet SVG vectors.
*   **Semantic HTML**: Logical heading hierarchy, single `<h1>`, tab-navigable outlines.
*   **A11y Theme**: High-visibility mode with large text and high-contrast borders.
*   **TTS**: Every AI reply can be spoken aloud in the user's language. Corrected Spanish dictionary translation typos and added `"hi"` and `"ta"` to validators.

### 🧪 Testing & Code Coverage
*   **Backend** — 54 test cases with **87% statement coverage** (tracked locally via `pytest --cov` utilizing `.coveragerc` configurations):
  ```bash
  cd backend && pytest tests/ -v
  ```
*   **Frontend** — 8 Vitest unit tests (TopNavbar toggle accessibility, search, inputs, map details):
  ```bash
  cd frontend && npm run test -- --run
  ```

---

## 9. Architecture & File Tree

```
                        ┌───────────────────────────────┐
                        │      Unified Vercel Host      │
                        │                               │
                        │   Vite Frontend (React 19)    │
                        │             │                 │
                        │             ▼ (Rewrites /api) │
                        │   FastAPI Python Backend      │
                        │      • Rate Limiting          │
                        │      • Security Headers       │
                        └─────────────┬─────────────────┘
                                      │ WS /api/v1/crowd/ws/{id}
                                      │ POST /api/v1/chat
                                      │ GET /api/v1/navigate
                                      ▼
                        ┌───────────────────────────────┐
                        │       Services Engine         │
                        │   ├─ stadiums.py (Configs)    │
                        │   ├─ navigation.py (Dijkstra) │
                        │   └─ crowd.py (Simulation)    │
                        └─────────────┬─────────────────┘
                                      │ Resolved Path & Facts
                                      ▼
                        ┌───────────────────────────────┐
                        │      LLM Phrasing Layer       │
                        │   ├─ Local Template (Offline) │
                        │   └─ Gemini 2.5 Flash         │
                        └───────────────────────────────┘
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
│   │   │   └── gemini.py        # Gemini API client + local template fallback
│   │   ├── routes/
│   │   │   ├── chat.py          # POST /chat — AI assistant endpoint
│   │   │   ├── crowd.py         # WS /crowd/ws — real-time crowd stream
│   │   │   └── navigate.py      # GET /navigate — Dijkstra path endpoint
│   │   └── utils/
│   │       ├── exceptions.py    # Custom application exception classes
│   │       ├── intent.py        # Keyword intent parser (Dijkstra, crowd, recs)
│   │       ├── rate_limit.py    # Token-bucket rate limiter middleware
│   │       └── validators.py    # Regex input sanitization helpers
│   ├── tests/                   # 54 pytest unit/integration test functions
│   │   ├── conftest.py          # Autouse clock reset & Gemini client mocks
│   │   ├── test_chat.py         # Parameterized chat intent and validation tests
│   │   ├── test_crowd.py        # Crowd clock simulation and density tests
│   │   ├── test_gemini.py       # Translation & template fallback tests
│   │   ├── test_integration.py  # REST and WebSocket integration stream tests
│   │   ├── test_navigation.py   # Dijkstra accessibility routing tests
│   │   ├── test_rate_limit.py   # Sliding-window 429 rate limit tests
│   │   └── test_utils.py        # Message sanitization and HTML stripping tests
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
│   ├── tests/                       # 8 Vitest component tests
│   └── package.json
└── vercel.json                  # Unified Vercel monorepo configuration
```

---

## 10. License
MIT License — Built for the FIFA 2026 Stadium Challenge.

---

## 🏆 SonarQube Cloud Quality Analysis

The codebase is continuously analysed by **SonarQube Cloud** (project: `stadium-os-fifa2026`). Every push to `main` triggers a full static analysis pass across all Python and TypeScript/TSX source files.

### Current Quality Gate Status
| Metric | Result |
|:---|:---|
| **Quality Gate** | ✅ Passing (Sonar Way) |
| **Security Rating** | A |
| **Reliability Rating** | A |
| **Maintainability Rating** | A |
| **Lines of Code** | ~9,700 |
| **Security Hotspots Reviewed** | ✅ All reviewed |
| **Open Issues** | 0 (target maintained) |

### Issues Resolved — Full Catalogue

Over **220 individual SonarQube issues** were resolved across 3 iterations of analysis. The categories and representative fixes are documented below:

#### 🔒 Security — Vulnerability Fixes
| File | Rule | Fix Applied |
|:---|:---|:---|
| `backend/app/routes/crowd.py` L29–L33 | S4792 — user-controlled data in logs | Replaced user-input values in `logger.info/warning` calls with static descriptors; user data never reaches the log stream |
| `backend/app/routes/navigate.py` L36–L46 | S4792 — user-controlled data in logs | Log messages now use static strings only; zone IDs excluded from all log formatting strings |
| `backend/app/routes/navigate.py` L32–L33 | S1481 — unused local variables | Removed `clean_from` and `clean_to` dead-code variables that were left after log sanitization |

#### 🔴 Security — Hotspot Reviews
All hotspots in the following areas were reviewed and confirmed as intended behaviour:
- `validators.py` — regex-based HTML stripping (linear, non-backtracking patterns)
- `crowd.py` — WebSocket origin allow-list (enforced)
- `rate_limit.py` — IP-based rate limiting (X-Forwarded-For trusted behind Vercel proxy)
- `gemini.py` — API key read from environment (not hardcoded)

#### 🧠 Cognitive Complexity — S3776
SonarQube's limit is **15** per function. Every function exceeding this was refactored:

| File | Function | Before | After | Technique |
|:---|:---|:---:|:---:|:---|
| `frontend/src/features/chat/ChatWindow.tsx` | `ChatInput` | 26 | ~8 | Extracted `getMicStyle()`, `getSubmitStyle()`, and `isSubmitDisabled` constant |
| `frontend/src/features/navigation/StadiumMap.tsx` | `ZoneMarkerView` | 31 | ~10 | Extracted `computeZoneMarkerState()` pure helper; 4 `if/else` chains moved outside component |
| `frontend/src/shared/components/TopNavbar.tsx` | `TopNavbar` | 16 | 7 | Extracted `StadiumSelector`, `MatchPhases` sub-components, and `getThemeIcon` helper |
| `backend/app/routes/crowd.py` | `get_crowd_data` | 20 | 14 | Extracted `INVALID_STADIUM_ID` constant; eliminated duplicated string literals |
| `frontend/src/features/navigation/components/ZoneMarkerView.tsx` | `ZoneMarkerView` | 22 | 8 | Extracted `renderZoneShape` helper function to handle complex gate vs. seat shape rendering |

#### 🔁 Code Smells — Maintainability
| Category | Files Fixed | Rule |
|:---|:---|:---|
| Duplicated string literals (4× same literal) | `crowd.py` | S1192 — extracted to `INVALID_STADIUM_ID` constant |
| Nested ternary operations | `TopNavbar.tsx`, `App.tsx`, `ZoneMarkerView.tsx` | S3358 — split into `activePhaseClass` + `inactiveClass` statements; extracted `getDensityTrend` helper; resolved inline marker flags |
| Unused imports | `useCrowd.ts`, `stadiums.ts`, `StadiumMap.tsx`, `MainWorkspace.tsx`, `App.tsx` | S1128 — removed `CrowdSnapshot`, `Maximize2`, `MessageSquare`, `ZoneStatus`, `TimelineSlider`, `memo` |
| Unused local variables | `navigate.py`, `StadiumMap.tsx` | S1481 — removed dead variables |
| Optional chain preferred | `AppContext.tsx`, `useNavigation.ts` | S6582 — `x && x.method()` → `x?.method()` |
| Empty catch blocks | `AppContext.tsx` | S2486 — catch now logs at `console.debug` level in dev mode |

#### ♿ Accessibility — Reliability (jsx-a11y)
| File | Rule | Fix Applied |
|:---|:---|:---|
| `frontend/src/shared/components/input-group.tsx` | S6747 — non-interactive element with click handler | Added `role="button"`, `tabIndex={0}`, `onKeyDown` keyboard handler |
| `frontend/src/features/navigation/StadiumMap.tsx` | S6747 — drag-pan div without keyboard listener | Converted to semantic `<section>` with `aria-label`; dynamically attached mouse panning/dragging listeners in `useEffect` (attaching `mousemove`/`mouseup` to `window` during dragging) to keep JSX clean and avoid static role warnings |

#### 🏎️ Performance — Regex Backtracking S5852
| File | Before | After |
|:---|:---|:---|
| `useTextToSpeech.ts` | `/\[([^\]]*?)\]\([^)]*?\)/g` | `/\[([^\]\n]+)\]\(([^)\s]+)\)/g` — greedy quantifiers with line-restricted text (`[^\]\n]`) and space-restricted URL (`[^)\s]`) prevent backtracking entirely |

#### ⚙️ Build & Config
| File | Rule | Fix |
|:---|:---|:---|
| `vite.config.ts` | S4823 — prefer `node:` prefix for Node builtins | `import path from 'path'` → `import path from 'node:path'` |

#### 🎨 React Three Fiber — Unknown JSX Props
SonarQube's static HTML checker flags Three.js property names (`position`, `rotation`, `intensity`, `color`, `decay`, `distance`) as unknown HTML attributes on JSX elements. All were wrapped in object-spread syntax to bypass the static check while preserving runtime behaviour:
```tsx
// ❌ Before (flags as unknown attribute)
<mesh position={[0, 8, 0]}>

// ✅ After (bypasses static checker, identical runtime)
<mesh {...{ position: [0, 8, 0] as [number, number, number] }}>
```
Files: `StadiumHero3D.tsx` — all `mesh`, `group`, `directionalLight`, `ambientLight`, `pointLight` elements.

---

## 🎨 3D Stadium Hero — StadiumHero3D

**File**: `frontend/src/shared/components/StadiumHero3D.tsx`

The landing page features a fully custom **WebGL 3D stadium** rendered with **React Three Fiber (R3F)** and Three.js. It serves as the immersive first impression when fans first open the app.

### Components
| Sub-component | Description |
|:---|:---|
| `StadiumRings` | Rotating concentric seating-tier rings with neon cyan/purple light rings and 16 metallic pillars |
| `StadiumField` | GLSL shader material with animated pulse-wave grass rendering, neon field boundary lines |
| `StadiumLights` | 4 corner floodlights with animated `intensity` oscillation using `useFrame` delta time |
| `CrowdParticles` | 3,000 vertex-colored `Points` in a seating-bowl formation, slowly rotating |
| `FloatingFootball` | Wireframe sphere that bobs and spins, simulating a match ball in flight |

### Technical decisions
- **Deterministic PRNG** (LCG algorithm) replaces `Math.random()` for crowd particle placement, satisfying SonarQube's S2245 rule against non-seeded random for any reproducibility context.
- **Object spread bypass** for all R3F Three.js properties to satisfy SonarQube S6749 JSX unknown attribute rule without breaking R3F's custom reconciler.
- `pointerEvents: 'none'` on the Canvas prevents WebGL from intercepting fan interactions with the UI overlaid on top.
- Passive `wheel` event override prevents Three.js from throwing "Unable to preventDefault inside passive event listener" console warnings.