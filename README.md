# Happy Navigator

**Find the happiest driving route, not just the fastest one.**

Happy Navigator is a car-driving route app that finds more enjoyable routes between two places. Instead of optimizing purely for speed, it scores alternative routes on scenic roads, calmer traffic, greenery, waterfronts, and pleasant surroundings — then uses AI to recommend the best one.

---

## How It Works

1. **Enter start and destination** using Google Places autocomplete, GPS, or by clicking the map
2. **Google Directions API** fetches up to 3 alternative driving routes
3. **OpenStreetMap data** (via Overpass API) scans each route for parks, waterfront, scenic roads, viewpoints, rest stops, green spaces, and more
4. **Elevation data** (via OpenTopoData) profiles the terrain along each route
5. **Happy Score (0–100)** is computed from all signals, normalized per km
6. **Claude AI** analyzes the scored routes and recommends the happiest one with a human-readable explanation
7. **Results display** on an interactive Google Map with a detailed sidebar showing scores, breakdowns, and suggested stops

---

## Features

- **Happy Score** — Each route gets a 0–100 score based on 8 positive factors and 3 penalty factors
- **AI Route Recommendation** — Claude AI picks the best route and explains why with specific data points
- **Interactive Google Map** — Color-coded route polylines, click to select, start/end markers
- **Score Breakdown** — Visual stacked bar showing contribution from each category (parks, scenic roads, waterfront, etc.)
- **Elevation Profile** — Interactive SVG chart showing terrain along the selected route
- **Suggested Stops** — Google Places nearby search finds interesting stops along the route (parks, cafes, viewpoints)
- **Open in Google Maps** — One-click to open any route in Google Maps with waypoints for turn-by-turn navigation
- **Export GPX** — Download the route as a GPX file for GPS devices
- **Fuel Cost Estimate** — Estimated fuel cost at 30 MPG / $3.80 per gallon
- **Stress Score** — "Very Calm", "Moderate", or "Stressful" based on highway and construction penalties
- **Pin Mode** — Click the map to set start or end location
- **Recent Searches** — Quick access to your last 5 searches (stored in localStorage)
- **Shareable URLs** — Route coordinates in the URL for easy sharing
- **Metric / Imperial Toggle** — Switch between km and mi
- **Responsive Layout** — Resizable sidebar on desktop, stacked layout on mobile

---

## Happy Score Breakdown

Routes are scored 0–100 using signals from OpenStreetMap, normalized per km of route distance.

### Positive Factors

| Factor | Max Points | What It Measures |
|--------|-----------|------------------|
| Parks | +30 | Parks and gardens along the route |
| Scenic Roads | +25 | Viewpoints, tourism attractions, scenic-tagged roads |
| Waterfront | +20 | Rivers, lakes, coastline — scenic water views |
| Green Spaces | +15 | Forests, meadows, grasslands |
| Low Traffic | +15 | Quiet residential and living streets |
| Well-Lit | +10 | Roads with street lighting |
| Viewpoints | +10 | Tourism viewpoints and attractions |
| Rest Stops | +8 | Cafes, restaurants, fuel stations, rest areas, EV charging |
| Base | +5 | Every routable path starts with 5 points |

### Penalties

| Factor | Max Penalty | What It Penalizes |
|--------|------------|-------------------|
| Construction | -15 | Active construction zones |
| Elevation | -15 | Steep, hilly terrain |
| Highway | -12 | Motorways and trunk roads (boring, stressful) |

All signal counts are normalized per km so routes of different lengths are compared fairly. If OSM data is incomplete (Overpass timeout), a 15% confidence penalty is applied.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Express (TypeScript), runs on port 3006 |
| Maps | Google Maps JavaScript API, Geocoding, Directions, Places |
| Scoring | OpenStreetMap Overpass API (25 sample points, 300m corridor) |
| Elevation | OpenTopoData SRTM 30m (50-point elevation profile) |
| AI | Anthropic Claude Haiku — route recommendation and explanation |

---

## Architecture

```
Browser (React SPA on port 8080)
  │
  ├─ Google Places Autocomplete (address input)
  ├─ Google Maps (route visualization)
  │
  └─ POST /api/navigate ──► Express Backend (port 3006)
       │
       ├─ 1. Geocode (Google Geocoding API)
       ├─ 2. Fetch routes (Google Directions API, mode: driving)
       ├─ 3. Score routes (Overpass API + OpenTopoData, parallel)
       ├─ 4. AI recommendation (Claude Haiku)
       └─ 5. Return scored routes + explanation

  GET /api/reverse ──► Reverse geocode for map pin clicks
```

The Vite dev server proxies `/api` requests to the Express backend on port 3006.

---

## Setup

### Prerequisites

