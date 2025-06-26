import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  useToast, Text, Button, Container, FormControl, FormLabel,
  Input, Textarea, VStack, Select, Heading, IconButton, Box, FormErrorMessage,
  Icon, InputGroup, InputLeftElement, Divider,
  useColorModeValue, InputRightElement, HStack, Badge, Flex,
  Progress, useBreakpointValue, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, Collapse
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { FaLocationArrow, FaImage, FaPaperPlane, FaMapMarkerAlt, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import debounce from 'lodash.debounce';

// Supondo que você tenha esses arquivos - ajuste os caminhos se necessário
import { verificarConteudoInadequado } from '../utils/contentFilter';
import { RelatosService } from '../services/relatosService';
import { auth } from '../config/firebase';

// --- Constantes ---
const DEFAULT_CENTER: L.LatLngTuple = [-19.7487, -47.9386]; // Coordenadas de Uberaba
const DEFAULT_ZOOM = 13;
const DEFAULT_CITY = 'Uberaba';
const DEFAULT_STATE = 'MG';

const PROBLEM_TYPES = [
  { value: 'buraco', label: 'Buraco na Via', color: 'red', icon: '🕳️' },
  { value: 'iluminacao', label: 'Problema de Iluminação', color: 'yellow', icon: '💡' },
  { value: 'lixo', label: 'Descarte Irregular de Lixo', color: 'green', icon: '🗑️' },
  { value: 'calcada', label: 'Calçada Danificada', color: 'orange', icon: '🚶' },
  { value: 'sinalizacao', label: 'Problema de Sinalização', color: 'blue', icon: '🚧' },
  { value: 'outros', label: 'Outros', color: 'purple', icon: '⚠️' },
];

// --- Configuração dos Ícones do Leaflet ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Componentes Auxiliares ---
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Componente para centralizar o mapa (com useEffect)
function ChangeMapView({ coords }: { coords: L.LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
      map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
}

// --- Tipos e Interfaces ---
interface FormDataState {
  titulo: string;
  descricao: string;
  tipo: string;
  foto: File | null;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  coordenadas: { lat: number; lng: number };
}

// Adicionar animação pulsante
const pulseAnimation = {
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(66,153,225,0.7)' },
    '70%': { boxShadow: '0 0 0 10px rgba(66,153,225,0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(66,153,225,0)' },
  }
};

// --- Componente Principal ---
export default function RelatarProblema() {
  const [formData, setFormData] = useState<FormDataState>({
    titulo: '',
    descricao: '',
    tipo: '',
    foto: null,
    rua: '',
    numero: '',
    bairro: '',
    cidade: DEFAULT_CITY,
    estado: DEFAULT_STATE,
    coordenadas: { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ titulo?: string; descricao?: string; foto?: string }>({});
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mapCenter, setMapCenter] = useState<L.LatLngTuple>(DEFAULT_CENTER);
  const mapRef = useRef<L.Map | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Responsividade
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerMaxW = useBreakpointValue({ base: "100%", md: "container.lg", xl: "container.xl" });

  useEffect(() => {
    setMapCenter([formData.coordenadas.lat, formData.coordenadas.lng]);
  }, [formData.coordenadas]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'titulo' || name === 'descricao') {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, foto: file }));
      setValidationErrors(prev => ({ ...prev, foto: undefined }));
    } else {
      setFormData(prev => ({ ...prev, foto: null }));
    }
  }, []);

  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error || 'Endereço não encontrado.');

      const address = data.address || {};
      setFormData(prev => ({
        ...prev,
        coordenadas: { lat, lng },
        rua: address.road || address.street || address.pedestrian || '',
        numero: address.house_number || '',
        bairro: address.suburb || address.neighbourhood || address.quarter || '',
        cidade: address.city || address.town || address.village || address.municipality || DEFAULT_CITY,
        estado: address.state || DEFAULT_STATE,
      }));
      setMapCenter([lat, lng]);
      toast({ title: "📍 Localização atualizada", status: "info", duration: 2000, isClosable: true });
    } catch (error: any) {
      console.error('Erro ao buscar endereço por coordenadas:', error);
      toast({ title: 'Erro ao buscar endereço', description: error.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleMapClick = useCallback((lat: number, lng: number) => { getAddressFromCoords(lat, lng); }, [getAddressFromCoords]);

  // Função de busca de sugestões com debounce
  const fetchSuggestions = useCallback(debounce(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const uberabaViewbox = '-48.067,-19.866,-47.798,-19.600';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
        `&format=json&addressdetails=1&limit=5&countrycodes=br` +
        `&viewbox=${uberabaViewbox}&bounded=1`
      );
      if (!response.ok) return;
      const data = await response.json();
      setSuggestions(data);
    } catch (e) {
      setSuggestions([]);
    }
  }, 400), []);

  // Atualizar sugestões ao digitar
  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchSuggestions(searchQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, fetchSuggestions]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- FUNÇÃO COM VIEWBOX ---
  const handleSearchLocation = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({ title: "🔍 Digite um local para pesquisar", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    setIsSearchingLocation(true);
    try {
        // Caixa delimitadora (Bounding Box) aproximada para Uberaba
        const uberabaViewbox = '-48.067,-19.866,-47.798,-19.600';

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}` +
            `&format=json&addressdetails=1&limit=1&countrycodes=br` +
            `&viewbox=${uberabaViewbox}&bounded=1` // Força a busca dentro da caixa
        );

      if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error('Localização não encontrada em Uberaba. Tente ser mais específico ou use o mapa.');
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const address = result.address || {};

      setFormData(prev => ({
        ...prev,
        coordenadas: { lat, lng },
        rua: address.road || address.street || address.pedestrian || result.display_name.split(',')[0] || '',
        numero: address.house_number || '',
        bairro: address.suburb || address.neighbourhood || address.quarter || '',
        cidade: address.city || address.town || address.village || address.municipality || DEFAULT_CITY,
        estado: address.state || DEFAULT_STATE,
      }));

      setMapCenter([lat, lng]);
      toast({ title: "🎯 Localização encontrada!", status: "success", duration: 2000, isClosable: true });

    } catch (error: any) {
      console.error('Erro ao pesquisar localização:', error);
      toast({
        title: 'Erro ao pesquisar localização',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSearchingLocation(false);
    }
  }, [searchQuery, toast]);

  const handleGetCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          getAddressFromCoords(latitude, longitude);
        },
        (error) => {
          console.error("Erro ao obter geolocalização:", error);
          toast({ title: 'Erro ao obter localização', description: 'Não foi possível obter sua localização. Verifique as permissões.', status: 'error', duration: 4000, isClosable: true });
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({ title: 'Geolocalização não suportada', status: 'warning', duration: 3000, isClosable: true });
    }
  }, [getAddressFromCoords, toast]);

  const validateForm = useCallback(() => {
    let errors: { titulo?: string; descricao?: string; foto?: string } = {};
    let isValid = true;

    if (!formData.titulo.trim()) {
      errors.titulo = 'O título é obrigatório.';
      isValid = false;
    } else {
      const { valido, mensagem } = verificarConteudoInadequado(formData.titulo);
      if (!valido) {
        errors.titulo = mensagem || 'O título contém palavras inadequadas.';
        isValid = false;
      }
    }

    if (!formData.descricao.trim()) {
      errors.descricao = 'A descrição é obrigatória.';
      isValid = false;
    } else {
      const { valido, mensagem } = verificarConteudoInadequado(formData.descricao);
      if (!valido) {
        errors.descricao = mensagem || 'A descrição contém palavras inadequadas.';
        isValid = false;
      }
    }

    if (!formData.tipo) {
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [formData.titulo, formData.descricao, formData.tipo, formData.foto]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!auth.currentUser) {
      toast({ title: 'Usuário não autenticado', description: 'Login necessário.', status: 'error', duration: 3000, isClosable: true });
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      toast({ title: 'Campos inválidos ou faltando', description: 'Verifique os campos destacados.', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setIsLoading(true);
    try {
      const relatoParaEnviar = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        descricao: formData.descricao,
        coordenadas: formData.coordenadas,
        endereco: {
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
        },
        usuarioId: auth.currentUser.uid,
      };
      await RelatosService.adicionarRelato(relatoParaEnviar, formData.foto);
      toast({ title: '✅ Problema relatado com sucesso!', status: 'success', duration: 3000, isClosable: true });
      navigate('/problemas');
    } catch (error: any) {
      console.error('Erro ao enviar relato:', error);
      toast({ title: 'Erro ao enviar relato', description: error.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const displayAddress = useMemo(() => {
    const parts = [ formData.rua, formData.numero, formData.bairro, `${formData.cidade} - ${formData.estado}` ].filter(Boolean);
    return parts.join(', ');
  }, [formData.rua, formData.numero, formData.bairro, formData.cidade, formData.estado]);

  const selectedProblemType = useMemo(() => {
    return PROBLEM_TYPES.find(pt => pt.value === formData.tipo);
  }, [formData.tipo]);

  // Calcular progresso do formulário
  const formProgress = useMemo(() => {
    let completed = 0;
    if (formData.titulo.trim()) completed++;
    if (formData.tipo) completed++;
    if (formData.descricao.trim()) completed++;
    if (displayAddress) completed++;
    return (completed / 4) * 100;
  }, [formData.titulo, formData.tipo, formData.descricao, displayAddress]);

  // --- Cores Modernas ---
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const headingGradient = useColorModeValue(
    'linear(to-r, blue.600, purple.600)',
    'linear(to-r, blue.300, purple.300)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.100', 'gray.700');
  const mapBorder = useColorModeValue('blue.200', 'blue.700');
  const addressBoxBg = useColorModeValue(
    'linear(to-r, blue.50, purple.50)',
    'linear(to-r, blue.800, purple.800)'
  );
  const addressBoxBorder = useColorModeValue('blue.300', 'blue.600');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const inputHoverBg = useColorModeValue('gray.100', 'gray.600');
  const inputFocusBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const progressColorScheme = useColorModeValue('blue', 'purple');

  return (
    <Box minH="100vh" bgGradient={bgGradient} py={{ base: 6, md: 10 }}>
      <Container maxW={containerMaxW} mt={{ base: "70px", md: "90px" }}>
        <VStack spacing={{ base: 8, md: 12 }} align="stretch">
          {/* Header Moderno */}
          <VStack spacing={6} textAlign="center">
            <Box position="relative">
              <Heading 
                as="h1" 
                size={{ base: "xl", md: "2xl" }} 
                bgGradient={headingGradient}
                bgClip="text"
                fontWeight="extrabold"
                letterSpacing="tight"
              >
                🚨 Relatar Novo Problema
              </Heading>
              <Text 
                fontSize={{ base: "md", md: "lg" }} 
                color={useColorModeValue('gray.600', 'gray.300')}
                mt={2}
                maxW="600px"
                mx="auto"
              >
                Ajude a melhorar nossa cidade reportando problemas urbanos de forma rápida e eficiente
              </Text>
            </Box>
            
            {/* Barra de Progresso */}
            <Box w="100%" maxW="400px">
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color={labelColor} fontWeight="medium">
                  Progresso do Formulário
                </Text>
                <Text fontSize="sm" color={labelColor} fontWeight="bold">
                  {Math.round(formProgress)}%
                </Text>
              </HStack>
              <Progress 
                value={formProgress} 
                colorScheme={progressColorScheme}
                size="lg" 
                borderRadius="full"
                bg={useColorModeValue('gray.200', 'gray.600')}
              />
            </Box>
          </VStack>

          {/* Seção de Busca de Localização */}
          <Box
            bg={cardBg}
            borderRadius="2xl"
            p={{ base: 6, md: 8 }}
            shadow="2xl"
            borderWidth="1px"
            borderColor={cardBorder}
            position="relative"
            overflow="hidden"
          >
            {/* Efeito de brilho */}
            <Box
              position="absolute"
              top="-50%"
              left="-50%"
              w="200%"
              h="200%"
              bgGradient="linear(45deg, transparent, blue.100, transparent)"
              opacity={0.1}
              transform="rotate(45deg)"
              pointerEvents="none"
            />
            
            <VStack spacing={6} position="relative">
              <HStack w="100%">
                <Icon as={FaSearch} color="blue.500" boxSize={6} />
                <Heading size="lg" color={labelColor} fontWeight="bold">
                  📍 Localização do Problema
                </Heading>
              </HStack>
              
              <FormControl>
                <FormLabel fontWeight="semibold" color={labelColor} fontSize="md">
                  Pesquisar em Uberaba
                </FormLabel>
                <Box position="relative" ref={suggestionsRef}>
                  <InputGroup size="lg">
                    <Input
                      placeholder="Ex: Av. Getúlio Vargas, Centro, Praça Rui Barbosa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchLocation();
                          setShowSuggestions(false);
                        }
                      }}
                      bg={inputBg}
                      border="2px solid transparent"
                      _hover={{ 
                        bg: inputHoverBg,
                        borderColor: 'blue.300'
                      }}
                      _focus={{ 
                        bg: inputFocusBg,
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      borderRadius="xl"
                      fontSize="lg"
                      autoComplete="off"
                    />
                    <InputRightElement h="100%" pr={2}>
                      <IconButton
                        aria-label="Pesquisar localização"
                        icon={<FaSearch />}
                        onClick={() => { handleSearchLocation(); setShowSuggestions(false); }}
                        isLoading={isSearchingLocation}
                        size="md"
                        colorScheme="blue"
                        variant="solid"
                        borderRadius="lg"
                        _hover={{ transform: 'scale(1.05)' }}
                        transition="all 0.2s"
                      />
                    </InputRightElement>
                  </InputGroup>
                  {/* Sugestões de endereço com animação */}
                  <Collapse in={showSuggestions && suggestions.length > 0} animateOpacity>
                    <Box
                      left={0}
                      right={0}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={cardBorder}
                      borderRadius="xl"
                      shadow="lg"
                      zIndex={10}
                      mt={1}
                      maxH="220px"
                      overflowY="auto"
                    >
                      {suggestions.map((s, idx) => (
                        <Box
                          key={s.place_id || idx}
                          px={4}
                          py={3}
                          cursor="pointer"
                          _hover={{ bg: useColorModeValue('blue.50', 'gray.700') }}
                          borderBottom={idx !== suggestions.length - 1 ? '1px solid' : undefined}
                          borderColor={cardBorder}
                          onClick={() => {
                            setSearchQuery(s.display_name);
                            setShowSuggestions(false);
                            setSuggestions([]);
                            // Preencher endereço e coordenadas
                            const lat = parseFloat(s.lat);
                            const lng = parseFloat(s.lon);
                            const address = s.address || {};
                            setFormData(prev => ({
                              ...prev,
                              coordenadas: { lat, lng },
                              rua: address.road || address.street || address.pedestrian || s.display_name.split(',')[0] || '',
                              numero: address.house_number || '',
                              bairro: address.suburb || address.neighbourhood || address.quarter || '',
                              cidade: address.city || address.town || address.village || address.municipality || DEFAULT_CITY,
                              estado: address.state || DEFAULT_STATE,
                            }));
                            setMapCenter([lat, lng]);
                          }}
                        >
                          <Text fontSize="md" color={labelColor} noOfLines={2}>{s.display_name}</Text>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              </FormControl>
            </VStack>
          </Box>

          {/* Mapa Moderno */}
          <Box
            position="relative"
            h={{ base: "400px", md: "500px" }}
            borderRadius="2xl"
            overflow="hidden"
            shadow="2xl"
            borderWidth="3px"
            borderColor={mapBorder}
            bg={cardBg}
          >
            {/* Botão de Localização Atual com animação pulsante */}
            <HStack position="absolute" top={6} right={6} zIndex={1000} spacing={2}>
              <IconButton
                aria-label="Usar minha localização atual"
                icon={<FaLocationArrow />}
                onClick={handleGetCurrentLocation}
                colorScheme="blue"
                isRound
                size="lg"
                shadow="xl"
                isLoading={isLoading && !isSearchingLocation}
                _hover={{ 
                  transform: 'scale(1.1)',
                  shadow: '2xl'
                }}
                transition="all 0.2s"
                bg="blue.500"
                color="white"
                sx={pulseAnimation}
              />
            </HStack>
            <MapContainer 
              center={mapCenter} 
              zoom={DEFAULT_ZOOM} 
              style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
              whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
            >
              <ChangeMapView coords={mapCenter} />
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; OpenStreetMap' 
              />
              <Marker position={[formData.coordenadas.lat, formData.coordenadas.lng]} />
              <MapEvents onLocationSelect={handleMapClick} />
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
              <Text fontSize="sm" color={labelColor} textAlign="center" fontWeight="medium">
                💡 Clique no mapa para selecionar a localização exata do problema
              </Text>
            </Box>
          </Box>

          {/* Endereço Selecionado */}
          {displayAddress && (
            <Box 
              bgGradient={addressBoxBg}
              p={6}
              borderRadius="2xl"
              borderWidth="2px"
              borderColor={addressBoxBorder}
              shadow="xl"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-10px"
                right="-10px"
                w="100px"
                h="100px"
                bgGradient="radial(circle, blue.400, transparent)"
                opacity={0.1}
                pointerEvents="none"
              />
              
              <HStack spacing={4} position="relative">
                <Icon as={FaMapMarkerAlt} color="blue.500" boxSize={8} />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontWeight="bold" color={useColorModeValue('blue.700', 'blue.200')} fontSize="lg">
                    📍 Localização Confirmada
                  </Text>
                  <Text 
                    color={useColorModeValue('blue.600', 'blue.300')} 
                    fontSize="md"
                    fontWeight="medium"
                  >
                    {displayAddress}
                  </Text>
                </VStack>
                <Badge 
                  colorScheme="green" 
                  variant="solid" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                  fontSize="xs"
                >
                  ✓ Confirmado
                </Badge>
              </HStack>
            </Box>
          )}

          {/* Formulário Principal */}
          <Box
            as="form"
            onSubmit={handleSubmit}
            bg={cardBg}
            borderRadius="2xl"
            p={{ base: 6, md: 10 }}
            shadow="2xl"
            borderWidth="1px"
            borderColor={cardBorder}
            position="relative"
            overflow="hidden"
          >
            {/* Efeito de fundo */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              h="4px"
              bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
            />
            
            <VStack spacing={8} position="relative">
              <HStack w="100%" justify="space-between" align="center">
                <HStack>
                  <Icon as={FaExclamationTriangle} color="orange.500" boxSize={6} />
                  <Heading size="lg" color={labelColor} fontWeight="bold">
                    📝 Detalhes do Problema
                  </Heading>
                </HStack>
                {selectedProblemType && (
                  <Badge 
                    colorScheme={selectedProblemType.color} 
                    variant="subtle" 
                    px={4} 
                    py={2} 
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {selectedProblemType.icon} {selectedProblemType.label}
                  </Badge>
                )}
              </HStack>

              <Flex direction={{ base: "column", lg: "row" }} gap={8} w="100%">
                <VStack spacing={6} flex={1}>
                  {/* Título */}
                  <FormControl isRequired isInvalid={!!validationErrors.titulo}>
                    <FormLabel fontWeight="bold" color={labelColor} fontSize="md">
                      📌 Título do Problema
                    </FormLabel>
                    <Input
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      placeholder="Ex: Buraco grande na Rua das Flores"
                      size="lg"
                      bg={inputBg}
                      border="2px solid transparent"
                      _hover={{ 
                        bg: inputHoverBg,
                        borderColor: 'blue.300'
                      }}
                      _focus={{ 
                        bg: inputFocusBg,
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      borderRadius="xl"
                      fontSize="lg"
                    />
                    {validationErrors.titulo && <FormErrorMessage>{validationErrors.titulo}</FormErrorMessage>}
                  </FormControl>

                  {/* Tipo do Problema */}
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold" color={labelColor} fontSize="md">
                      🏷️ Categoria do Problema
                    </FormLabel>
                    <Select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleChange}
                      placeholder="Selecione a categoria"
                      size="lg"
                      bg={inputBg}
                      border="2px solid transparent"
                      _hover={{ 
                        bg: inputHoverBg,
                        borderColor: 'blue.300'
                      }}
                      _focus={{ 
                        bg: inputFocusBg,
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      borderRadius="xl"
                      fontSize="lg"
                    >
                      {PROBLEM_TYPES.map(pt => (
                        <option key={pt.value} value={pt.value}>
                          {pt.icon} {pt.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </VStack>

                <VStack spacing={6} flex={1}>
                  {/* Descrição */}
                  <FormControl isRequired isInvalid={!!validationErrors.descricao}>
                    <FormLabel fontWeight="bold" color={labelColor} fontSize="md">
                      📄 Descrição Detalhada
                    </FormLabel>
                    <Textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Descreva o problema com detalhes: tamanho, localização específica, há quanto tempo existe, riscos que apresenta..."
                      rows={6}
                      resize="vertical"
                      size="lg"
                      bg={inputBg}
                      border="2px solid transparent"
                      _hover={{ 
                        bg: inputHoverBg,
                        borderColor: 'blue.300'
                      }}
                      _focus={{ 
                        bg: inputFocusBg,
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      borderRadius="xl"
                      fontSize="lg"
                    />
                    {validationErrors.descricao && <FormErrorMessage>{validationErrors.descricao}</FormErrorMessage>}
                  </FormControl>

                  {/* Upload de Foto */}
                  <FormControl isInvalid={!!validationErrors.foto}>
                    <FormLabel fontWeight="bold" color={labelColor} fontSize="md">
                      📸 Foto do Problema (Opcional)
                    </FormLabel>
                    <Box
                      position="relative"
                      w="100%"
                      h="120px"
                      borderRadius="xl"
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor={formData.foto ? 'green.300' : (validationErrors.foto ? 'red.300' : 'gray.300')}
                      bg={formData.foto ? 'green.50' : (validationErrors.foto ? 'red.50' : inputBg)}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      transition="all 0.3s"
                      _hover={{
                        borderColor: formData.foto ? 'green.400' : 'blue.400',
                        bg: formData.foto ? 'green.100' : inputHoverBg,
                        transform: 'scale(1.02)'
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                      />
                      
                      <VStack spacing={3}>
                        <Icon 
                          as={FaImage} 
                          boxSize={8} 
                          color={formData.foto ? 'green.500' : 'gray.400'} 
                        />
                        <VStack spacing={1}>
                          <Text 
                            fontWeight="medium" 
                            color={formData.foto ? 'green.600' : labelColor}
                            fontSize="md"
                            textAlign="center"
                          >
                            {formData.foto ? '✅ Foto Selecionada' : '📱 Clique para adicionar foto'}
                          </Text>
                          {formData.foto ? (
                            <Text fontSize="sm" color="green.500" textAlign="center">
                              {formData.foto.name}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                              Formatos: JPG, PNG, JPEG
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                      
                      {formData.foto && (
                        <Badge
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="green"
                          variant="solid"
                          borderRadius="full"
                          px={2}
                          py={1}
                        >
                          ✓
                        </Badge>
                      )}
                    </Box>
                    {validationErrors.foto && <FormErrorMessage>{validationErrors.foto}</FormErrorMessage>}
                  </FormControl>
                </VStack>
              </Flex>

              {/* Divider Estilizado */}
              <Box w="100%" position="relative" py={4}>
                <Divider borderColor={useColorModeValue('gray.300', 'gray.600')} />
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  bg={cardBg}
                  px={4}
                  py={2}
                  borderRadius="full"
                  border="2px solid"
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                >
                  <Text fontSize="sm" color={labelColor} fontWeight="bold">
                    🚀 Finalizar Relato
                  </Text>
                </Box>
              </Box>

              {/* Botão de Envio */}
              <Box w="100%" maxW="500px" mx="auto">
                <HStack spacing={3} justify="center">
                  <Button
                    type="submit"
                    size="lg"
                    w="100%"
                    h="60px"
                    colorScheme="blue"
                    bgGradient="linear(to-r, blue.500, purple.500)"
                    color="white"
                    fontWeight="bold"
                    fontSize="lg"
                    borderRadius="2xl"
                    isLoading={isLoading}
                    loadingText="Enviando Relato..."
                    leftIcon={<Icon as={FaPaperPlane} boxSize={5} />}
                    shadow="2xl"
                    _hover={{
                      bgGradient: "linear(to-r, blue.600, purple.600)",
                      transform: "translateY(-2px)",
                      shadow: "3xl"
                    }}
                    _active={{
                      transform: "translateY(0)",
                      shadow: "xl"
                    }}
                    transition="all 0.3s"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="0"
                      left="-100%"
                      w="100%"
                      h="100%"
                      bgGradient="linear(to-r, transparent, whiteAlpha.300, transparent)"
                      transform="skewX(-45deg)"
                      transition="left 0.6s"
                      _groupHover={{ left: "100%" }}
                    />
                    <Text position="relative" zIndex={1}>
                      ✨ Enviar Relato do Problema
                    </Text>
                  </Button>
                </HStack>
                
                {/* Texto informativo */}
                <Text
                  textAlign="center"
                  fontSize="sm"
                  color={useColorModeValue('gray.600', 'gray.400')}
                  mt={4}
                  px={4}
                >
                  🔒 Seus dados estão seguros. O relato será enviado para análise da administração pública.
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Rodapé informativo */}
          <Box
            bg={useColorModeValue('blue.50', 'blue.900')}
            borderRadius="xl"
            p={6}
            textAlign="center"
            borderWidth="1px"
            borderColor={useColorModeValue('blue.200', 'blue.700')}
          >
            <HStack justify="center" spacing={6} flexWrap="wrap">
              <VStack spacing={1}>
                <Text fontSize="2xl">⚡</Text>
                <Text fontSize="sm" fontWeight="bold" color={labelColor}>
                  Rápido
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="2xl">🎯</Text>
                <Text fontSize="sm" fontWeight="bold" color={labelColor}>
                  Preciso
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="2xl">🤝</Text>
                <Text fontSize="sm" fontWeight="bold" color={labelColor}>
                  Colaborativo
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="2xl">🌟</Text>
                <Text fontSize="sm" fontWeight="bold" color={labelColor}>
                  Eficiente
                </Text>
              </VStack>
            </HStack>
            <Text
              fontSize="md"
              color={useColorModeValue('blue.700', 'blue.200')}
              mt={4}
              fontWeight="medium"
            >
              Juntos, tornamos Uberaba uma cidade melhor! 🏙️✨
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}