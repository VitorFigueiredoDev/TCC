import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Image,
  Card,
  CardBody,
  useMediaQuery
} from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RelatosService } from '../services/relatosService';

// Interfaces de tipos de dados
interface Endereco {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface Problema {
  id: string;
  titulo: string;
  descricao: string;
  foto?: string;
  tipo: 'buraco' | 'iluminacao' | 'lixo' | 'calcada' | string;
  status?: string;
  latitude?: number | string;
  longitude?: number | string;
  coordenadas?:
    | { latitude: number | string; longitude: number | string }
    | [number | string, number | string];
  endereco?: Endereco;
}

// Configurar o ícone padrão do Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
// Safely delete _getIconUrl if it exists
if ('_getIconUrl' in L.Icon.Default.prototype) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl });

// Ícone para marcador selecionado
const SelectedIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Cria ícones coloridos para problemas
const createColoredIcon = (color: string) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });

const tipoIcons: Record<string, L.DivIcon> = {
  buraco: createColoredIcon('#FF4444'),
  iluminacao: createColoredIcon('#FFD700'),
  lixo: createColoredIcon('#8B4513'),
  calcada: createColoredIcon('#4169E1'),
  default: createColoredIcon('#808080')
};

const DEFAULT_CENTER: [number, number] = [-18.9113, -48.2622];

// Validação de coordenadas
const isValidCoordinate = (lat: number, lng: number) =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

// Formata coordenadas de diferentes formatos
const formatarCoordenadas = (p: Problema): [number, number] | null => {
  if ('coordenadas' in p && p.coordenadas && !Array.isArray(p.coordenadas)) {
    const { latitude, longitude } = p.coordenadas;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) return [lat, lng];
  }
  if (p.latitude !== undefined && p.longitude !== undefined) {
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) return [lat, lng];
  }
  if (Array.isArray(p.coordenadas) && p.coordenadas.length === 2) {
    const [a, b] = p.coordenadas;
    const lat = Number(a);
    const lng = Number(b);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) return [lat, lng];
  }
  return null;
};

