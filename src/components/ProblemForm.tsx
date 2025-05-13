import { Box, Button, FormControl, FormLabel, Input, Select, Textarea, VStack, useToast, HStack, IconButton, Text, Badge, Flex } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { LatLng } from 'leaflet';
import { Map } from './Map';
import { LocationService } from '../services/locationService';
import { ProblemService } from '../services/problemService';
import { FormData } from '../types';
import { FaLocationArrow, FaMapMarkerAlt } from 'react-icons/fa';

const defaultPosition = { lat: -19.7472, lng: -47.9381 }; // Uberaba-MG

const initialFormData: FormData = {
  titulo: '',
  categoria: '',
  descricao: '',
  endereco: {
    rua: '',
    numero: '',
    bairro: '',
    cidade: 'Uberaba',
    estado: 'MG'
  },
  coordenadas: defaultPosition,
  plusCode: ''
};

export function ProblemForm() {
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    // Obter localização inicial
    handleGetLocation();
    
    return () => {
      if (watchId !== null) {
        LocationService.stopWatching(watchId);
      }
    };
  }, []);

  const handleGetLocation = async () => {
    toast({
      title: 'Obtendo localização...',
      description: 'Por favor, aguarde enquanto obtemos sua localização.',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });

    try {
      const coords = await LocationService.getCurrentPosition();
      const newPosition = new LatLng(coords.lat, coords.lng);
      setPosition(newPosition);

      try {
        const endereco = await LocationService.getAddressFromCoords(coords);
        const plusCode = LocationService.generatePlusCode(coords);

        setFormData(prev => ({
          ...prev,
          coordenadas: coords,
          endereco,
          plusCode
        }));

        toast({
          title: 'Localização obtida com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (addressError) {
        console.error('Erro ao obter endereço:', addressError);
        setFormData(prev => ({
          ...prev,
          coordenadas: coords,
          plusCode: LocationService.generatePlusCode(coords)
        }));

        toast({
          title: 'Localização obtida parcialmente',
          description: 'Coordenadas encontradas, mas não foi possível obter o endereço completo.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      handleDefaultLocation();
    }
  };

  const handleDefaultLocation = () => {
    const defaultCoords = { lat: defaultPosition.lat, lng: defaultPosition.lng };
    const newPosition = new LatLng(defaultCoords.lat, defaultCoords.lng);
    setPosition(newPosition);
    
    setFormData(prev => ({
      ...prev,
      coordenadas: defaultCoords
    }));

    toast({
      title: 'Erro ao obter localização',
      description: 'Por favor, permita o acesso à sua localização ou selecione manualmente no mapa.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  const startLocationTracking = () => {
    setIsTracking(true);
    
    const id = LocationService.watchPosition(
      async (coords) => {
        const newPosition = new LatLng(coords.lat, coords.lng);
        const endereco = await LocationService.getAddressFromCoords(coords);
        const plusCode = LocationService.generatePlusCode(coords);

        setPosition(newPosition);
        setFormData(prev => ({
          ...prev,
          coordenadas: coords,
          endereco,
          plusCode
        }));
      },
      (error) => {
        console.error('Erro no rastreamento:', error);
        setIsTracking(false);
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      LocationService.stopWatching(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const toggleLocationTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const handleLocationSelect = async (latlng: LatLng) => {
    try {
      const coords = { lat: latlng.lat, lng: latlng.lng };
      setPosition(latlng);
      
      toast({
        title: 'Localização selecionada',
        description: 'Processando detalhes do local...',
        status: 'info',
        duration: 1000,
        isClosable: true,
      });
      
      // Atualizar imediatamente com as coordenadas
      setFormData(prev => ({
        ...prev,
        coordenadas: coords,
        plusCode: `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`,
        endereco: {
          ...prev.endereco,
          rua: 'Localização selecionada',
          bairro: 'Área marcada no mapa'
        }
      }));

      // Em segundo plano, tentar obter o endereço sem bloquear a UI
      try {
        const endereco = await LocationService.getAddressFromCoords(coords);
        // Só atualizar se tiver um endereço melhor
        if (endereco.rua || endereco.bairro) {
          setFormData(prev => ({
            ...prev,
            endereco
          }));
        }
      } catch (addressError) {
        console.error('Erro ao obter endereço:', addressError);
        // Já temos o endereço padrão definido acima, então não precisamos fazer nada aqui
      }
    } catch (error) {
      console.error('Erro ao selecionar localização:', error);
      toast({
        title: 'Erro ao selecionar localização',
        description: 'Por favor, tente novamente ou use outra forma de selecionar a localização.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!position) {
      toast({
        title: 'Localização necessária',
        description: 'Por favor, obtenha sua localização atual ou selecione um ponto no mapa.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!formData.titulo || !formData.categoria) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o título e a categoria do problema.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      // Garantir que temos pelo menos alguma informação de endereço
      if (!formData.endereco.rua && !formData.endereco.bairro) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            rua: 'Localização selecionada',
            bairro: 'Área marcada no mapa'
          }
        }));
      }

      await ProblemService.addProblem(formData);
      
      setFormData(initialFormData);
      setPosition(null);
      stopLocationTracking();

      toast({
        title: 'Problema relatado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao adicionar problema:', error);
      toast({
        title: 'Erro ao adicionar problema',
        description: 'Ocorreu um erro ao tentar adicionar o problema. Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box 
      w="full" 
      maxW={{ base: "100%", md: "container.md" }} 
      mx="auto" 
      px={{ base: 2, sm: 4, md: 6 }}
      py={{ base: 2, sm: 4, md: 8 }}
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          <Box 
            p={{ base: 3, md: 4 }} 
            borderRadius="lg" 
            shadow="md"
            borderWidth="1px"
            borderColor="gray.200"
            _dark={{ borderColor: "gray.600" }}
          >
            <FormControl mb={{ base: 2, md: 4 }}>
              <HStack 
                justify="space-between" 
                align="center" 
                mb={{ base: 2, md: 3 }} 
                flexWrap="wrap" 
                gap={2}
                flexDir={{ base: "column", sm: "row" }}
                alignItems={{ base: "stretch", sm: "center" }}
              >
                <FormLabel 
                  fontSize={{ base: "md", md: "lg" }} 
                  fontWeight="bold" 
                  m={0}
                  color="blue.600"
                  _dark={{ color: "blue.200" }}
                  width={{ base: "full", sm: "auto" }}
                  textAlign={{ base: "center", sm: "left" }}
                >
                  Sua localização
                </FormLabel>
                <HStack 
                  spacing={2} 
                  width={{ base: "full", sm: "auto" }}
                  justifyContent={{ base: "center", sm: "flex-end" }}
                >
                  <Button
                    leftIcon={<FaLocationArrow />}
                    colorScheme={isTracking ? "red" : "blue"}
                    onClick={toggleLocationTracking}
                    size={{ base: "sm", md: "md" }}
                    fontWeight="medium"
                    rounded="md"
                    shadow="sm"
                    flex={{ base: 1, sm: "auto" }}
                    _dark={{ 
                      bg: isTracking ? "red.500" : "blue.500",
                      _hover: {
                        bg: isTracking ? "red.600" : "blue.600"
                      }
                    }}
                  >
                    {isTracking ? "Parar" : "Rastrear"}
                  </Button>
                  {!isTracking && (
                    <IconButton
                      aria-label="Obter localização atual"
                      icon={<FaMapMarkerAlt />}
                      onClick={handleGetLocation}
                      size={{ base: "sm", md: "md" }}
                      colorScheme="green"
                      rounded="md"
                      shadow="sm"
                      _dark={{ 
                        bg: "green.500",
                        _hover: { bg: "green.600" }
                      }}
                    />
                  )}
                </HStack>
              </HStack>

              {formData.plusCode && (
                <Flex 
                  align="center" 
                  mb={{ base: 2, md: 3 }} 
                  bg="gray.50" 
                  _dark={{ bg: "gray.700" }}
                  p={2} 
                  borderRadius="md"
                  flexWrap="wrap"
                  gap={1}
                  justifyContent={{ base: "center", sm: "flex-start" }}
                >
                  <Text mr={1} fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Plus Code:</Text>
                  <Badge colorScheme="purple" fontSize="sm" p={1} fontFamily="mono">
                    {formData.plusCode}
                  </Badge>
                </Flex>
              )}

              {(formData.endereco.rua || formData.endereco.bairro) && (
                <Box 
                  mb={{ base: 2, md: 3 }}
                  p={{ base: 2, md: 3 }}
                  borderWidth="1px" 
                  borderRadius="md" 
                  bg="blue.50"
                  _dark={{ bg: "blue.900", borderColor: "blue.700" }}
                  borderColor="blue.100"
                >
                  <Text fontSize="sm" color="blue.800" _dark={{ color: "blue.100" }}>
                    {LocationService.formatAddress(formData.endereco)}
                  </Text>
                </Box>
              )}

              <Box height="400px" borderRadius="md" overflow="hidden" mb={4} position="relative">
                <Box position="relative" height="100%" width="100%">
                  {!position && (
                    <Box 
                      position="absolute" 
                      zIndex="10" 
                      top="50%" 
                      left="50%" 
                      transform="translate(-50%, -50%)" 
                      bg="rgba(0,0,0,0.7)" 
                      color="white" 
                      p={4} 
                      borderRadius="md"
                      textAlign="center"
                      maxW="280px"
                    >
                      <Text fontWeight="bold">Instruções</Text>
                      <Text fontSize="sm">Clique em qualquer lugar do mapa para selecionar uma localização ou use o botão para obter sua localização atual.</Text>
                    </Box>
                  )}
                  <IconButton
                    aria-label="Obter localização atual"
                    icon={<FaMapMarkerAlt />}
                    onClick={handleGetLocation}
                    position="absolute"
                    top="50%"
                    right={4}
                    transform="translateY(-50%)"
                    zIndex={1000}
                    colorScheme="green"
                    size="lg"
                    shadow="lg"
                    borderWidth="2px"
                    borderColor="white"
                    _hover={{ 
                      transform: 'translateY(-50%) scale(1.1)',
                      shadow: 'xl'
                    }}
                    _active={{
                      transform: 'translateY(-50%) scale(0.95)'
                    }}
                    transition="all 0.2s"
                  />
                  <Map
                    center={position ? [position.lat, position.lng] : [defaultPosition.lat, defaultPosition.lng]}
                    selectedLocation={position ? [position.lat, position.lng] : null}
                    categoria={formData.categoria || 'outros'}
                    onLocationSelect={(coords: [number, number]) => {
                      const latlng = new LatLng(coords[0], coords[1]);
                      handleLocationSelect(latlng);
                    }}
                    isTracking={isTracking}
                  />
                </Box>
              </Box>
            </FormControl>
          </Box>

          <Box 
            p={{ base: 3, md: 4 }}
            borderRadius="lg" 
            shadow="md"
            borderWidth="1px"
            borderColor="gray.200"
            _dark={{ borderColor: "gray.600" }}
          >
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="medium" color="gray.700" _dark={{ color: "gray.200" }}>
                  Título do Problema
                </FormLabel>
                <Input
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Buraco na calçada"
                  size={{ base: "md", md: "lg" }}
                  borderColor="gray.300"
                  _dark={{ 
                    borderColor: "gray.600",
                    _placeholder: { color: "gray.400" }
                  }}
                  _focus={{ 
                    borderColor: "blue.400", 
                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" 
                  }}
                  _hover={{ borderColor: "gray.400" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="medium" color="gray.700" _dark={{ color: "gray.200" }}>
                  Categoria
                </FormLabel>
                <Select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  placeholder="Selecione uma categoria"
                  size={{ base: "md", md: "lg" }}
                  borderColor="gray.300"
                  _dark={{ 
                    borderColor: "gray.600",
                    _placeholder: { color: "gray.400" }
                  }}
                  _focus={{ 
                    borderColor: "blue.400", 
                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" 
                  }}
                  _hover={{ borderColor: "gray.400" }}
                  icon={<FaLocationArrow color="gray.300" />}
                >
                  <option value="infraestrutura">Infraestrutura</option>
                  <option value="iluminacao">Iluminação</option>
                  <option value="limpeza">Limpeza</option>
                  <option value="seguranca">Segurança</option>
                  <option value="outros">Outros</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="medium" color="gray.700" _dark={{ color: "gray.200" }}>
                  Descrição
                </FormLabel>
                <Textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o problema em detalhes"
                  rows={4}
                  size={{ base: "md", md: "lg" }}
                  borderColor="gray.300"
                  _dark={{ 
                    borderColor: "gray.600",
                    _placeholder: { color: "gray.400" }
                  }}
                  _focus={{ 
                    borderColor: "blue.400", 
                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" 
                  }}
                  _hover={{ borderColor: "gray.400" }}
                  resize="vertical"
                />
              </FormControl>
            </VStack>
          </Box>

          <Button 
            type="submit" 
            size={{ base: "md", md: "lg" }}
            colorScheme="blue"
            shadow="md"
            _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
            _dark={{ bg: "blue.400", _hover: { bg: "blue.300" } }}
            transition="all 0.2s"
            rounded="md"
            fontWeight="semibold"
            h={{ base: "40px", md: "48px" }}
            width="100%"
          >
            Enviar Relato
          </Button>
        </VStack>
      </form>
    </Box>
  );
}