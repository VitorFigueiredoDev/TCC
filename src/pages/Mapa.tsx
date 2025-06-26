import React, { useEffect, useState, useRef } from 'react';
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
  useMediaQuery,
  Skeleton,
  IconButton,
  Tooltip,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Button
} from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RelatosService } from '../services/relatosService';
import { FaEye, FaMapMarkerAlt, FaClock, FaCheckCircle, FaHourglassHalf, FaFlag } from 'react-icons/fa';

// Constants
const MAP_TIPO_TO_IMG: Record<string, string> = {
  buraco: '/imagens/Buraco na Via.jpg',
  iluminacao: '/imagens/Problema de Iluminação.jpg',
  lixo: '/imagens/Descarte irregular de Lixo.jpg',
  calcada: '/imagens/Calçada Danificada.jpg',
  sinalizacao: '/imagens/problema sinlizaçao.jpg',
  outros: '/imagens/Outros.jpg',
};

const genericProblemSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f0f0f0"/>
  <text x="50" y="50" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dominant-baseline="middle">
    Sem imagem
  </text>
</svg>
`;

// Helper functions
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'resolvido':
      return 'green';
    case 'em_andamento':
      return 'yellow';
    case 'pendente':
      return 'red';
    case 'aguardando':
      return 'blue';
    default:
      return 'gray';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'resolvido':
      return FaCheckCircle;
    case 'em_andamento':
      return FaHourglassHalf;
    case 'pendente':
      return FaFlag;
    case 'aguardando':
      return FaClock;
    default:
      return FaFlag;
  }
};

// Interfaces
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
  tipo?: string;
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

if ('_getIconUrl' in L.Icon.Default.prototype) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl });

// Ícone para marcador padrão
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícone para marcador selecionado
const SelectedIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -34],
  shadowSize: [57, 57]
});

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
      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `<div style="font-size:24px; color:#3182CE; transform:translate(-50%, -50%);">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      marker = L.marker(userLocation, {
        icon: userIcon,
        zIndexOffset: 2000,
        interactive: false
      }).addTo(map);
      marker.bindPopup('<strong>Sua localização</strong>', {
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

// Cores para os status
const statusColors = {
  'resolvido': '#48BB78', // verde
  'em_andamento': '#ECC94B', // amarelo
  'pendente': '#F56565' // vermelho
};

// Função para normalizar o status
const normalizeStatus = (status: string): string => {
  if (!status) return 'pendente';
  const normalized = status.toLowerCase().trim();
  // Corrige o status "em andamento"
  if (normalized === 'em andamento') return 'em_andamento';
  return normalized;
};

// Cria ícones coloridos para status com melhor visual
const createStatusIcon = (status: string, count: number = 1) => {
  const normalizedStatus = normalizeStatus(status);
  const color = statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.pendente;
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        position: relative;
      ">
        ${normalizedStatus.charAt(0).toUpperCase()}
        ${count > 1 ? `
          <div style="
            position: absolute;
            bottom: -5px;
            right: -5px;
            background-color: white;
            color: ${color};
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            border: 2px solid ${color};
            font-weight: bold;
          ">
            ${count}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Configuração do cluster
const clusterOptions = {
  maxClusterRadius: 50,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: true,
  chunkedLoading: true,
  iconCreateFunction: (cluster: any) => {
    const count = cluster.getChildCount();
    const problems = cluster.getAllChildMarkers();
    const statusCounts = problems.reduce((acc: any, marker: any) => {
      const status = marker.options.status?.toLowerCase() || 'default';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Cria um ícone de cluster personalizado
    return L.divIcon({
      html: `
        <div style="
          background-color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #3182CE;
          box-shadow: 0 0 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #2D3748;
            font-size: 14px;
          ">
            ${count}
          </div>
          <div style="
            position: absolute;
            bottom: -5px;
            right: -5px;
            background-color: #3182CE;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            border: 2px solid white;
          ">
            ${Object.keys(statusCounts).length}
          </div>
        </div>
      `,
      className: 'custom-cluster-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }
};

// Função para calcular distância entre dois pontos (Haversine)
const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Função para agrupar problemas por proximidade e status
function groupProblemsByProximity(problems: Problema[], thresholdMeters = 10) {
  const groups: { coords: [number, number], problems: Problema[], status: string }[] = [];

  for (const problema of problems) {
    const coords = formatarCoordenadas(problema);
    if (!coords) continue;
    
    const status = normalizeStatus(problema.status || '');
    let found = false;

    for (const group of groups) {
      // Verifica se está próximo E tem o mesmo status
      const dist = calcularDistancia(coords[0], coords[1], group.coords[0], group.coords[1]) * 1000; // km -> m
      if (dist < thresholdMeters && group.status === status) {
        group.problems.push(problema);
        found = true;
        break;
      }
    }

    if (!found) {
      groups.push({ 
        coords, 
        problems: [problema],
        status 
      });
    }
  }
  return groups;
}

const Mapa: React.FC = () => {
  const location = useLocation();
  const selectedProblem = location.state?.selectedProblem;
  const [mapPosition, setMapPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [todosProblemas, setTodosProblemas] = useState<Problema[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Problema | null>(null);
  const [isMobile] = useMediaQuery('(max-width: 48em)');
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showNearby, setShowNearby] = useState(false);
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLocationProblems, setSelectedLocationProblems] = useState<Problema[]>([]);
  const mapRef = useRef<any>(null);

  // Busca localização do usuário
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc: [number, number] = [coords.latitude, coords.longitude];
        setUserLocation(loc);
        if (!selectedProblem) setMapPosition(loc);
      },
      err => {
        console.warn('Não foi possível obter localização', err);
        toast({
          title: 'Erro de localização',
          description: 'Não foi possível obter sua localização. Verifique as permissões do navegador.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    );
  }, [toast]);

  // Carrega problemas
  useEffect(() => {
    setIsLoading(true);
    RelatosService.listarRelatos()
      .then(data => {
        // Convertendo Relato[] para Problema[]
        const problemas = data.map(relato => ({
          ...relato,
          id: relato.id || String(Math.random()),
          coordenadas: {
            latitude: relato.coordenadas.lat,
            longitude: relato.coordenadas.lng
          }
        })) as unknown as Problema[];
        setTodosProblemas(problemas);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar relatos', err);
        setIsLoading(false);
        toast({
          title: 'Erro ao carregar problemas',
          description: 'Não foi possível carregar os problemas. Tente novamente mais tarde.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
  }, [toast]);

  // Função para mostrar problemas próximos
  const handleShowNearby = () => {
    if (!userLocation) {
      toast({
        title: 'Localização necessária',
        description: 'Precisamos da sua localização para mostrar problemas próximos.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setShowNearby(!showNearby);
  };

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

  // Estatísticas dos problemas
  const estatisticas = todosProblemas.reduce((acc, problema) => {
    const status = normalizeStatus(problema.status || '');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Card de detalhes
  const ProblemaCard: React.FC<{ problema: Problema }> = ({ problema }) => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');
    const headingColor = useColorModeValue('gray.800', 'white');
    const accentColor = useColorModeValue('blue.500', 'blue.300');
    const overlayGradient = useColorModeValue(
      'linear(to-t, blackAlpha.600, transparent)',
      'linear(to-t, blackAlpha.800, transparent)'
    );

    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(genericProblemSvg)}`;
    const imageSrc = problema.foto || (problema.tipo ? MAP_TIPO_TO_IMG[problema.tipo] : MAP_TIPO_TO_IMG.outros) || svgUrl;

    return (
      <Card
        borderWidth="1px"
        borderColor={cardBorderColor}
        bg={cardBg}
        shadow="lg"
        borderRadius="2xl"
        overflow="hidden"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{ 
          shadow: '2xl', 
          transform: 'translateY(-4px)',
          borderColor: accentColor
        }}
        position="relative"
      >
        <Box position="relative" overflow="hidden">
          <Image
            src={imageSrc}
            alt={problema.titulo}
            w="100%"
            h="180px"
            objectFit="cover"
            fallback={<Skeleton height="180px" />}
          />
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgGradient={overlayGradient}
          />
          <HStack position="absolute" top={3} right={3} spacing={2}>
            <Badge
              colorScheme={getStatusColor(problema.status || 'pendente')}
              variant="solid"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="xs"
              display="flex"
              alignItems="center"
              gap={1}
              shadow="md"
            >
              <Icon as={getStatusIcon(problema.status || 'pendente')} boxSize={2.5} />
              {problema.status?.replace('_', ' ') || 'Pendente'}
            </Badge>
          </HStack>
          <Box position="absolute" bottom={3} left={3} right={3}>
            <Heading 
              size="md" 
              color="white" 
              noOfLines={2}
              textShadow="0 2px 4px rgba(0,0,0,0.6)"
              fontWeight="bold"
            >
              {problema.titulo}
            </Heading>
          </Box>
        </Box>
        <CardBody p={5}>
          <VStack align="stretch" spacing={4}>
            <Text 
              fontSize="sm" 
              color={textColor} 
              noOfLines={3} 
              lineHeight="1.5"
              minH="60px"
            >
              {problema.descricao || 'Sem descrição disponível'}
            </Text>
            <HStack spacing={2} align="flex-start">
              <Icon as={FaMapMarkerAlt} color={accentColor} mt={0.5} flexShrink={0} />
              <Text fontSize="sm" color={textColor} lineHeight="1.4">
                {[
                  problema.endereco?.rua,
                  problema.endereco?.numero,
                  problema.endereco?.bairro,
                  problema.endereco?.cidade && problema.endereco?.estado
                    ? `${problema.endereco.cidade}-${problema.endereco.estado}`
                    : undefined
                ].filter(Boolean).join(', ')}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box minH="100vh" bgGradient={useColorModeValue(
      'linear(to-br, blue.50, purple.50, pink.50)',
      'linear(to-br, gray.900, blue.900, purple.900)'
    )}>
      <Container maxW="100vw" px={{ base: 8, md: 12 }} py={0} mt={{ base: '60px', md: '64px' }}>
        <VStack spacing={{ base: 2, md: 6 }} align="stretch">
          <VStack spacing={6} textAlign="center">
            <Box position="relative">
              <Heading 
                size={{ base: 'md', md: 'xl' }} 
                bgGradient={useColorModeValue(
                  'linear(to-r, blue.600, purple.600)',
                  'linear(to-r, blue.300, purple.300)'
                )}
                bgClip="text"
                fontWeight="extrabold"
                letterSpacing="tight"
              >
                🗺️ Mapa de Problemas
              </Heading>
              <Text 
                fontSize={{ base: "sm", md: "md" }} 
                color={useColorModeValue('gray.600', 'gray.300')}
                mt={2}
                maxW="600px"
                mx="auto"
              >
                Visualize e acompanhe os problemas reportados em Uberaba
              </Text>
            </Box>
          </VStack>

          {/* Dashboard de Status */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 2, md: 4 }} px={{ base: 2, md: 0 }}>
            {Object.entries(statusColors).map(([status, color]) => {
              // Formata o status para exibição
              const displayStatus = status === 'em_andamento' ? 'Em Andamento' : 
                status.charAt(0).toUpperCase() + status.slice(1);
              
              return (
                <Card 
                  key={status} 
                  bg={useColorModeValue('white', 'gray.800')}
                  border="1px solid"
                  borderColor={useColorModeValue('gray.100', 'gray.700')}
                  cursor="pointer"
                  transition="all 0.3s"
                  _hover={{ 
                    transform: 'translateY(-4px)', 
                    boxShadow: '2xl',
                    borderColor: color
                  }}
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                  opacity={statusFilter && statusFilter !== status ? 0.5 : 1}
                  minW={0}
                  borderRadius="2xl"
                  overflow="hidden"
                  position="relative"
                >
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    h="4px"
                    bg={color}
                  />
                  <CardBody p={{ base: 4, md: 6 }}>
                    <Stat>
                      <StatLabel 
                        color={color} 
                        fontWeight="bold" 
                        fontSize={{ base: 'sm', md: 'md' }}
                        display="flex"
                        alignItems="center"
                        gap={2}
                      >
                        <Icon as={getStatusIcon(status)} />
                        {displayStatus}
                      </StatLabel>
                      <StatNumber 
                        fontSize={{ base: '2xl', md: '3xl' }}
                        fontWeight="bold"
                        color={useColorModeValue('gray.800', 'white')}
                      >
                        {estatisticas[status] || 0}
                      </StatNumber>
                      <StatHelpText 
                        fontSize={{ base: 'xs', md: 'sm' }}
                        color={useColorModeValue('gray.500', 'gray.400')}
                      >
                        {statusFilter === status ? 'Clique para remover filtro' : 'Clique para filtrar'}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>

          {/* Mapa */}
          <Box
            height={{ base: 'calc(100dvh - 220px)', md: '600px' }}
            minH={{ base: '320px', md: '400px' }}
            border="3px solid"
            borderColor={useColorModeValue('blue.200', 'blue.700')}
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            boxShadow="2xl"
            w="full"
            mx="auto"
            mb={12}
            mt={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            {/* Botão de mostrar próximos */}
            <Box position="absolute" top={6} right={6} zIndex={1000}>
              <Tooltip label="Centralizar e aproximar na sua localização">
                <IconButton
                  aria-label="Centralizar no usuário"
                  icon={<FaMapMarkerAlt />}
                  colorScheme="blue"
                  onClick={() => {
                    if (userLocation && mapRef.current) {
                      const mapInstance = mapRef.current;
                      if (mapInstance.setView) {
                        mapInstance.setView(userLocation, 17, { animate: true });
                      } else if (mapInstance.leafletElement) {
                        mapInstance.leafletElement.setView(userLocation, 17, { animate: true });
                      }
                    } else {
                      toast({
                        title: 'Localização não encontrada',
                        description: 'Não foi possível obter sua localização.',
                        status: 'warning',
                        duration: 4000,
                        isClosable: true,
                      });
                    }
                  }}
                  size={{ base: "md", md: "lg" }}
                  borderRadius="full"
                  boxShadow="xl"
                  _hover={{ 
                    transform: 'scale(1.1)',
                    shadow: '2xl'
                  }}
                  transition="all 0.2s"
                  bg={useColorModeValue('white', 'gray.700')}
                />
              </Tooltip>
            </Box>

            <MapContainer
              center={mapPosition}
              zoom={13}
              style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
              scrollWheelZoom
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapView center={mapPosition} userLocation={userLocation} />

              {/* Círculo de alcance quando mostrar próximos está ativo */}
              {showNearby && userLocation && (
                <Circle
                  center={userLocation}
                  radius={1000}
                  pathOptions={{ 
                    color: 'blue', 
                    fillColor: 'blue', 
                    fillOpacity: 0.1,
                    weight: 2
                  }}
                />
              )}

              {/* Marcadores */}
              {!isLoading && groupProblemsByProximity(todosProblemas).map((group, idx) => {
                const coords = group.coords;
                const problems = group.problems;
                const status = group.status;

                // Filtro de distância
                if (showNearby && userLocation) {
                  const distancia = calcularDistancia(
                    userLocation[0],
                    userLocation[1],
                    coords[0],
                    coords[1]
                  );
                  if (distancia > 1) return null;
                }

                // Filtro de status melhorado
                if (statusFilter && status !== normalizeStatus(statusFilter)) {
                  return null;
                }

                return (
                  <Marker
                    key={idx}
                    position={coords}
                    icon={createStatusIcon(status, problems.length)}
                    eventHandlers={{
                      click: () => {
                        setSelectedLocationProblems(problems);
                        onOpen();
                      }
                    }}
                  />
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
                    eventHandlers={{ click: () => setSelectedMarker(selectedMarker) }}
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

            {/* Instrução do Mapa */}
            <Box
              position="absolute"
              bottom={4}
              left={4}
              right={4}
              bg={useColorModeValue('whiteAlpha.900', 'blackAlpha.800')}
              p={3}
              borderRadius="lg"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor={useColorModeValue('whiteAlpha.300', 'whiteAlpha.200')}
            >
              <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.200')} textAlign="center" fontWeight="medium">
                💡 Clique nos marcadores para ver os detalhes dos problemas
              </Text>
            </Box>
          </Box>

          {/* Modal para múltiplos problemas */}
          <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: '2xl' }} isCentered>
            <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
            <ModalContent 
              bg={useColorModeValue('white', 'gray.800')} 
              borderRadius={{ base: '0', md: '2xl' }} 
              shadow="2xl"
              mx={{ base: 0, md: 4 }}
              border="none"
              maxH={{ base: '100dvh', md: '90vh' }}
              display="flex"
              flexDir="column"
            >
              <ModalHeader 
                borderBottom="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                borderTopRadius={{ base: '0', md: '2xl' }}
                bg={useColorModeValue('gray.50', 'gray.700')}
                px={{ base: 4, md: 6 }}
                py={{ base: 3, md: 4 }}
                position="relative"
              >
                <HStack spacing={3}>
                  <Box
                    p={2}
                    bg={useColorModeValue('blue.100', 'blue.800')}
                    borderRadius="lg"
                  >
                    <Icon as={FaMapMarkerAlt} color="blue.500" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">Problemas nesta localização</Text>
                    <Text fontSize={{ base: 'sm', md: 'md' }} color={useColorModeValue('gray.600', 'gray.300')}>
                      {selectedLocationProblems.length} problema{selectedLocationProblems.length !== 1 ? 's' : ''} encontrado{selectedLocationProblems.length !== 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </HStack>
                <ModalCloseButton 
                  borderRadius="full" 
                  top={4} 
                  right={4}
                  size={{ base: 'lg', md: 'md' }}
                  _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  zIndex={10}
                />
              </ModalHeader>
              <ModalBody
                p={{ base: 2, md: 6 }}
                flex={1}
                overflowY="auto"
                maxH={{ base: 'calc(100dvh - 120px)', md: '70vh' }}
              >
                <VStack spacing={{ base: 2, md: 4 }} align="stretch">
                  {selectedLocationProblems.map(problema => (
                    <ProblemaCard key={problema.id} problema={problema} />
                  ))}
                </VStack>
              </ModalBody>
              {/* Botão grande de fechar para mobile */}
              <Box display={{ base: 'block', md: 'none' }} p={4}>
                <Button
                  w="100%"
                  h="50px"
                  colorScheme="blue"
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  color="white"
                  fontWeight="bold"
                  fontSize="lg"
                  borderRadius="xl"
                  onClick={onClose}
                  shadow="xl"
                  _hover={{
                    bgGradient: "linear(to-r, blue.600, purple.600)",
                    transform: "translateY(-2px)",
                    shadow: "2xl"
                  }}
                  _active={{
                    transform: "translateY(0)",
                    shadow: "lg"
                  }}
                  transition="all 0.3s"
                >
                  Fechar
                </Button>
              </Box>
            </ModalContent>
          </Modal>

          {/* Card em modo mobile */}
          {isMobile && selectedMarker && (
            <Box mt={4} px={2}>
              <ProblemaCard problema={selectedMarker} />
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Mapa;
  