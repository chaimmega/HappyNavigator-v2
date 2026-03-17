# Happy Navigator

A car-driving route app that finds more enjoyable driving routes — prioritizing scenic roads, calmer traffic, greenery, waterfronts, and pleasant surroundings.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys
2. `npm install`
3. `npm run dev` — starts both the Vite frontend (port 8080) and Express backend (port 3006)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps key with Geocoding, Directions, Places APIs |
| `GOOGLE_MAPS_SERVER_KEY` | No | Optional separate server-side key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic key for AI route explanation |
| `PORT` | No | Backend port (default 3006) |

## Architecture

- **Frontend**: React + Vite on port 8080, proxies `/api` to the backend
- **Backend**: Express on port 3006
  - `POST /api/navigate` — geocodes, fetches routes, scores them, calls AI
  - `GET /api/reverse` — reverse geocode a lat/lng to a place name
- **Scoring**: Routes are scored 0–100 using OpenStreetMap data (via Overpass API) for parks, waterfront, scenic roads, green spaces, low traffic, and penalized for construction, highways, and steep elevation
