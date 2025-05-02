import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { createCategoryIcon } from '../utils/mapConfig';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useColorMode, useColorModeValue } from '@chakra-ui/react';

// Corrigir os ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  onLocationSelect?: (location: [number, number]) => void;
  selectedLocation?: [number, number] | null;
  categoria?: string;
  isTracking?: boolean;
  className?: string;
}

export function Map({
  center,
  zoom = 14,
  onLocationSelect,
  selectedLocation,
  categoria = 'outros',
  isTracking = false,
  className = ''
}: MapProps) {
  const { colorMode } = useColorMode();
  
  // Usar um estilo de mapa diferente com base no tema
  const tileUrl = useColorModeValue(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  );

  useEffect(() => {
    if (selectedLocation) {
      // Você pode adicionar lógica aqui para centralizar o mapa na localização selecionada
    }
  }, [selectedLocation]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`${className} map-container ${colorMode === 'dark' ? 'dark-map' : 'light-map'}`}
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '8px',
        zIndex: 0
      }}
      zoomControl={false}
      attributionControl={true}
      scrollWheelZoom={true}
      dragging={true}
      doubleClickZoom={true}
      touchZoom={true}
    >
      <TileLayer
        url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <div className={`custom-attribution ${colorMode === 'dark' ? 'dark-attribution' : ''}`}>
        <div className="leaflet-control-attribution leaflet-control">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
        </div>
      </div>
      <ZoomControl position="bottomright" />
      {selectedLocation && (
        <LocationMarker
          position={selectedLocation}
          categoria={categoria}
          onLocationSelect={onLocationSelect}
          isTracking={isTracking}
        />
      )}
      {selectedLocation && <CenterMapOnLocation position={selectedLocation} />}
      {!selectedLocation && onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}
    </MapContainer>
  );
}

function LocationMarker({
  position,
  categoria,
  onLocationSelect,
  isTracking
}: {
  position: [number, number];
  categoria: string;
  onLocationSelect?: (location: [number, number]) => void;
  isTracking: boolean;
}) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (onLocationSelect) {
        onLocationSelect([lat, lng]);
      }
    },
  });

  useEffect(() => {
    if (position && isTracking) {
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: 1
      });
    }
  }, [position, isTracking, map]);

  return (
    <Marker
      position={position}
      icon={createCategoryIcon(categoria)}
    />
  );
}

function CenterMapOnLocation({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), {
      animate: true,
      duration: 1
    });
  }, [position, map]);

  return null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (location: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect([lat, lng]);
    },
  });
  
  return null;
}