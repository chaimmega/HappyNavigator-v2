

# Rebrand Happy Navigator for Car Driving

The app currently uses canoe/paddling terminology and signals throughout. Here's the plan to rebrand it for scenic car driving routes.

## 1. Generate New Logo
- Replace canoe logo with a car-on-scenic-road themed logo using AI image generation

## 2. Update Types (`src/types/navigation.ts`)

Replace `HappinessSignals` fields:
- `waterwayCount` → `scenicRoadCount`
- `calmWaterCount` → `lowTrafficCount`  
- `launchCount` → `restStopCount`
- `portageCount` → `viewpointCount`
- `motorBoatCount` → `highwayCount` (penalty)
- `rapidCount` → `constructionCount` (penalty)
- Keep: `parkCount`, `waterCount` (rename to `waterfrontCount`), `greenCount`, `litCount`

Update `ScoreBreakdown` keys to match. Remove `estimateCalories`, keep `estimateCO2Saved`.

## 3. Update Component Copy

**`SearchForm.tsx`**: "Put-in location (start)" → "Starting point", "Take-out location (end)" → "Destination"

**`LoadingSteps.tsx`**: Replace canoe steps with driving ones:
- 📍 Geocoding your locations…
- 🚗 Fetching driving route alternatives…
- 🌿 Scanning scenic roads, parks & points of interest…
- ✨ AI finding happiest route…

**`Header.tsx`**: Subtitle → "Discover calmer, greener, more enjoyable drives"

**`Index.tsx` MapPlaceholder**: 🛶 → 🚗, update text to "Enter start and destination to discover the happiest driving route"

## 4. Update RouteCard Signal Chips & Breakdown
Replace signal chip definitions and score breakdown segment labels to match new driving signals (scenic roads, viewpoints, low traffic, rest stops, waterfronts, etc.)

## 5. Update Mock Data (`src/data/mockData.ts`)
- New signal counts for driving context
- AI bullets about scenic roads, low traffic, waterfront views
- Suggested stops: scenic overlooks, rest areas, cafes

## 6. Update AISummaryCard
No structural changes needed — just receives different bullet text from mock data.

