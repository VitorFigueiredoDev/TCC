import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  Image,
  HStack,
  Select,
  Input,
  VStack,
  IconButton,
  Flex,
  Spinner,
  Center,
  useToast,
  useColorModeValue,
  Button,
  InputGroup,
  InputLeftElement,
  Stack,
  Icon, // Certifique-se que Icon está importado
} from '@chakra-ui/react';
import { FaSearch, FaTimesCircle, FaMapMarkedAlt } from 'react-icons/fa'; // FaMapMarkedAlt para o ícone de endereço
import { RelatosService, Relato } from '../services/relatosService'; // Assegure que Relato esteja exportado ou definido aqui
import { useNavigate } from 'react-router-dom';

// Interface Relato (se não estiver vindo de relatosService)
// export interface Endereco { // Mova para um arquivo de tipos se usado em múltiplos lugares
//   rua?: string;
//   numero?: string;
//   bairro?: string;
//   cidade?: string;
//   estado?: string;
//   cep?: string;
// }
// export interface Relato {
//   id: string;
//   titulo: string;
//   descricao: string;
//   foto?: string;
//   tipo: string; // 'buraco' | 'iluminacao' | 'lixo' | 'calcada' | string;
//   status: string; // 'pendente' | 'em_andamento' | 'resolvido' | 'recusado' | string;
//   dataCriacao: string;
//   latitude?: number | string;
//   longitude?: number | string;
//   coordenadas?:
//     | { latitude: number | string; longitude: number | string }
//     | { lat: number | string; lng: number | string }
//     | [number | string, number | string];
//   endereco?: Endereco;
// }


// Constantes para opções de filtro e imagens
const TIPO_OPTIONS = [
  { value: 'buraco', label: 'Buraco na Via' },
  { value: 'iluminacao', label: 'Iluminação Pública' },
  { value: 'lixo', label: 'Lixo/Entulho' },
  { value: 'calcada', label: 'Calçada Danificada' },
  { value: 'sinalizacao', label: 'Problema de Sinalização' },
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'resolvido', label: 'Resolvido' },
  { value: 'recusado', label: 'Recusado' },
];

const MAP_TIPO_TO_IMG: Record<string, string> = {
  buraco: '/imagens/Buraco na Via.jpg',
  iluminacao: '/imagens/Problema de Iluminação.jpg',
  lixo: '/imagens/Descarte irregular de Lixo.jpg',
  calcada: '/imagens/Calçada Danificada.jpg',
  sinalizacao: '/imagens/problema sinlizaçao.jpg',
  outros: '/imagens/Outros.jpg', // Fallback
};

