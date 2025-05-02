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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { RelatosService, Relato } from '../services/relatosService';
import { useNavigate } from 'react-router-dom';

export default function Problemas() {
  const [problemas, setProblemas] = useState<Relato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    carregarProblemas();
  }, []);

  const carregarProblemas = async () => {
    try {
      const dados = await RelatosService.listarRelatos();
      setProblemas(dados);
    } catch (error) {
      console.error('Erro ao carregar problemas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendente: 'yellow',
      em_andamento: 'blue',
      resolvido: 'green',
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const problemasFiltrados = problemas.filter(problema => {
    const matchTipo = !filtroTipo || problema.tipo === filtroTipo;
    const matchStatus = !filtroStatus || problema.status === filtroStatus;
    const matchBusca = !busca || 
      problema.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      problema.endereco.rua.toLowerCase().includes(busca.toLowerCase()) ||
      problema.endereco.bairro.toLowerCase().includes(busca.toLowerCase());
    
    return matchTipo && matchStatus && matchBusca;
  });

  const formatarCoordenadas = (problema: Relato) => {
    let lat, lng;
    
    // Tentar obter coordenadas do objeto coordenadas
    if (problema.coordenadas) {
      if (typeof problema.coordenadas === 'object') {
        // Se for objeto com lat/lng
        if ('lat' in problema.coordenadas && 'lng' in problema.coordenadas) {
          lat = parseFloat(problema.coordenadas.lat.toString());
          lng = parseFloat(problema.coordenadas.lng.toString());
        }
        // Se for objeto com latitude/longitude
        else if ('latitude' in problema.coordenadas && 'longitude' in problema.coordenadas) {
          lat = parseFloat(problema.coordenadas.latitude.toString());
          lng = parseFloat(problema.coordenadas.longitude.toString());
        }
      }
    }
    // Tentar obter de propriedades diretas
    else if (problema.latitude && problema.longitude) {
      lat = parseFloat(problema.latitude.toString());
      lng = parseFloat(problema.longitude.toString());
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  };

  return (
    <Container maxW="container.xl" mt={{ base: "60px", md: "80px" }}>
      <VStack spacing={{ base: 4, md: 8 }} align="stretch">
        <Heading size={{ base: "lg", md: "xl" }}>Problemas Relatados</Heading>

        {/* Barra de Filtros */}
        <VStack spacing={4} align="stretch">
          {/* Busca e Botão */}
          <Flex gap={2}>
            <Input
              placeholder="Buscar problemas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              flex={1}
              size={{ base: "sm", md: "md" }}
            />
            <IconButton
              aria-label="Buscar"
              icon={<FaSearch />}
              colorScheme="blue"
              size={{ base: "sm", md: "md" }}
            />
          </Flex>

          {/* Filtros */}
          <Flex 
            gap={2} 
            direction={{ base: "column", sm: "row" }}
            wrap={{ base: "nowrap", sm: "wrap" }}
          >
            <Select
              placeholder="Tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              size={{ base: "sm", md: "md" }}
              flex={{ base: "1", sm: "1" }}
            >
              <option value="buraco">Buraco na Via</option>
              <option value="iluminacao">Iluminação</option>
              <option value="lixo">Lixo</option>
              <option value="calcada">Calçada</option>
            </Select>
            <Select
              placeholder="Status"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              size={{ base: "sm", md: "md" }}
              flex={{ base: "1", sm: "1" }}
            >
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="resolvido">Resolvido</option>
            </Select>
          </Flex>
        </VStack>

        {isLoading ? (
          <Center py={8}>
            <Spinner size="xl" />
          </Center>
        ) : (
          <SimpleGrid 
            columns={{ base: 1, sm: 2, lg: 3 }} 
            spacing={{ base: 4, md: 6 }}
          >
            {problemasFiltrados.map(problema => (
              <Card 
                key={problema.id} 
                onClick={() => {
                  const coordenadas = formatarCoordenadas(problema);
                  if (coordenadas) {
                    navigate('/mapa', { 
                      state: { 
                        selectedProblem: {
                          ...problema,
                          coordenadas
                        } 
                      } 
                    });
                  } else {
                    toast({
                      title: 'Erro',
                      description: 'Não foi possível localizar as coordenadas deste problema no mapa.',
                      status: 'error',
                      duration: 3000,
                    });
                  }
                }} 
                cursor="pointer"
                _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
                h="fit-content"
              >
                <CardBody>
                  {problema.foto && (
                    <Box
                      position="relative"
                      mb={4}
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      <Image
                        src={problema.foto}
                        alt={problema.titulo}
                        w="100%"
                        h={{ base: "200px", md: "250px" }}
                        objectFit="cover"
                      />
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme={getStatusColor(problema.status)}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {problema.status.replace('_', ' ')}
                      </Badge>
                    </Box>
                  )}
                  <VStack align="stretch" spacing={2}>
                    <Heading 
                      size={{ base: "sm", md: "md" }}
                      noOfLines={2}
                    >
                      {problema.titulo}
                    </Heading>
                    <Text 
                      fontSize={{ base: "sm", md: "md" }}
                      color="gray.500"
                      noOfLines={1}
                    >
                      {[
                        problema.endereco.rua,
                        problema.endereco.numero,
                        problema.endereco.bairro,
                        `${problema.endereco.cidade}-${problema.endereco.estado}`
                      ].filter(Boolean).join(', ')}
                    </Text>
                    <Text 
                      fontSize={{ base: "sm", md: "md" }}
                      noOfLines={2}
                    >
                      {problema.descricao}
                    </Text>
                    <Text 
                      fontSize="sm" 
                      color="gray.500"
                    >
                      Relatado em: {new Date(problema.dataCriacao).toLocaleDateString('pt-BR')}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
} 