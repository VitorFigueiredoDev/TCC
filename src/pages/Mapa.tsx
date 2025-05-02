import React, { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, Badge, HStack, VStack, Image, Card, CardBody } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RelatosService } from '../services/relatosService';
import { useMediaQuery } from '@chakra-ui/react';

// Importar os arquivos de imagem do marcador
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configurar o ícone padrão do Leaflet para o problema selecionado
const SelectedIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Criar ícones coloridos menores para os outros problemas
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
};

// Definir cores para cada tipo de problema
const tipoIcons = {
  buraco: createColoredIcon('#FF4444'),     // Vermelho
  iluminacao: createColoredIcon('#FFD700'),  // Amarelo
  lixo: createColoredIcon('#8B4513'),       // Marrom
  calcada: createColoredIcon('#4169E1'),    // Azul
  default: createColoredIcon('#808080')     // Cinza para tipos desconhecidos
};

// Coordenadas padrão (Uberlândia)
const DEFAULT_CENTER = [-18.9113, -48.2622];

// Componente para atualizar a visualização do mapa
function MapView({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && 
        !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 15);
    }
  }, [center, map]);

  return null;
}

// Função para formatar coordenadas
const formatarCoordenadas = (problema) => {
  if (!problema) return null;

  // Caso 1: Coordenadas em um objeto aninhado
  if (problema.coordenadas?.latitude && problema.coordenadas?.longitude) {
    const lat = parseFloat(problema.coordenadas.latitude);
    const lng = parseFloat(problema.coordenadas.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  // Caso 2: Coordenadas como propriedades diretas
  if (problema.latitude && problema.longitude) {
    const lat = parseFloat(problema.latitude);
    const lng = parseFloat(problema.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  // Caso 3: Coordenadas em formato de array
  if (Array.isArray(problema.coordenadas) && problema.coordenadas.length === 2) {
    const [lat, lng] = problema.coordenadas.map(coord => parseFloat(coord));
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  return null;
};

const Mapa = () => {
  const location = useLocation();
  const selectedProblem = location.state?.selectedProblem;
  const [mapPosition, setMapPosition] = useState(DEFAULT_CENTER);
  const [todosProblemas, setTodosProblemas] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  
  useEffect(() => {
    const carregarProblemas = async () => {
      try {
        const dados = await RelatosService.listarRelatos();
        setTodosProblemas(dados);
      } catch (error) {
        console.error('Erro ao carregar problemas:', error);
      }
    };
    
    carregarProblemas();
  }, []);

  useEffect(() => {
    if (selectedProblem) {
      const coordenadas = formatarCoordenadas(selectedProblem);
      if (coordenadas) {
        setMapPosition(coordenadas);
        setSelectedMarker(selectedProblem);
      }
    }
  }, [selectedProblem]);

  // Componente do Card de Detalhes Mobile
  const ProblemaCard = ({ problema }) => (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">{problema.titulo}</Heading>
          {problema.foto && (
            <Image
              src={problema.foto}
              alt={problema.titulo}
              borderRadius="lg"
              objectFit="cover"
              maxH="200px"
              w="100%"
            />
          )}
          <Text fontSize="sm" noOfLines={3}>{problema.descricao}</Text>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="bold">Tipo:</Text>
            <Badge colorScheme={
              problema.tipo === 'buraco' ? 'red' :
              problema.tipo === 'iluminacao' ? 'yellow' :
              problema.tipo === 'lixo' ? 'orange' :
              problema.tipo === 'calcada' ? 'blue' : 'gray'
            }>
              {problema.tipo.charAt(0).toUpperCase() + problema.tipo.slice(1)}
            </Badge>
          </HStack>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="bold">Status:</Text>
            <Badge>{problema.status}</Badge>
          </HStack>
          <Text fontSize="sm" noOfLines={2}>
            {[
              problema.endereco?.rua,
              problema.endereco?.numero,
              problema.endereco?.bairro,
              problema.endereco ? `${problema.endereco.cidade}-${problema.endereco.estado}` : ''
            ].filter(Boolean).join(', ')}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 8 }} mt={{ base: "60px", md: "64px" }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Heading size={{ base: "lg", md: "xl" }}>Mapa de Problemas</Heading>
        
        {/* Legenda */}
        <Box 
          overflowX="auto" 
          pb={2}
          sx={{
            '&::-webkit-scrollbar': {
              height: '8px',
              borderRadius: '8px',
              backgroundColor: `rgba(0, 0, 0, 0.05)`,
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '8px',
              backgroundColor: `rgba(0, 0, 0, 0.1)`,
            },
          }}
        >
          <HStack 
            spacing={{ base: 3, md: 4 }} 
            minW="fit-content" 
            p={2}
          >
            <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
              Tipos de Problemas:
            </Text>
            <HStack spacing={{ base: 3, md: 4 }}>
              <HStack spacing={2}>
                <Box 
                  w={{ base: "12px", md: "16px" }} 
                  h={{ base: "12px", md: "16px" }} 
                  borderRadius="50%" 
                  bg="#FF4444" 
                  border="2px solid white" 
                  boxShadow="0 0 4px rgba(0,0,0,0.5)" 
                />
                <Text fontSize={{ base: "sm", md: "md" }}>Buraco</Text>
              </HStack>
              <HStack spacing={2}>
                <Box 
                  w={{ base: "12px", md: "16px" }} 
                  h={{ base: "12px", md: "16px" }} 
                  borderRadius="50%" 
                  bg="#FFD700" 
                  border="2px solid white" 
                  boxShadow="0 0 4px rgba(0,0,0,0.5)" 
                />
                <Text fontSize={{ base: "sm", md: "md" }}>Iluminação</Text>
              </HStack>
              <HStack spacing={2}>
                <Box 
                  w={{ base: "12px", md: "16px" }} 
                  h={{ base: "12px", md: "16px" }} 
                  borderRadius="50%" 
                  bg="#8B4513" 
                  border="2px solid white" 
                  boxShadow="0 0 4px rgba(0,0,0,0.5)" 
                />
                <Text fontSize={{ base: "sm", md: "md" }}>Lixo</Text>
              </HStack>
              <HStack spacing={2}>
                <Box 
                  w={{ base: "12px", md: "16px" }} 
                  h={{ base: "12px", md: "16px" }} 
                  borderRadius="50%" 
                  bg="#4169E1" 
                  border="2px solid white" 
                  boxShadow="0 0 4px rgba(0,0,0,0.5)" 
                />
                <Text fontSize={{ base: "sm", md: "md" }}>Calçada</Text>
              </HStack>
            </HStack>
          </HStack>
        </Box>

        {/* Mapa */}
        <Box 
          height={{ base: "400px", md: "600px" }} 
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
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapView center={mapPosition} />
            
            {/* Renderizar todos os problemas não selecionados */}
            {todosProblemas.map((problema) => {
              const coordenadas = formatarCoordenadas(problema);
              if (!coordenadas || selectedProblem?.id === problema.id) return null;
              
              return (
                <Marker 
                  key={problema.id} 
                  position={coordenadas}
                  icon={tipoIcons[problema.tipo] || tipoIcons.default}
                  eventHandlers={{
                    click: () => {
                      setSelectedMarker(problema);
                    },
                  }}
                >
                  {!isMobile && (
                    <Popup>
                      <Box p={2} maxW={{ base: "200px", md: "300px" }}>
                        <Heading size="sm" mb={2}>{problema.titulo}</Heading>
                        {problema.foto && (
                          <Box mb={2}>
                            <Image
                              src={problema.foto}
                              alt={problema.titulo}
                              style={{ 
                                width: '100%', 
                                maxHeight: '150px', 
                                objectFit: 'cover', 
                                borderRadius: '4px' 
                              }}
                            />
                          </Box>
                        )}
                        <Text fontSize="sm" mb={2} noOfLines={3}>{problema.descricao}</Text>
                        <HStack spacing={2} mb={2}>
                          <Text fontSize="sm" fontWeight="bold">Tipo:</Text>
                          <Badge colorScheme={
                            problema.tipo === 'buraco' ? 'red' :
                            problema.tipo === 'iluminacao' ? 'yellow' :
                            problema.tipo === 'lixo' ? 'orange' :
                            problema.tipo === 'calcada' ? 'blue' : 'gray'
                          }>
                            {problema.tipo.charAt(0).toUpperCase() + problema.tipo.slice(1)}
                          </Badge>
                        </HStack>
                        <HStack spacing={2} mb={2}>
                          <Text fontSize="sm" fontWeight="bold">Status:</Text>
                          <Badge>{problema.status}</Badge>
                        </HStack>
                        <Text fontSize="sm" noOfLines={2}>
                          {[
                            problema.endereco?.rua,
                            problema.endereco?.numero,
                            problema.endereco?.bairro,
                            problema.endereco ? `${problema.endereco.cidade}-${problema.endereco.estado}` : ''
                          ].filter(Boolean).join(', ')}
                        </Text>
                      </Box>
                    </Popup>
                  )}
                </Marker>
              );
            })}

            {/* Renderizar o problema selecionado */}
            {selectedProblem && (() => {
              const coordenadas = formatarCoordenadas(selectedProblem);
              if (!coordenadas) return null;

              return (
                <Marker 
                  position={coordenadas}
                  icon={SelectedIcon}
                  zIndexOffset={1000}
                  eventHandlers={{
                    click: () => {
                      setSelectedMarker(selectedProblem);
                    },
                  }}
                >
                  {!isMobile && (
                    <Popup>
                      <Box p={2} maxW={{ base: "200px", md: "300px" }}>
                        <Heading size="sm" mb={2}>{selectedProblem.titulo}</Heading>
                        {selectedProblem.foto && (
                          <Box mb={2}>
                            <Image
                              src={selectedProblem.foto}
                              alt={selectedProblem.titulo}
                              style={{ 
                                width: '100%', 
                                maxHeight: '150px', 
                                objectFit: 'cover', 
                                borderRadius: '4px' 
                              }}
                            />
                          </Box>
                        )}
                        <Text fontSize="sm" mb={2} noOfLines={3}>{selectedProblem.descricao}</Text>
                        <HStack spacing={2} mb={2}>
                          <Text fontSize="sm" fontWeight="bold">Tipo:</Text>
                          <Badge colorScheme={
                            selectedProblem.tipo === 'buraco' ? 'red' :
                            selectedProblem.tipo === 'iluminacao' ? 'yellow' :
                            selectedProblem.tipo === 'lixo' ? 'orange' :
                            selectedProblem.tipo === 'calcada' ? 'blue' : 'gray'
                          }>
                            {selectedProblem.tipo.charAt(0).toUpperCase() + selectedProblem.tipo.slice(1)}
                          </Badge>
                        </HStack>
                        <HStack spacing={2} mb={2}>
                          <Text fontSize="sm" fontWeight="bold">Status:</Text>
                          <Badge>{selectedProblem.status}</Badge>
                        </HStack>
                        <Text fontSize="sm" noOfLines={2}>
                          {[
                            selectedProblem.endereco?.rua,
                            selectedProblem.endereco?.numero,
                            selectedProblem.endereco?.bairro,
                            selectedProblem.endereco ? `${selectedProblem.endereco.cidade}-${selectedProblem.endereco.estado}` : ''
                          ].filter(Boolean).join(', ')}
                        </Text>
                      </Box>
                    </Popup>
                  )}
                </Marker>
              );
            })()}
          </MapContainer>
        </Box>

        {/* Card de Detalhes Mobile */}
        {isMobile && selectedMarker && (
          <Box 
            mt={4}
            borderTopWidth="1px"
            borderColor="gray.200"
            zIndex={1000}
            p={4}
            maxH="50vh"
            overflowY="auto"
          >
            <ProblemaCard problema={selectedMarker} />
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default Mapa; 