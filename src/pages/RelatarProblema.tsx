import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  useToast, Text, Button, Container, FormControl, FormLabel,
  Input, Textarea, VStack, Select, Heading, IconButton, Box, FormErrorMessage,
  Icon, InputGroup, InputLeftElement, Divider,
  useColorModeValue // Hook para cores dinâmicas de modo claro/escuro
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FaLocationArrow, FaImage, FaPaperPlane, FaMapMarkerAlt } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { verificarConteudoInadequado } from '../utils/contentFilter';
import { RelatosService } from '../services/relatosService';
import { auth } from '../config/firebase';

// --- Constantes ---
const DEFAULT_CENTER: L.LatLngTuple = [-19.7487, -47.9386]; // Uberaba Coordinates
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

// --- Tipos e Interfaces ---
interface FormDataState {
  titulo: string;
  descricao: string;
  tipo: string;
  foto: File | null; // foto continua podendo ser null inicialmente
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
  // 1. Atualizar o estado validationErrors para incluir a foto
  const [validationErrors, setValidationErrors] = useState<{ titulo?: string; descricao?: string; foto?: string }>({});
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mapCenter, setMapCenter] = useState<L.LatLngTuple>(DEFAULT_CENTER);
  useEffect(() => {
    setMapCenter([formData.coordenadas.lat, formData.coordenadas.lng]);
  }, [formData.coordenadas]);

  // --- Handlers e Lógica ---
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
      // Limpar erro da foto ao selecionar uma imagem
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
      toast({ title: "Localização atualizada", status: "info", duration: 2000, isClosable: true });
    } catch (error: any) {
      console.error('Erro ao buscar endereço por coordenadas:', error);
      toast({
        title: 'Erro ao buscar endereço',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleMapClick = useCallback((lat: number, lng: number) => { getAddressFromCoords(lat, lng); }, [getAddressFromCoords]);

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
          toast({
            title: 'Erro ao obter localização',
            description: 'Não foi possível obter sua localização. Verifique as permissões.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: 'Geolocalização não suportada',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [getAddressFromCoords, toast]);

  // 2. Modificar validateForm para incluir a validação da foto
  const validateForm = useCallback(() => {
    let errors: { titulo?: string; descricao?: string; foto?: string } = {}; // Adicionar foto aqui
    let isValid = true;

    if (!formData.titulo.trim()) {
        errors.titulo = 'O título é obrigatório.';
        isValid = false;
    } else {
        const { valido: tituloValido, mensagem: msgTitulo } = verificarConteudoInadequado(formData.titulo);
        if (!tituloValido) {
          errors.titulo = msgTitulo || 'O título contém palavras inadequadas.';
          isValid = false;
        }
    }


    if (!formData.descricao.trim()) {
        errors.descricao = 'A descrição é obrigatória.';
        isValid = false;
    } else {
        const { valido: descricaoValida, mensagem: msgDescricao } = verificarConteudoInadequado(formData.descricao);
        if (!descricaoValida) {
          errors.descricao = msgDescricao || 'A descrição contém palavras inadequadas.';
          isValid = false;
        }
    }

    if (!formData.tipo) {
        // Você pode adicionar uma mensagem específica para o tipo se desejar,
        // mas o handleSubmit já verifica os campos obrigatórios de forma geral.
        // Se quiser uma mensagem no campo:
        // errors.tipo = 'O tipo do problema é obrigatório.'; // Precisaria adicionar 'tipo' em validationErrors
        isValid = false;
    }

    if (!formData.foto) { // Verificação da foto
      errors.foto = 'Uma imagem é obrigatória para o relato.';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [formData.titulo, formData.descricao, formData.tipo, formData.foto]); // Adicionar formData.foto e formData.tipo

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!auth.currentUser) {
      toast({ title: 'Usuário não autenticado', description: 'Login necessário.', status: 'error', duration: 3000, isClosable: true });
      navigate('/login');
      return;
    }

    // 3. Ajustar handleSubmit para usar a nova validação
    // A verificação de campos obrigatórios gerais pode ser removida ou ajustada
    // já que validateForm agora cuida disso de forma mais específica.

    // if (!formData.titulo || !formData.descricao || !formData.tipo || !formData.foto) { // Adicionada verificação de foto aqui também
    //   toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos obrigatórios, incluindo a foto.', status: 'warning', duration: 3000, isClosable: true });
    //   // Disparar a validação para mostrar os erros nos campos
    //   validateForm();
    //   return;
    // }

    if (!validateForm()) { // A chamada a validateForm já define os erros e retorna se é válido
      toast({ title: 'Campos inválidos ou faltando', description: 'Verifique os campos destacados e forneça uma imagem.', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    // O if acima já garante que formData.foto não é null, mas o TypeScript pode não inferir isso
    // dentro do try/catch ou em outras funções. Por isso, mantemos a verificação ou usamos "!"
    if (!formData.foto) {
        // Esta verificação é redundante se validateForm funcionar corretamente,
        // mas é uma salvaguarda.
        toast({ title: 'Erro interno', description: 'A foto não foi processada corretamente.', status: 'error', duration: 3000, isClosable: true });
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
      // formData.foto aqui não será null devido à validação
      await RelatosService.adicionarRelato(relatoParaEnviar, formData.foto);
      toast({ title: 'Problema relatado com sucesso!', status: 'success', duration: 3000, isClosable: true });
      navigate('/problemas');
    } catch (error: any)
    {
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

  // --- Definições de Cores para Modo Claro/Escuro ---
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

  const inputHoverBg = useColorModeValue("gray.200", "whiteAlpha.100"); // Ajustado para padrão Chakra dark filled hover
  const inputFocusBorderColor = useColorModeValue('blue.500', 'blue.300');

  const fileInputIconColor = useColorModeValue('gray.400', 'gray.500');
  const fileInputTextColor = useColorModeValue('gray.500', 'gray.400');
  const dividerBorderColor = useColorModeValue('gray.300', 'gray.500');

  // --- Renderização com Cores Dinâmicas ---
  return (
    <Container maxW="container.lg" mt={{ base: "70px", md: "90px" }} py={{ base: 6, md: 10 }}>
      <VStack spacing={10} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" color={headingColor} fontWeight="bold">
          Relatar um Novo Problema
        </Heading>

        <Box
          position="relative"
          h={{ base: "350px", md: "450px" }}
          borderRadius="xl"
          overflow="hidden"
          shadow="2xl"
          borderWidth="1px"
          borderColor={mapBorderColor}
        >
          <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
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
            isLoading={isLoading && !formData.rua}
          />
        </Box>

        {displayAddress && (
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg={addressBoxBg}
            borderColor={addressBoxBorder}
            shadow="sm"
            display="flex"
            alignItems="center"
          >
            <Icon as={FaMapMarkerAlt} color={addressIconColor} mr={3} w={5} h={5} />
            <Box>
              <Text fontWeight="semibold" color={addressTextSemiboldColor}>Localização Selecionada:</Text>
              <Text fontSize="sm" color={addressTextSmColor}>{displayAddress}</Text>
            </Box>
          </Box>
        )}

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg={formCardBg}
          p={{ base: 6, md: 8 }}
          borderRadius="xl"
          shadow="xl"
          borderWidth="1px"
          borderColor={formCardBorder}
        >
          <VStack spacing={6} align="stretch">
            <FormControl isRequired isInvalid={!!validationErrors.titulo}>
              <FormLabel htmlFor="titulo" fontWeight="semibold" color={formLabelColor}>Título do Problema</FormLabel>
              <Input
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ex: Buraco na calçada da Rua Principal"
                variant="filled"
                size="lg"
                _hover={{ bg: inputHoverBg }}
                focusBorderColor={inputFocusBorderColor}
              />
              {validationErrors.titulo && <FormErrorMessage>{validationErrors.titulo}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired /* Adicionar isInvalid e FormErrorMessage se quiser validação visual para tipo */>
              <FormLabel htmlFor="tipo" fontWeight="semibold" color={formLabelColor}>Tipo do Problema</FormLabel>
              <Select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                placeholder="Selecione o tipo"
                variant="filled"
                size="lg"
                 _hover={{ bg: inputHoverBg }}
                focusBorderColor={inputFocusBorderColor}
              >
                {PROBLEM_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </Select>
              {/* Adicionar FormErrorMessage para 'tipo' se implementado em validationErrors */}
            </FormControl>

            <FormControl isRequired isInvalid={!!validationErrors.descricao}>
              <FormLabel htmlFor="descricao" fontWeight="semibold" color={formLabelColor}>Descrição Detalhada</FormLabel>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Forneça detalhes sobre o problema..."
                rows={5}
                variant="filled"
                size="lg"
                _hover={{ bg: inputHoverBg }}
                focusBorderColor={inputFocusBorderColor}
              />
              {validationErrors.descricao && <FormErrorMessage>{validationErrors.descricao}</FormErrorMessage>}
            </FormControl>

            {/* 4. Ajustar FormControl da foto */}
            <FormControl isRequired isInvalid={!!validationErrors.foto}>
              <FormLabel htmlFor="foto-display" fontWeight="semibold" color={formLabelColor}>Foto do Problema</FormLabel>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" h="100%">
                  <Icon as={FaImage} color={fileInputIconColor} />
                </InputLeftElement>
                <input type='file' accept="image/*" name="foto" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                <Input
                  id="foto-display"
                  placeholder={formData.foto ? formData.foto.name : "Clique para selecionar uma imagem"}
                  onClick={() => fileInputRef.current?.click()}
                  readOnly
                  variant="filled"
                  cursor="pointer"
                  pl="2.8rem" /* Ajuste o padding se necessário para o ícone */
                  _hover={{ bg: inputHoverBg }}
                  focusBorderColor={inputFocusBorderColor}
                  // Adicionar estilo de borda de erro se inválido
                  borderColor={validationErrors.foto ? 'red.500' : undefined}
                  _focus={{
                    borderColor: validationErrors.foto ? 'red.500' : inputFocusBorderColor,
                    boxShadow: validationErrors.foto ? `0 0 0 1px red.500` : undefined,
                  }}

                />
              </InputGroup>
              {validationErrors.foto && <FormErrorMessage>{validationErrors.foto}</FormErrorMessage>}
              {formData.foto && !validationErrors.foto && ( // Mostrar nome do arquivo apenas se não houver erro
                <Text fontSize="xs" mt={1.5} color={fileInputTextColor}>
                  Arquivo: {formData.foto.name} (Clique no campo acima para alterar)
                </Text>
              )}
            </FormControl>

            <Divider my={3} borderColor={dividerBorderColor} />

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="100%"
              mt={2}
              isLoading={isLoading}
              loadingText="Enviando Relato..."
              leftIcon={<Icon as={FaPaperPlane} />}
              shadow="md"
            >
              Enviar Relato
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}