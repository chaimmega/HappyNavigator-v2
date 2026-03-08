import { NavigateResponse } from "@/types/navigation";

export const mockResponse: NavigateResponse = {
  routes: [
    {
      id: 0,
      geometry: [
        [-73.9654, 40.7829], [-73.966, 40.78], [-73.968, 40.775],
        [-73.97, 40.77], [-73.975, 40.765], [-73.98, 40.76],
        [-73.985, 40.75], [-73.99, 40.74], [-73.992, 40.73],
        [-73.994, 40.72], [-73.996, 40.71], [-73.9969, 40.7061],
      ],
      distance: 10142,
      duration: 1920,
      signals: {
        parkCount: 12, waterfrontCount: 8, scenicRoadCount: 5,
        greenCount: 34, litCount: 48, lowTrafficCount: 18,
        constructionCount: 0, restStopCount: 4, viewpointCount: 3,
        highwayCount: 0, partial: false,
      },
      happyScore: 79,
      scoreBreakdown: {
        parks: 20, scenicRoads: 15, waterfront: 12, green: 10,
        lit: 5, lowTraffic: 12, restStops: 3, viewpoints: 5,
        base: 5, construction: 0, elevation: 0, highway: 0,
      },
      elevationGainM: 170,
      elevationPoints: [12, 15, 18, 22, 30, 45, 38, 25, 18, 10, 8, 5],
    },
    {
      id: 1,
      geometry: [
        [-73.9654, 40.7829], [-73.967, 40.781], [-73.969, 40.776],
        [-73.972, 40.771], [-73.976, 40.766], [-73.981, 40.758],
        [-73.986, 40.748], [-73.991, 40.738], [-73.993, 40.728],
        [-73.995, 40.718], [-73.9965, 40.71], [-73.9969, 40.7061],
      ],
      distance: 9817,
      duration: 1680,
      signals: {
        parkCount: 8, waterfrontCount: 3, scenicRoadCount: 2,
        greenCount: 22, litCount: 52, lowTrafficCount: 10,
        constructionCount: 1, restStopCount: 2, viewpointCount: 1,
        highwayCount: 3, partial: false,
      },
      happyScore: 62,
      scoreBreakdown: {
        parks: 15, scenicRoads: 8, waterfront: 5, green: 8,
        lit: 5, lowTraffic: 8, restStops: 2, viewpoints: 2,
        base: 5, construction: -3, elevation: 0, highway: -5,
      },
      elevationGainM: 243,
      elevationPoints: [12, 20, 35, 50, 70, 55, 40, 30, 20, 12, 8, 5],
    },
  ],
  bestRouteId: 0,
  explanation: {
    bestRouteId: 0,
    bullets: [
      "Route A follows scenic waterfront roads along the Hudson with gorgeous river views and minimal highway stretches",
      "12 parks and 34 green spaces line the route, keeping the drive shaded and pleasant throughout",
      "18 low-traffic segments make for a relaxed, stress-free driving experience — perfect for unwinding after work",
    ],
    suggestedStops: [
      "Riverside Park Overlook — scenic pullover with panoramic Hudson River views",
      "Hudson River Greenway Café — cozy waterfront rest stop with coffee and snacks",
    ],
  },
  startCoords: { lat: 40.7829, lng: -73.9654 },
  endCoords: { lat: 40.7061, lng: -73.9969 },
  startName: "Central Park, New York",
  endName: "Brooklyn Bridge, New York",
};
