import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

// OpenFreeMap serves OpenStreetMap tiles with no API key.
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const AUSTIN: [number, number] = [-97.7431, 30.2672];

export function MapView() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      center: AUSTIN,
      zoom: 7,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    new maplibregl.Marker().setLngLat(AUSTIN).setPopup(new maplibregl.Popup().setText("Austin")).addTo(map);
    return () => map.remove();
  }, []);

  return <div ref={container} className="map" />;
}
