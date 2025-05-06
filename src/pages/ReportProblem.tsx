import { Box, Button, FormControl, FormLabel, Input, Select, Textarea, VStack, useToast, HStack, IconButton, Text, Badge, Flex } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import { LatLng, Map as LeafletMap } from 'leaflet';
import { useProblemas } from '../contexts/ProblemasContext';
import { mapStyle, createCategoryIcon } from '../utils/mapConfig';
import { FaLocationArrow, FaMapMarkerAlt } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';

const defaultPosition = { lat: -19.7472, lng: -47.9381 }; // Uberaba-MG

// Alternativa para gerar código de localização
const generateLocationCode = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
};

// Função para obter o endereço a partir das coordenadas usando a API Nominatim do OpenStreetMap
const getAddressFromCoords = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.error) {
      throw new Error('Endereço não encontrado');
    }
    
    const address = data.address || {};
    
    return {
      rua: address.road || address.street || address.pedestrian || '',
      numero: address.house_number || '',
      bairro: address.suburb || address.neighbourhood || address.quarter || '',
      cidade: address.city || address.town || address.village || address.municipality || 'Uberaba',
      estado: address.state || 'MG'
    };
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return {
      rua: '',
      numero: '',
      bairro: '',
      cidade: 'Uberaba',
      estado: 'MG'
    };
  }
};

// Componente para centralizar o mapa na posição atual
function CenterMapOnLocation({ position }: { position: LatLng | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 16, {
        animate: true,
        duration: 1
      });
    }
  }, [position, map]);
  
  return null;
}

// Componente para o marcador de localização e eventos de clique no mapa
function LocationMarker({ position, categoria, onLocationSelect, isTracking }: { 
  position: LatLng | null; 
  categoria: string; 
  onLocationSelect: (latlng: LatLng) => void;
  isTracking: boolean;
}) {
  const map = useMapEvents({
    click(e) {
      if (!isTracking) {
        onLocationSelect(e.latlng);
        map.setView(e.latlng, 16, {
          animate: true,
          duration: 1
        });
      }
    },
  });

  useEffect(() => {
    if (position && isTracking) {
      console.log('Atualizando posição do marcador:', position);
      map.setView(position, 16, {
        animate: true,
        duration: 1
      });
    }
  }, [position, isTracking, map]);

  if (!position) {
    console.log('Posição nula, não renderizando marcador');
    return null;
  }

  console.log('Renderizando marcador na posição:', position);
  return (
    <Marker 
      position={position} 
      icon={createCategoryIcon(categoria)}
      eventHandlers={{
        click: () => {
          console.log('Marcador clicado');
        }
      }}
    />
  );
}

