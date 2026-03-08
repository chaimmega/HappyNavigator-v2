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
      duration: 8520,
      signals: {
        parkCount: 574, waterCount: 35, waterwayCount: 3,
        greenCount: 226, litCount: 1617, calmWaterCount: 32,
        rapidCount: 0, launchCount: 4, portageCount: 0,
        motorBoatCount: 0, partial: false,
      },
      happyScore: 79,
      scoreBreakdown: {
        parks: 30, waterways: 3, water: 20, green: 15,
        lit: 10, calmWater: 15, launch: 1, portage: 0,
        base: 5, rapids: 0, elevation: 20, motorBoat: 0,
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
      duration: 8340,
      signals: {
        parkCount: 551, waterCount: 31, waterwayCount: 0,
        greenCount: 196, litCount: 1664, calmWaterCount: 31,
        rapidCount: 0, launchCount: 0, portageCount: 0,
        motorBoatCount: 0, partial: false,
      },
      happyScore: 75,
      scoreBreakdown: {
        parks: 30, waterways: 0, water: 20, green: 15,
        lit: 10, calmWater: 15, launch: 0, portage: 0,
        base: 5, rapids: 0, elevation: 20, motorBoat: 0,
      },
      elevationGainM: 243,
      elevationPoints: [12, 20, 35, 50, 70, 55, 40, 30, 20, 12, 8, 5],
    },
  ],
  bestRouteId: 0,
  explanation: {
    bestRouteId: 0,
    bullets: [
      "Route A follows the Hudson River shoreline with excellent waterway access and 4 boat launches for easy put-in/take-out options",
      "574 parks and green spaces line the banks, providing scenic rest stops and abundant shade",
      "32 calm water sections make for relaxed paddling — perfect for beginners or a leisurely afternoon trip",
    ],
    suggestedStops: [
      "Riverside Park — scenic bank-side picnic area with kayak launch",
      "Pier 84 at Hudson River Park — popular kayak launch with stunning Manhattan skyline views",
    ],
  },
  startCoords: { lat: 40.7829, lng: -73.9654 },
  endCoords: { lat: 40.7061, lng: -73.9969 },
  startName: "Central Park, New York",
  endName: "Brooklyn Bridge, New York",
};
