import { useLoadScript, Libraries } from "@react-google-maps/api";
import { createContext, useContext } from "react";

const LIBRARIES: Libraries = ["places"];

const GoogleMapsContext = createContext(false);

export function useGoogleMapsLoaded() {
  return useContext(GoogleMapsContext);
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive text-sm p-8 text-center">
        Failed to load Google Maps. Check your API key and network connection.
      </div>
    );
  }

  return (
    <GoogleMapsContext.Provider value={isLoaded}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