export default function RelatarProblema() {
  const toast = useToast();
  const { adicionarProblema } = useProblemas();
  const mapRef = useRef<LeafletMap | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: 'Uberaba',
    estado: 'MG',
    localizacao: '',
    coordenadas: defaultPosition,
    plusCode: ''
  });

  const [position, setPosition] = useState<LatLng | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Função para iniciar o rastreamento em tempo real da localização do usuário
  const startLocationTracking = () => {
    if (navigator.geolocation) {
      setIsTracking(true);
      console.log('Iniciando rastreamento de localização');
      
      // Primeiro, obter a posição atual imediatamente
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPosition = new LatLng(lat, lng);
          console.log('Nova posição obtida:', newPosition);
          
          // Gerar o código de localização
          const plusCode = generateLocationCode(lat, lng);
          
          // Obter o endereço a partir das coordenadas
          const endereco = await getAddressFromCoords(lat, lng);
          
          setPosition(newPosition);
          setFormData(prev => ({
            ...prev,
            coordenadas: { lat, lng },
            plusCode,
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade || 'Uberaba',
            estado: endereco.estado || 'MG',
            localizacao: `${endereco.rua} ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade || 'Uberaba'}-${endereco.estado || 'MG'}`
          }));
          
          toast({
            title: 'Localização obtida com sucesso',
            description: `Plus Code: ${plusCode}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setIsTracking(false);
          toast({
            title: 'Erro ao obter localização',
            description: 'Por favor, permita o acesso à sua localização ou selecione manualmente no mapa.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
        { enableHighAccuracy: true }
      );
      
      // Depois, iniciar o rastreamento contínuo
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPosition = new LatLng(lat, lng);
          console.log('Atualização de posição:', newPosition);
          
          // Gerar o código de localização
          const plusCode = generateLocationCode(lat, lng);
          
          setPosition(newPosition);
          setFormData(prev => ({
            ...prev,
            coordenadas: { lat, lng },
            plusCode
          }));
        },
        (error) => {
          console.error('Erro no rastreamento:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      
      setWatchId(id);
    }
  };
  
  // Função para parar o rastreamento da localização
  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };
  
  // Função para alternar entre rastreamento ligado/desligado
  const toggleLocationTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };
  
  // Função para obter a localização uma única vez
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPosition = new LatLng(lat, lng);
          console.log('Nova posição obtida:', newPosition);
          
          // Gerar o código de localização
          const plusCode = generateLocationCode(lat, lng);
          
          // Obter o endereço a partir das coordenadas
          const endereco = await getAddressFromCoords(lat, lng);
          
          setPosition(newPosition);
          setFormData(prev => ({
            ...prev,
            coordenadas: { lat, lng },
            plusCode,
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade || 'Uberaba',
            estado: endereco.estado || 'MG',
            localizacao: `${endereco.rua} ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade || 'Uberaba'}-${endereco.estado || 'MG'}`
          }));

          // Centralizar o mapa na nova posição
          if (mapRef.current) {
            mapRef.current.setView(newPosition, 16, {
              animate: true,
              duration: 1
            });
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast({
            title: 'Erro ao obter localização',
            description: 'Por favor, permita o acesso à sua localização ou selecione manualmente no mapa.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };
  
  // Limpar o rastreamento quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se temos dados de localização válidos
    if (!formData.rua && !formData.bairro) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma localização válida no mapa.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Construir a string de localização apenas com os campos preenchidos
    const localizacao = [
      formData.rua,
      formData.numero,
      formData.bairro,
      `${formData.cidade}-${formData.estado}`
    ].filter(Boolean).join(', ');
    
    // Adicionar o endereço à descrição do problema apenas se houver dados
    const descricaoCompleta = [
      formData.descricao
    ].filter(Boolean).join('\n');
    
    // Adicionar o problema com os dados atualizados
    adicionarProblema({
      titulo: formData.titulo,
      categoria: formData.categoria,
      descricao: descricaoCompleta,
      localizacao: localizacao,
      coordenadas: formData.coordenadas,
      status: 'pendente',
      endereco: {
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      },
      plusCode: formData.plusCode
    });
    
    // Resetar o formulário
    setFormData({
      titulo: '',
      categoria: '',
      descricao: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: 'Uberaba',
      estado: 'MG',
      localizacao: '',
      coordenadas: defaultPosition,
      plusCode: ''
    });
    
    setPosition(null);
    stopLocationTracking();
    
    toast({
      title: 'Problema relatado com sucesso!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Modificar a função handleGetLocation para ser chamada automaticamente quando o componente montar
  useEffect(() => {
    // Obter a localização assim que o componente montar
    handleGetLocation();
  }, []); // Array vazio significa que só executa uma vez quando o componente monta

  return (
    <Box maxW="container.md" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          {/* Seção do mapa e localização */}
          <FormControl>
            <HStack justify="space-between" align="center" mb={2}>
              <FormLabel fontSize="lg" fontWeight="bold">Sua localização</FormLabel>
              <HStack>
                <Button
                  leftIcon={<FaLocationArrow />}
                  colorScheme={isTracking ? "red" : "blue"}
                  onClick={toggleLocationTracking}
                  size="sm"
                >
                  {isTracking ? "Parar rastreamento" : "Rastrear em tempo real"}
                </Button>
                {!isTracking && (
                  <IconButton
                    aria-label="Obter localização atual"
                    icon={<FaMapMarkerAlt />}
                    onClick={handleGetLocation}
                    size="sm"
                    colorScheme="green"
                  />
                )}
              </HStack>
            </HStack>
            
            {/* Exibir o Plus Code se disponível */}
            {formData.plusCode && (
              <Flex align="center" mb={2}>
                <Text mr={2}>Plus Code:</Text>
                <Badge colorScheme="purple" fontSize="md" p={1}>
                  {formData.plusCode}
                </Badge>
              </Flex>
            )}
            
            {/* Exibir o endereço se disponível */}
            {formData.rua || formData.bairro ? (
              <Box mb={3} p={3} borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: "gray.700" }}>
                <Text>
                  {[
                    formData.rua,
                    formData.numero,
                    formData.bairro,
                    `${formData.cidade}-${formData.estado}`
                  ].filter(Boolean).join(', ')}
                </Text>
              </Box>
            ) : null}
            
            <Box height="400px" borderRadius="md" overflow="hidden" mb={4} position="relative" boxShadow="md">
              <MapContainer
                center={position ? [position.lat, position.lng] : [defaultPosition.lat, defaultPosition.lng]}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                whenReady={() => {
                  if (mapRef.current) return;
                  const map = document.querySelector('.leaflet-container');
                  if (map) {
                    mapRef.current = map as unknown as LeafletMap;
                  }
                }}
                scrollWheelZoom={true}
                zoomControl={false}
              >
                <TileLayer
                  url={mapStyle.url}
                  attribution={mapStyle.attribution}
                  maxZoom={mapStyle.maxZoom}
                />
                <ZoomControl position="bottomright" />
                <LocationMarker
                  position={position}
                  categoria={formData.categoria || 'outros'}
                  onLocationSelect={(latlng) => {
                    setPosition(latlng);
                    setFormData((prev) => ({
                      ...prev,
                      coordenadas: { lat: latlng.lat, lng: latlng.lng },
                      plusCode: generateLocationCode(latlng.lat, latlng.lng)
                    }));
                    
                    // Obter endereço a partir das coordenadas selecionadas manualmente
                    getAddressFromCoords(latlng.lat, latlng.lng).then(endereco => {
                      setFormData(prev => ({
                        ...prev,
                        rua: endereco.rua,
                        numero: endereco.numero,
                        bairro: endereco.bairro,
                        cidade: endereco.cidade || 'Uberaba',
                        estado: endereco.estado || 'MG',
                        localizacao: `${endereco.rua} ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade || 'Uberaba'}-${endereco.estado || 'MG'}`
                      }));
                    });
                  }}
                  isTracking={isTracking}
                />
                {position && <CenterMapOnLocation position={position} />}
              </MapContainer>
            </Box>
          </FormControl>
          
          {/* Informações do problema */}
          <FormControl isRequired>
            <FormLabel>Título do Problema</FormLabel>
            <Input
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ex: Buraco na calçada"
              bg="white"
              _dark={{ bg: "gray.700", borderColor: "gray.600" }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Categoria</FormLabel>
            <Select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              placeholder="Selecione uma categoria"
              bg="white"
              _dark={{ bg: "gray.700", borderColor: "gray.600" }}
            >
              <option value="infraestrutura">Infraestrutura</option>
              <option value="iluminacao">Iluminação</option>
              <option value="limpeza">Limpeza</option>
              <option value="seguranca">Segurança</option>
              <option value="outros">Outros</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Descrição</FormLabel>
            <Textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descreva o problema em detalhes"
              rows={4}
              bg="white"
              _dark={{ bg: "gray.700", borderColor: "gray.600" }}
            />
          </FormControl>

          <Button type="submit" size="lg" colorScheme="blue">
            Enviar Relato
          </Button>
        </VStack>
      </form>
    </Box>
  );
}