- Node.js 18+
- A [Google Cloud](https://console.cloud.google.com/) project with these APIs enabled:
  - Maps JavaScript API
  - Geocoding API
  - Directions API
  - Places API
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

### Installation

```bash
git clone https://github.com/chaimmega/HappyNavigator-v2.git
cd HappyNavigator-v2
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

This starts both the frontend (port 8080) and backend (port 3006) concurrently.

Open **http://localhost:8080** in your browser.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (used by the browser for maps, autocomplete, places) |
| `GOOGLE_MAPS_SERVER_KEY` | No | Optional separate server-side key with IP restrictions (falls back to `VITE` key) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude AI route recommendations |
| `PORT` | No | Backend port (default: 3006) |

---

## API Endpoints

### `POST /api/navigate`

Find and score driving routes between two locations.

**Request:**
```json
{
  "start": "Times Square, New York",
  "end": "Central Park, New York",
  "startCoords": { "lat": 40.758, "lng": -73.9855 },
  "endCoords": { "lat": 40.7829, "lng": -73.9654 },
  "via": { "text": "Madison Square Garden", "coords": { "lat": 40.7505, "lng": -73.9934 } }
}
```

**Response:**
```json
{
  "routes": [
    {
      "id": 0,
      "geometry": [[lng, lat], ...],
      "distance": 5118,
      "duration": 1158,
      "happyScore": 69,
      "signals": { "parkCount": 44, "waterfrontCount": 3, ... },
      "scoreBreakdown": { "parks": 30, "scenicRoads": 2, ... },
      "elevationGainM": 93,
      "elevationPoints": [42, 42, 41, ...]
    }
  ],
  "bestRouteId": 0,
  "explanation": {
    "bestRouteId": 0,
    "bullets": ["Route A has 44 parks and zero construction zones..."],
    "suggestedStops": ["Central Park South — scenic viewpoint"]
  },
  "startCoords": { "lat": 40.758, "lng": -73.9855 },
  "endCoords": { "lat": 40.7829, "lng": -73.9654 },
  "startName": "Times Square, New York",
  "endName": "Central Park, New York"
}
```

### `GET /api/reverse?lat=40.7&lng=-74.0`

Reverse geocode coordinates to a place name. Used for map pin clicks.

---

## Project Structure

```
HappyNavigator-v2/
├── server/                     # Express backend
│   ├── index.ts                # API server (routes, AI, rate limiting)
│   └── lib/
│       ├── happiness.ts        # Happy Score computation (weights, formula)
│       ├── overpass.ts         # OSM Overpass queries (25 samples, 300m corridor)
│       ├── osrm.ts             # Google Directions API client (driving mode)
│       ├── nominatim.ts        # Google Geocoding client (forward + reverse)
│       ├── elevation.ts        # OpenTopoData elevation profiling
│       ├── lruCache.ts         # In-memory LRU cache with TTL
│       ├── parseGoogleMapsUrl.ts # Google Maps URL parser
│       └── types.ts            # Shared TypeScript types
├── src/                        # React frontend
│   ├── pages/
│   │   └── Index.tsx           # Main page (search, results, map layout)
│   ├── components/
│   │   ├── SearchForm.tsx      # Address inputs, GPS, swap, via-point
│   │   ├── PlaceAutocomplete.tsx # Google Places autocomplete dropdown
│   │   ├── MapView.tsx         # Google Maps with route polylines
│   │   ├── RouteCard.tsx       # Route details, score breakdown, actions
│   │   ├── HappyScore.tsx      # Circular score badge (0–100)
│   │   ├── ElevationChart.tsx  # Interactive SVG elevation profile
│   │   ├── AISummaryCard.tsx   # AI explanation and suggested stops
│   │   ├── SuggestedStops.tsx  # Google Places nearby search for POIs
│   │   ├── Header.tsx          # App header with branding and controls
│   │   ├── LoadingSteps.tsx    # Animated loading progress
│   │   └── GoogleMapsProvider.tsx # Google Maps API loader context
│   └── types/
│       └── navigation.ts      # Frontend type definitions
├── .env.example                # Environment variable template
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite config (proxy, aliases)
└── tailwind.config.ts          # Tailwind CSS config (theme, colors)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:client` | Start Vite frontend only |
| `npm run dev:server` | Start Express backend only |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |

---

## Rate Limiting

The backend includes in-memory rate limiting: **10 requests per minute per IP**. Localhost is exempt during development. Stale entries are pruned every 5 minutes.

## Caching

- **Geocoding results**: LRU cache, 500 entries, 24-hour TTL
- **Driving routes**: LRU cache, 200 entries, 2-hour TTL
- **HTTP responses**: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`

---

## License

MIT