export default function Problemas() {
  const [problemas, setProblemas] = useState<Relato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const [fuse, setFuse] = useState<Fuse<Relato> | null>(null);

  // Cores para tema claro/escuro (Hooks chamados incondicionalmente no topo)
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'white');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputIconColor = useColorModeValue('gray.400', 'gray.500'); // Hoisted
  const dateTextColor = useColorModeValue('gray.500', 'gray.400'); // Hoisted
  const containerMt = useColorModeValue("60px", "60px"); // Hoisted

  useEffect(() => {
    const carregarProblemas = async () => {
      setIsLoading(true);
      try {
        const dados = await RelatosService.listarRelatos();
        const ordenados = dados.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
        setProblemas(ordenados);
      } catch (error) {
        console.error('Erro ao carregar problemas:', error);
        toast({
          title: 'Erro ao carregar problemas',
          description: 'Não foi possível buscar os dados. Tente novamente mais tarde.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    carregarProblemas();
  }, [toast]);

  useEffect(() => {
    if (problemas.length > 0) {
      const fuseOptions = {
        keys: ['titulo', 'descricao', 'endereco.rua', 'endereco.bairro'],
        includeScore: true,
        threshold: 0.4, // Ajuste o threshold conforme necessário
      };
      setFuse(new Fuse(problemas, fuseOptions));
    }
  }, [problemas]);

  const getStatusColorScheme = (status: string): string => {
    const colors: Record<string, string> = {
      pendente: 'yellow',
      em_andamento: 'blue',
      resolvido: 'green',
      recusado: 'red',
    };
    return colors[status?.toLowerCase()] || 'gray';
  };

  const problemasFiltrados = useMemo(() => {
    let resultados = problemas;

    // Aplicar filtros de tipo e status primeiro
    if (filtroTipo) {
      resultados = resultados.filter(problema => problema.tipo === filtroTipo);
    }
    if (filtroStatus) {
      resultados = resultados.filter(problema => problema.status === filtroStatus);
    }

    // Aplicar busca com Fuse.js se houver termo de busca e fuse estiver inicializado
    if (busca.trim() && fuse) {
      const fuseResult = fuse.search(busca.trim());
      resultados = fuseResult.map(result => result.item);
    } else if (busca.trim()) {
      // Fallback para busca simples se fuse não estiver pronto ou busca for simples demais
      const searchLower = busca.toLowerCase();
      resultados = resultados.filter(problema =>
        problema.titulo?.toLowerCase().includes(searchLower) ||
        problema.descricao?.toLowerCase().includes(searchLower) ||
        problema.endereco?.rua?.toLowerCase().includes(searchLower) ||
        problema.endereco?.bairro?.toLowerCase().includes(searchLower)
      );
    }
    return resultados;
  }, [problemas, filtroTipo, filtroStatus, busca, fuse]);

  const formatarCoordenadas = (problema: Relato) => {
    let lat, lng;
    if (problema.coordenadas) {
      if (typeof problema.coordenadas === 'object' && !Array.isArray(problema.coordenadas)) {
        const coordsObj = problema.coordenadas as any;
        if (coordsObj.lat !== undefined && coordsObj.lng !== undefined) {
          lat = parseFloat(String(coordsObj.lat));
          lng = parseFloat(String(coordsObj.lng));
        } else if (coordsObj.latitude !== undefined && coordsObj.longitude !== undefined) {
          lat = parseFloat(String(coordsObj.latitude));
          lng = parseFloat(String(coordsObj.longitude));
        }
      } else if (Array.isArray(problema.coordenadas) && problema.coordenadas.length === 2) {
        lat = parseFloat(String(problema.coordenadas[0]));
        lng = parseFloat(String(problema.coordenadas[1]));
      }
    } else if ('latitude' in problema && 'longitude' in problema && problema.latitude && problema.longitude) {
      lat = parseFloat(String((problema as any).latitude));
      lng = parseFloat(String((problema as any).longitude));
    }
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  };

  const handleCardClick = (problema: Relato) => {
    const coordenadas = formatarCoordenadas(problema);
    if (coordenadas) {
      navigate('/mapa', {
        state: {
          selectedProblem: { ...problema, coordenadas }
        }
      });
    } else {
      toast({
        title: 'Coordenadas não encontradas',
        description: 'Não foi possível localizar este problema no mapa.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroStatus('');
    setBusca('');
  };

  const formatProblemType = (typeKey: string): string => {
    const foundType = TIPO_OPTIONS.find(opt => opt.value === typeKey);
    return foundType ? foundType.label : (typeKey ? typeKey.charAt(0).toUpperCase() + typeKey.slice(1) : 'Não especificado');
  };

  const formatProblemStatus = (statusKey: string): string => {
    const foundStatus = STATUS_OPTIONS.find(opt => opt.value === statusKey);
    return foundStatus ? foundStatus.label : (statusKey ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1).replace('_', ' ') : 'N/A');
  };

  return (
    <Container maxW="container.xl" py={{ base: 6, md: 8 }} mt={containerMt}>
      <VStack spacing={{ base: 5, md: 8 }} align="stretch">
        <Heading as="h1" size={{ base: "lg", md: "xl" }} color={headingColor} textAlign={{ base: "center", md: "left" }}>
          Problemas Relatados na Comunidade
        </Heading>

        <Card variant="outline" bg={cardBgColor} borderColor={cardBorderColor} borderRadius="lg" p={{base: 4, md: 5}}>
          <VStack spacing={4} align="stretch">
            <InputGroup size={{ base: "sm", md: "md" }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color={inputIconColor} /> {/* Usando variável */}
              </InputLeftElement>
              <Input
                placeholder="Buscar por título, descrição, rua ou bairro..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                bg={inputBgColor}
                borderRadius="md"
              />
            </InputGroup>
            <Stack direction={{ base: "column", md: "row" }} spacing={3} alignItems="center">
              <Select
                placeholder="Todos os Tipos"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                size={{ base: "sm", md: "md" }}
                bg={inputBgColor}
                borderRadius="md"
              >
                {TIPO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
              <Select
                placeholder="Todos os Status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                size={{ base: "sm", md: "md" }}
                bg={inputBgColor}
                borderRadius="md"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
              <Button
                leftIcon={<FaTimesCircle />}
                onClick={limparFiltros}
                size={{ base: "sm", md: "md" }}
                colorScheme="gray"
                variant="outline"
                flexShrink={0}
              >
                Limpar Filtros
              </Button>
            </Stack>
          </VStack>
        </Card>

        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" thickness="4px" color="blue.500" />
            <Text ml={3} color={textColor}>Carregando problemas...</Text>
          </Center>
        ) : problemasFiltrados.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
            {problemasFiltrados.map(problema => (
              <Card
                key={problema.id}
                onClick={() => handleCardClick(problema)}
                cursor="pointer"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{ transform: 'translateY(-8px) scale(1.02)', shadow: '2xl', borderColor: 'blue.400' }}
                bgGradient={useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'linear(to-br, gray.900, blue.900, purple.900)')}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                borderWidth="1px"
                overflow="hidden"
                borderRadius="2xl"
                shadow="xl"
                display="flex"
                flexDirection="column"
                position="relative"
              >
                <Box h="240px" overflow="hidden" position="relative">
                  <Image
                    src={problema.foto || MAP_TIPO_TO_IMG[problema.tipo] || MAP_TIPO_TO_IMG.outros}
                    alt={problema.titulo || 'Problema relatado'}
                    objectFit="cover"
                    w="full"
                    h="full"
                    fallbackSrc={MAP_TIPO_TO_IMG.outros}
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bgGradient={useColorModeValue('linear(to-t, blackAlpha.700, transparent)', 'linear(to-t, blackAlpha.900, transparent)')}
                  />
                  <HStack position="absolute" top={3} right={3} spacing={2} zIndex={2}>
                    <Badge
                      colorScheme={getStatusColorScheme(problema.status)}
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
                      <Icon as={FaMapMarkedAlt} boxSize={2.5} />
                      {formatProblemStatus(problema.status || 'N/A')}
                    </Badge>
                    <Badge
                      colorScheme="teal"
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
                      <Icon as={FaMapMarkedAlt} boxSize={2.5} />
                      {formatProblemType(problema.tipo || 'Outro')}
                    </Badge>
                  </HStack>
                  <Box position="absolute" bottom={3} left={3} right={3} zIndex={2}>
                    <Heading 
                      size="md" 
                      bgGradient={useColorModeValue('linear(to-r, blue.600, purple.600)', 'linear(to-r, blue.300, purple.300)')}
                      bgClip="text"
                      color="white"
                      noOfLines={2}
                      textShadow="0 2px 4px rgba(0,0,0,0.6)"
                      fontWeight="extrabold"
                    >
                      {problema.titulo || 'Título não informado'}
                    </Heading>
                  </Box>
                </Box>
                <CardBody p={6}>
                  <VStack align="stretch" spacing={5} flexGrow={1}>
                    <Text fontSize="sm" color={textColor} noOfLines={3} minH="60px">
                      {problema.descricao || 'Descrição não informada.'}
                    </Text>
                    <HStack spacing={2} align="flex-start">
                      <Icon as={FaMapMarkedAlt} color={useColorModeValue('blue.500', 'blue.300')} mt={0.5} flexShrink={0} />
                      <Text fontSize="sm" color={textColor} lineHeight="1.4">
                        {[
                          problema.endereco?.rua,
                          problema.endereco?.numero,
                          problema.endereco?.bairro,
                          `${problema.endereco?.cidade || ''}-${problema.endereco?.estado || ''}`,
                        ].filter(Boolean).join(', ')}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                      Relatado em: {new Date(problema.dataCriacao).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Center py={10}>
            <VStack spacing={3}>
              <Icon as={FaSearch} boxSize="30px" color={textColor}/>
              <Text color={textColor} fontSize="lg" fontWeight="medium">
                Nenhum problema encontrado.
              </Text>
              <Text color={textColor}>
                Tente ajustar seus filtros ou limpar a busca.
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Container>
  );
}