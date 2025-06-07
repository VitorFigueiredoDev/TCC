import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  useToast, Text, Button, Container, FormControl, FormLabel,
  Input, Textarea, VStack, Select, Heading, IconButton, Box, FormErrorMessage,
  Icon, InputGroup, InputLeftElement, Divider,
  useColorModeValue, InputRightElement
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { FaLocationArrow, FaImage, FaPaperPlane, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  { value: 'buraco', label: 'Buraco na Via' },
  { value: 'iluminacao', label: 'Problema de Iluminação' },
  { value: 'lixo', label: 'Descarte Irregular de Lixo' },
  { value: 'calcada', label: 'Calçada Danificada' },
  { value: 'sinalizacao', label: 'Problema de Sinalização' },
  { value: 'outros', label: 'Outros' },
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
      toast({ title: "Localização atualizada", status: "info", duration: 2000, isClosable: true });
    } catch (error: any) {
      console.error('Erro ao buscar endereço por coordenadas:', error);
      toast({ title: 'Erro ao buscar endereço', description: error.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleMapClick = useCallback((lat: number, lng: number) => { getAddressFromCoords(lat, lng); }, [getAddressFromCoords]);

  // --- FUNÇÃO COM VIEWBOX ---
  const handleSearchLocation = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Digite um local para pesquisar", status: "warning", duration: 2000, isClosable: true });
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
      toast({ title: "Localização encontrada!", status: "success", duration: 2000, isClosable: true });

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

    // A validação da foto foi removida para torná-la opcional.
    // Se uma foto for fornecida, você pode adicionar validações de tipo/tamanho aqui, se necessário.
    // Exemplo: if (formData.foto && formData.foto.size > MAX_SIZE) { errors.foto = 'Imagem muito grande'; isValid = false; }

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

    // A verificação de foto obrigatória foi removida daqui, pois a foto agora é opcional.
    // O serviço RelatosService.adicionarRelato já lida com a foto sendo null ou undefined.

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
      toast({ title: 'Problema relatado com sucesso!', status: 'success', duration: 3000, isClosable: true });
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

  // --- Cores ---
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const mapBorderColor = useColorModeValue('gray.200', 'gray.700');
  const addressBoxBg = useColorModeValue('blue.50', 'blue.800');
  const addressBoxBorder = useColorModeValue('blue.200', 'blue.700');
  const addressIconColor = useColorModeValue('blue.500', 'blue.300');
  const addressTextSemiboldColor = useColorModeValue('blue.700', 'blue.200');
  const addressTextSmColor = useColorModeValue('blue.600', 'blue.300');
  const formCardBg = useColorModeValue('white', 'gray.700');
  const formCardBorder = useColorModeValue('gray.100', 'gray.600');
  const formLabelColor = useColorModeValue('gray.600', 'gray.50');
  const inputHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const inputFocusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const fileInputIconColor = useColorModeValue('gray.400', 'gray.500');
  const fileInputTextColor = useColorModeValue('gray.500', 'gray.400');
  const dividerBorderColor = useColorModeValue('gray.300', 'gray.500');

  return (
    <Container maxW="container.lg" mt={{ base: "70px", md: "90px" }} py={{ base: 6, md: 10 }}>
      <VStack spacing={10} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" color={headingColor} fontWeight="bold">
          Relatar um Novo Problema
        </Heading>

        <FormControl>
          <FormLabel htmlFor="search-location" fontWeight="semibold" color={formLabelColor}>Pesquisar Localização (Uberaba)</FormLabel>
          <InputGroup size="lg">
            <Input
              id="search-location"
              placeholder="Digite um endereço, praça ou ponto de referência (Ex: Av. Getúlio Vargas, Centro)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
              variant="filled"
              _hover={{ bg: inputHoverBg }}
              focusBorderColor={inputFocusBorderColor}
            />
            <InputRightElement h="100%">
              <IconButton
                aria-label="Pesquisar localização"
                icon={<FaSearch />}
                onClick={handleSearchLocation}
                isLoading={isSearchingLocation}
                size="md"
                colorScheme="blue"
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Box
          position="relative"
          h={{ base: "350px", md: "450px" }}
          borderRadius="xl"
          overflow="hidden"
          shadow="2xl"
          borderWidth="1px"
          borderColor={mapBorderColor}
        >
          <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }} whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}>
            <ChangeMapView coords={mapCenter} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <Marker position={[formData.coordenadas.lat, formData.coordenadas.lng]} />
            <MapEvents onLocationSelect={handleMapClick} />
          </MapContainer>
          <IconButton
            aria-label="Usar minha localização atual"
            icon={<FaLocationArrow />}
            position="absolute"
            top={5}
            right={5}
            zIndex={1000}
            onClick={handleGetCurrentLocation}
            colorScheme="blue"
            isRound
            size="lg"
            shadow="lg"
            isLoading={isLoading && !isSearchingLocation}
          />
        </Box>

        {displayAddress && (
          <Box p={4} borderWidth="1px" borderRadius="lg" bg={addressBoxBg} borderColor={addressBoxBorder} shadow="sm" display="flex" alignItems="center">
            <Icon as={FaMapMarkerAlt} color={addressIconColor} mr={3} w={5} h={5} />
            <Box>
              <Text fontWeight="semibold" color={addressTextSemiboldColor}>Localização Selecionada:</Text>
              <Text fontSize="sm" color={addressTextSmColor}>{displayAddress}</Text>
            </Box>
          </Box>
        )}

        <Box as="form" onSubmit={handleSubmit} bg={formCardBg} p={{ base: 6, md: 8 }} borderRadius="xl" shadow="xl" borderWidth="1px" borderColor={formCardBorder}>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired isInvalid={!!validationErrors.titulo}>
              <FormLabel htmlFor="titulo" fontWeight="semibold" color={formLabelColor}>Título do Problema</FormLabel>
              <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ex: Buraco na calçada da Rua Principal" variant="filled" size="lg" _hover={{ bg: inputHoverBg }} focusBorderColor={inputFocusBorderColor} />
              {validationErrors.titulo && <FormErrorMessage>{validationErrors.titulo}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="tipo" fontWeight="semibold" color={formLabelColor}>Tipo do Problema</FormLabel>
              <Select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Selecione o tipo" variant="filled" size="lg" _hover={{ bg: inputHoverBg }} focusBorderColor={inputFocusBorderColor}>
                {PROBLEM_TYPES.map(pt => (<option key={pt.value} value={pt.value}>{pt.label}</option>))}
              </Select>
            </FormControl>

            <FormControl isRequired isInvalid={!!validationErrors.descricao}>
              <FormLabel htmlFor="descricao" fontWeight="semibold" color={formLabelColor}>Descrição Detalhada</FormLabel>
              <Textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Forneça detalhes sobre o problema..." rows={5} variant="filled" size="lg" _hover={{ bg: inputHoverBg }} focusBorderColor={inputFocusBorderColor} />
              {validationErrors.descricao && <FormErrorMessage>{validationErrors.descricao}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!validationErrors.foto}>
              <FormLabel htmlFor="foto-display" fontWeight="semibold" color={formLabelColor}>Foto do Problema</FormLabel>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" h="100%"> <Icon as={FaImage} color={fileInputIconColor} /> </InputLeftElement>
                <input type='file' accept="image/*" name="foto" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                <Input
                  id="foto-display"
                  placeholder={formData.foto ? formData.foto.name : "Clique para selecionar uma imagem"}
                  onClick={() => fileInputRef.current?.click()}
                  readOnly variant="filled" cursor="pointer" pl="2.8rem"
                  _hover={{ bg: inputHoverBg }}
                  focusBorderColor={inputFocusBorderColor}
                  borderColor={validationErrors.foto ? 'red.500' : undefined}
                   _focus={{
                       borderColor: validationErrors.foto ? 'red.500' : inputFocusBorderColor,
                       boxShadow: validationErrors.foto ? `0 0 0 1px var(--chakra-colors-red-500)` : `0 0 0 1px ${inputFocusBorderColor}`,
                   }}
                />
              </InputGroup>
              {validationErrors.foto && <FormErrorMessage>{validationErrors.foto}</FormErrorMessage>}
              {formData.foto && !validationErrors.foto && (
                <Text fontSize="xs" mt={1.5} color={fileInputTextColor}> Arquivo: {formData.foto.name} (Clique no campo acima para alterar) </Text>
              )}
            </FormControl>

            <Divider my={3} borderColor={dividerBorderColor} />

            <Button type="submit" colorScheme="blue" size="lg" w="100%" mt={2} isLoading={isLoading} loadingText="Enviando Relato..." leftIcon={<Icon as={FaPaperPlane} />} shadow="md" >
              Enviar Relato
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}