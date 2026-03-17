import { useLoadScript, Libraries } from "@react-google-maps/api";
import { createContext, useContext } from "react";

const LIBRARIES: Libraries = ["places"];

const GoogleMapsContext = createContext(false);

export function useGoogleMapsLoaded() {
  return useContext(GoogleMapsContext);
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  return (
    <GoogleMapsContext.Provider value={isLoaded}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