// Componente para atualizar view e adicionar marcador de usuário
function MapView({
  center,
  userLocation
}: {
  center: [number, number];
  userLocation?: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (center && isValidCoordinate(center[0], center[1])) {
      map.setView(center, map.getZoom() || 15, { animate: true, duration: 1 });
    }
  }, [center, map]);

  useEffect(() => {
    let marker: L.Marker;
    if (userLocation && isValidCoordinate(userLocation[0], userLocation[1])) {
      // Ícone de localização do usuário mais indicativo
      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `<div style="font-size:24px; color:#3182CE; transform:translate(-50%, -50%);">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      marker = L.marker(userLocation, {
        icon: userIcon,
        zIndexOffset: 2000
      }).addTo(map);
      marker.bindPopup('<strong>Você está aqui</strong>', {
        autoClose: false,
        closeOnClick: false,
        offset: [0, -12]
      });
    }
    return () => {
      if (marker) map.removeLayer(marker);
    };
  }, [userLocation, map]);

  return null;
}

const Mapa: React.FC = () => {
  const location = useLocation();
  const selectedProblem = location.state?.selectedProblem;
  const [mapPosition, setMapPosition] =
    useState<[number, number]>(DEFAULT_CENTER);
  const [todosProblemas, setTodosProblemas] = useState<Problema[]>([]);
  const [selectedMarker, setSelectedMarker] =
    useState<Problema | null>(null);
  const [isMobile] = useMediaQuery('(max-width: 48em)');
  const [userLocation, setUserLocation] =
    useState<[number, number] | undefined>(undefined);

  // Busca localização do usuário (não centraliza se houver problem selecionado)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc: [number, number] = [
          coords.latitude,
          coords.longitude
        ];
        setUserLocation(loc);
        if (!selectedProblem) setMapPosition(loc);
      },
      err =>
        console.warn('Não foi possível obter localização', err)
    );
  }, []);

  // Carrega problemas
  useEffect(() => {
    RelatosService.listarRelatos()
      .then(setTodosProblemas)
      .catch(err =>
        console.error('Erro ao carregar relatos', err)
      );
  }, []);

  // Centraliza marcador selecionado
  useEffect(() => {
    if (selectedProblem) {
      const coords = formatarCoordenadas(selectedProblem);
      if (coords) {
        setMapPosition(coords);
        setSelectedMarker(selectedProblem);
      }
    }
  }, [selectedProblem]);

  // Card de detalhes (usado dentro do Popup e no mobile)
  const ProblemaCard: React.FC<{ problema: Problema }> = ({
    problema
  }) => (
    <Card boxShadow="lg" borderWidth={0} borderRadius="md">
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">{problema.titulo}</Heading>
          {problema.foto && (
            <Image
              src={problema.foto}
              alt={problema.titulo}
              borderRadius="md"
              objectFit="cover"
              maxH="200px"
              w="100%"
            />
          )}
          <Text fontSize="sm" noOfLines={3}>
            {problema.descricao}
          </Text>
          <HStack spacing={2}>
            <Badge>
              {problema.tipo.charAt(0).toUpperCase() + problema.tipo.slice(1)}
            </Badge>
            {problema.status && (
              <Badge colorScheme="green">
                {problema.status}
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" noOfLines={2}>
            {[
              problema.endereco?.rua,
              problema.endereco?.numero,
              problema.endereco?.bairro,
              problema.endereco?.cidade &&
              problema.endereco?.estado
                ? `${problema.endereco.cidade}-${problema.endereco.estado}`
                : undefined
            ]
              .filter(Boolean)
              .join(', ')}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Container
      maxW="container.xl"
      py={{ base: 4, md: 8 }}
      mt={{ base: '60px', md: '64px' }}
    >
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Heading size={{ base: 'lg', md: 'xl' }}>
          Mapa de Problemas
        </Heading>
        {/* {userLocation && (
          <Text fontSize="sm" color="gray.600">
            Localização encontrada e mapa centralizado.
          </Text>
        )} */}

        {/* Legenda */}
        <Box
          overflowX="auto"
          pb={2}
          sx={{
            '&::-webkit-scrollbar': {
              height: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.05)'
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }
          }}
        >
          <HStack spacing={{ base: 3, md: 4 }} minW="fit-content" p={2}>
            <Text
              fontWeight="medium"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Tipos de Problemas:
            </Text>
            {Object.entries({
              buraco: '#FF4444',
              iluminacao: '#FFD700',
              lixo: '#8B4513',
              calcada: '#4169E1'
            }).map(([tipo, cor]) => (
              <HStack key={tipo} spacing={2}>
                <Box
                  w={{ base: '12px', md: '16px' }}
                  h={{ base: '12px', md: '16px' }}
                  borderRadius="50%"
                  bg={cor}
                  border="2px solid white"
                  boxShadow="0 0 4px rgba(0,0,0,0.5)"
                />
                <Text fontSize={{ base: 'sm', md: 'md' }}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </HStack>
            ))}
          </HStack>
        </Box>

        {/* Mapa */}
        <Box
          height={{ base: '400px', md: '600px' }}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          overflow="hidden"
          position="relative"
        >
          <MapContainer
            center={mapPosition}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <MapView center={mapPosition} userLocation={userLocation} />

            {/* Marcadores */}
            {todosProblemas.map(p => {
              const coords = formatarCoordenadas(p);
              if (!coords || selectedProblem?.id === p.id) return null;
              return (
                <Marker
                  key={p.id}
                  position={coords}
                  icon={tipoIcons[p.tipo] || tipoIcons.default}
                  eventHandlers={{ click: () => setSelectedMarker(p) }}
                >
                  {!isMobile && (
                    <Popup>
                      <ProblemaCard problema={p} />
                    </Popup>
                  )}
                </Marker>
              );
            })}

            {/* Marcador selecionado */}
            {selectedMarker && (() => {
              const coords = formatarCoordenadas(selectedMarker)!;
              return (
                <Marker
                  key={selectedMarker.id}
                  position={coords}
                  icon={SelectedIcon}
                  zIndexOffset={1000}
                  eventHandlers={{ click: () => setSelectedMarker(selectedMarker
                  ) }}
                  >
                    {!isMobile && (
                      <Popup>
                        <ProblemaCard problema={selectedMarker} />
                      </Popup>
                    )}
                  </Marker>
                );
              })()}
            </MapContainer>
          </Box>
  
          {/* Card em modo mobile (fora do mapa) */}
          {isMobile && selectedMarker && (
            <Box mt={4}>
              <ProblemaCard problema={selectedMarker} />
            </Box>
          )}
        </VStack>
      </Container>
    );
  };
  
  export default Mapa;
  