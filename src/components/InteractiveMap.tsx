import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, Crosshair, Layers, Satellite, Map as MapIcon } from 'lucide-react';

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
  interactive?: boolean;
  className?: string;
  zoom?: number;
}

// 100% Free tile providers without any API key or watermarks
const TILE_LAYERS = {
  // Dark mode styled OpenStreetMap (no watermarks, 100% free)
  dark: {
    name: 'Tmavá',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      className: 'leaflet-dark-tiles',
    },
  },
  // High-res satellite imagery from Esri (free, no API key, perfect for finding dead drops)
  satellite: {
    name: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      className: '',
    },
  },
  // Standard OpenStreetMap
  streets: {
    name: 'Ulice',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      className: '',
    },
  },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  interactive = false,
  className = 'h-72 w-full',
  zoom = 16,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activeLayerType, setActiveLayerType] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Custom marker icon with tactical emerald glow
  const createCustomIcon = (isInteractive: boolean) => {
    return L.divIcon({
      className: 'custom-drop-pin',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 26px; height: 26px; background: #10b981; border: 3px solid #09090b; border-radius: 50%; box-shadow: 0 0 16px rgba(16,185,129,0.9); display: flex; align-items: center; justify-content: center; cursor: ${isInteractive ? 'grab' : 'pointer'};">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const applyTileLayer = (map: L.Map, layerType: 'dark' | 'satellite' | 'streets') => {
    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }
    const layerConfig = TILE_LAYERS[layerType];
    const newLayer = L.tileLayer(layerConfig.url, layerConfig.options).addTo(map);
    currentTileLayerRef.current = newLayer;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      applyTileLayer(map, activeLayerType);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const marker = L.marker([latitude, longitude], {
        icon: createCustomIcon(interactive),
        draggable: interactive,
      }).addTo(map);

      if (interactive && onLocationChange) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onLocationChange(pos.lat, pos.lng);
        });

        map.on('click', (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          onLocationChange(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      if (marker) {
        marker.setLatLng([latitude, longitude]);
      }
      map.panTo([latitude, longitude]);
    }

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [interactive]);

  // Handle switching layer types (dark vs satellite vs streets)
  const handleLayerSwitch = (type: 'dark' | 'satellite' | 'streets') => {
    setActiveLayerType(type);
    if (mapInstanceRef.current) {
      applyTileLayer(mapInstanceRef.current, type);
    }
  };

  // Synchronize coordinates when props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.00001 || Math.abs(currentPos.lng - longitude) > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Váš prohlížeč nepodporuje geolokaci.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsLoading(false);
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 17);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Přístup k poloze byl zamítnut. Zvolte polohu manuálně kliknutím do mapy.');
        } else {
          setGpsError('Nepodařilo se zaměřit polohu. Zvolte místo kliknutím na mapu.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 17);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
      {/* Map canvas container */}
      <div ref={mapContainerRef} className={className} />

      {/* Control overlay: top right */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Layer Switcher: Dark, Satellite, Streets */}
        <div className="flex items-center bg-zinc-950/90 border border-zinc-800 rounded-lg p-0.5 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => handleLayerSwitch('dark')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition ${
              activeLayerType === 'dark'
                ? 'bg-zinc-800 text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Tmavá taktická mapa"
          >
            Tmavá
          </button>
          <button
            type="button"
            onClick={() => handleLayerSwitch('satellite')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition flex items-center gap-1 ${
              activeLayerType === 'satellite'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Reálné satelitní snímky"
          >
            <Satellite className="w-3 h-3" />
            <span>Satelit</span>
          </button>
          <button
            type="button"
            onClick={() => handleLayerSwitch('streets')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition ${
              activeLayerType === 'streets'
                ? 'bg-zinc-800 text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Běžná mapa"
          >
            Ulice
          </button>
        </div>

        {/* GPS location button */}
        {interactive && (
          <button
            id="map-gps-btn"
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 backdrop-blur-md text-xs font-mono font-medium transition shadow-lg hover:shadow-emerald-950/40 disabled:opacity-50"
            title="Zaměřit moji polohu"
          >
            <Locate className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Zaměřuji...' : 'GPS Poloha'}</span>
          </button>
        )}

        {/* Recenter button */}
        <button
          id="map-recenter-btn"
          type="button"
          onClick={handleCenter}
          className="self-end p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50 backdrop-blur-md transition shadow-md"
          title="Vycentrovat na úschovu"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {interactive && (
        <div className="absolute bottom-3 left-3 z-[1000] px-2.5 py-1 rounded-md bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Klikněte do mapy nebo přetáhněte bod</span>
        </div>
      )}

      {gpsError && (
        <div className="absolute top-3 left-3 right-3 z-[1000] p-2 bg-amber-950/90 border border-amber-800/80 rounded-lg text-amber-200 text-xs flex items-center justify-between">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-amber-300 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}
    </div>
  );
};
