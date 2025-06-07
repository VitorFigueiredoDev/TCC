import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Heading, Text, VStack, Box, useColorModeValue,
  Avatar, Spinner, Button, Alert, AlertIcon, Divider,
  SimpleGrid, Card, CardHeader, CardBody, Tag, Icon,
  HStack, useToast, IconButton, Flex, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea, Badge, Image,
  useBreakpointValue, Skeleton, SkeletonText, Progress, useMediaQuery,
  useDisclosure
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  FaSignOutAlt, FaEdit, FaExclamationCircle, FaListAlt, 
  FaUserCircle, FaTrash, FaCalendarAlt, FaMapMarkerAlt,
  FaEye, FaSave, FaTimes, FaClock, FaCheckCircle,
  FaHourglassHalf, FaFlag, FaBell, FaComments
} from 'react-icons/fa';
import { auth } from '../config/firebase';
import { RelatosService, Relato as RelatoType } from '../services/relatosService';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

// Interface para o estado do usuário
interface UserProfile extends User {}

// Interface para endereço
interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

// Interface ajustada para Relato
interface Relato {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'resolvido';
  prioridade: 'alta' | 'media' | 'baixa';
  tipo: string;
  dataCriacao: string;
  imagem?: string;
  endereco: Endereco;
  resposta?: string;
}

// Mapeamento de tipos para imagens (igual ao Admin)
const MAP_TIPO_TO_IMG: Record<string, string> = {
  buraco: '/imagens/Buraco na Via.jpg',
  iluminacao: '/imagens/Problema de Iluminação.jpg',
  lixo: '/imagens/Descarte irregular de Lixo.jpg',
  calcada: '/imagens/Calçada Danificada.jpg',
  sinalizacao: '/imagens/problema sinlizaçao.jpg',
  outros: '/imagens/Outros.jpg',
};

// Funções auxiliares movidas para fora do componente
const formatDate = (date: any) => {
  if (!date) return 'Data não disponível';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusIcon = (status: string) => {
  const icons = {
    pendente: FaClock,
    em_andamento: FaHourglassHalf,
    resolvido: FaCheckCircle,
  };
  return icons[status as keyof typeof icons] || FaClock;
};

const getStatusColor = (status: string) => {
  const colors = {
    pendente: 'orange',
    em_andamento: 'blue',
    resolvido: 'green',
  };
  return colors[status as keyof typeof colors] || 'gray';
};

const getPriorityIcon = (prioridade: string) => {
  return FaFlag;
};

const getPriorityColor = (prioridade: string) => {
  const colors = {
    alta: 'red',
    media: 'yellow',
    baixa: 'green',
  };
  return colors[prioridade as keyof typeof colors] || 'gray';
};

const genericProblemSvg = `
  <svg width="100%" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f7fafc;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#edf2f7;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="150" cy="80" r="25" fill="#cbd5e0" opacity="0.6"/>
    <rect x="130" y="105" width="40" height="3" rx="1.5" fill="#cbd5e0" opacity="0.6"/>
    <rect x="120" y="115" width="60" height="2" rx="1" fill="#cbd5e0" opacity="0.4"/>
    <text x="50%" y="75%" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#718096" text-anchor="middle">
      Sem imagem disponível
    </text>
  </svg>
`;

const RelatoItemCard: React.FC<{
  relato: Relato;
  onDelete: (id: string) => void;
  onEdit?: (relato: Relato) => void;
  onConversa?: (relato: Relato) => void;
}> = ({ relato, onDelete, onEdit, onConversa }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const overlayGradient = useColorModeValue(
    'linear(to-t, blackAlpha.600, transparent)',
    'linear(to-t, blackAlpha.800, transparent)'
  );
  const toast = useToast();
  const navigate = useNavigate();

  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(genericProblemSvg)}`;
  const imageSrc = relato.imagem || MAP_TIPO_TO_IMG[relato.tipo] || MAP_TIPO_TO_IMG.outros || svgUrl;

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este relato?')) {
      try {
        await onDelete(relato.id);
        toast({
          title: 'Relato excluído',
          description: 'O relato foi excluído com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Erro ao excluir relato:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o relato.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

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
          alt={relato.titulo}
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
            colorScheme={getStatusColor(relato.status)}
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
            <Icon as={getStatusIcon(relato.status)} boxSize={2.5} />
            {relato.status.replace('_', ' ')}
          </Badge>
          <Badge
            colorScheme={getPriorityColor(relato.prioridade)}
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
            <Icon as={getPriorityIcon(relato.prioridade)} boxSize={2.5} />
            {relato.prioridade}
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
            {relato.titulo}
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
            {relato.descricao || 'Sem descrição disponível'}
          </Text>
          <HStack spacing={2} align="flex-start">
            <Icon as={FaMapMarkerAlt} color={accentColor} mt={0.5} flexShrink={0} />
            <Text fontSize="sm" color={textColor} lineHeight="1.4">
              {[
                relato.endereco.rua,
                relato.endereco.numero,
                relato.endereco.bairro,
                `${relato.endereco.cidade}-${relato.endereco.estado}`,
              ].filter(Boolean).join(', ')}
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Icon as={FaCalendarAlt} color={accentColor} />
            <Text fontSize="sm" color={textColor}>
              Relatado em {formatDate(relato.dataCriacao)}
            </Text>
          </HStack>
          <Divider />
          <HStack spacing={3} justify="flex-end">
            <IconButton
              icon={<FaEdit />}
              aria-label="Editar"
              size="sm"
              variant="ghost"
              colorScheme="blue"
              borderRadius="full"
              transition="all 0.2s"
              _hover={{ bg: 'blue.50', transform: 'scale(1.1)' }}
              onClick={() => onEdit?.(relato)}
            />
            <IconButton
              icon={<FaTrash />}
              aria-label="Excluir"
              size="sm"
              variant="ghost"
              colorScheme="red"
              borderRadius="full"
              transition="all 0.2s"
              _hover={{ bg: 'red.50', transform: 'scale(1.1)' }}
              onClick={handleDelete}
            />
            {relato.resposta && (
              <Button
                leftIcon={<FaComments />}
                colorScheme="blue"
                size="sm"
                variant="outline"
                onClick={() => onConversa?.(relato)}
              >
                Conversa
              </Button>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Custom hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Pull to refresh component
const PullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}> = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const isMobile = useIsMobile();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box
      position="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'pan-y',
      }}
    >
      {pullDistance > 0 && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={`${pullDistance}px`}
          bg={useColorModeValue('whiteAlpha.800', 'gray.800')}
          backdropFilter="blur(8px)"
          zIndex={1000}
          transition="all 0.2s"
        >
          <VStack spacing={2}>
            <Spinner
              size="md"
              color="blue.500"
              transform={`rotate(${pullDistance * 3.6}deg)`}
            />
            <Text fontSize="sm" color="gray.500">
              {pullDistance > 50 ? 'Solte para atualizar' : 'Arraste para atualizar'}
            </Text>
          </VStack>
        </Box>
      )}
      <Box
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default function Perfil() {
  // Todos os hooks devem estar no topo, antes de qualquer return condicional
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const gradientBg = useColorModeValue(
    'linear(135deg, blue.400, purple.500)',
    'linear(135deg, blue.600, purple.700)'
  );
  const avatarBorderColor = useColorModeValue('blue.500', 'blue.300');
  const modalBg = useColorModeValue('white', 'gray.800');
  const containerMt = { base: "70px", md: "90px" };
  const isMobile = useIsMobile();

  // Estados
  const [user, setUser] = useState<UserProfile | null>(null);
  const [relatosPessoais, setRelatosPessoais] = useState<Relato[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingRelatos, setIsLoadingRelatos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelato, setSelectedRelato] = useState<Relato | null>(null);
  const [tituloEditado, setTituloEditado] = useState('');
  const [descricaoEditada, setDescricaoEditada] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalConversaOpen, setModalConversaOpen] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [statusSelecionado, setStatusSelecionado] = useState<string | null>(null);
  const [prioridadeSelecionada, setPrioridadeSelecionada] = useState<string | null>(null);

  // Todos os hooks acima do return condicional
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser as UserProfile);
      } else {
        setUser(null); // Garante que user seja null
        setIsLoadingUser(false);
        navigate('/login');
      }
      setIsLoadingUser(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingRelatos(true);
      RelatosService.getRelatosPorUsuario(user.uid)
        .then((userRelatos) => {
          setRelatosPessoais(userRelatos);
          setError(null);
        })
        .catch(() => {
          setError("Não foi possível carregar seus relatos. Tente novamente mais tarde.");
        })
        .finally(() => {
          setIsLoadingRelatos(false);
        });
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      const adminRef = ref(database, `admins/${user.uid}`);
      onValue(adminRef, (snapshot) => {
        setIsAdmin(snapshot.exists());
      });
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
    }
  }, [navigate]);

  const handleEditRelato = useCallback((relato: Relato) => {
    setSelectedRelato(relato);
    setTituloEditado(relato.titulo);
    setDescricaoEditada(relato.descricao);
    onOpen();
  }, [onOpen]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedRelato) return;

    setIsUpdating(true);
    try {
      await RelatosService.atualizarRelato(selectedRelato.id, {
        titulo: tituloEditado,
        descricao: descricaoEditada,
      });

      const updatedRelatos = relatosPessoais.map((r) =>
        r.id === selectedRelato.id
          ? { ...r, titulo: tituloEditado, descricao: descricaoEditada }
          : r
      );
      setRelatosPessoais(updatedRelatos);

      toast({
        title: 'Relato atualizado',
        description: 'O relato foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar relato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o relato.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [selectedRelato, tituloEditado, descricaoEditada, relatosPessoais, toast, onClose]);

  const handleDeleteRelato = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este relato?')) {
      try {
        await RelatosService.excluirRelato(id);
        setRelatosPessoais(relatosPessoais.filter(r => r.id !== id));
        toast({
          title: 'Relato excluído',
          description: 'O relato foi excluído com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Erro ao excluir relato:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o relato.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [relatosPessoais, toast]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    if (!user?.uid) return;
    
    if (!isAdmin && !relatosPessoais.some(r => r.id === id)) {
      toast({
        title: 'Erro de permissão',
        description: 'Você não tem permissão para atualizar este relato.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await RelatosService.atualizarStatus(id, newStatus);
      toast({
        title: 'Status atualizado',
        description: 'O status do relato foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do relato.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [user, isAdmin, relatosPessoais, toast]);

  const handleRefresh = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoadingRelatos(true);
    try {
      const userRelatos = await RelatosService.getRelatosPorUsuario(user.uid);
      setRelatosPessoais(userRelatos);
      setError(null);
      toast({
        title: 'Atualizado',
        description: 'Seus relatos foram atualizados com sucesso.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      setError("Não foi possível atualizar seus relatos. Tente novamente mais tarde.");
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar seus relatos.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingRelatos(false);
    }
  }, [user, toast]);

  if (isLoadingUser) {
    return (
      <Container centerContent mt={containerMt} py={{ base: 6, md: 10 }}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={textColor} fontSize="lg">Carregando perfil...</Text>
          <Progress size="sm" isIndeterminate colorScheme="blue" w="200px" />
        </VStack>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container centerContent mt={containerMt} py={{ base: 6, md: 10 }}>
        <Alert status="warning" borderRadius="xl" shadow="lg">
          <AlertIcon />
          Você não está autenticado. Redirecionando para login...
        </Alert>
      </Container>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <Container 
        maxW="container.xl" 
        mt={isMobile ? "60px" : "90px"} 
        py={{ base: 4, md: 10 }}
        px={{ base: 4, md: 6 }}
      >
        <VStack spacing={isMobile ? 4 : 8} align="stretch">
          <Card 
            bg={cardBg} 
            borderRadius={isMobile ? "xl" : "3xl"} 
            shadow="2xl" 
            overflow="hidden" 
            border="none"
          >
            <Box bgGradient={gradientBg} px={isMobile ? 4 : 8} py={isMobile ? 8 : 12}>
              <VStack spacing={isMobile ? 4 : 6} align="center">
                <Box position="relative">
                  <Avatar
                    size={isMobile ? "xl" : "2xl"}
                    name={user.displayName || user.email || undefined}
                    src={user.photoURL || undefined}
                    icon={<FaUserCircle fontSize={isMobile ? "3rem" : "4rem"} />}
                    borderWidth="4px"
                    borderColor="white"
                    shadow="xl"
                  />
                  <Box
                    position="absolute"
                    bottom={2}
                    right={2}
                    bg="green.500"
                    w={isMobile ? 4 : 6}
                    h={isMobile ? 4 : 6}
                    borderRadius="full"
                    border="3px solid white"
                  />
                </Box>
                <VStack spacing={2}>
                  <Heading 
                    as="h1" 
                    size={isMobile ? "lg" : "xl"} 
                    color="white" 
                    textAlign="center" 
                    fontWeight="bold"
                  >
                    {user.displayName || 'Usuário'}
                  </Heading>
                  <Text 
                    color="whiteAlpha.900" 
                    fontSize={isMobile ? "md" : "lg"} 
                    textAlign="center"
                  >
                    {user.email}
                  </Text>
                </VStack>
                <HStack 
                  spacing={isMobile ? 2 : 4} 
                  flexWrap="wrap" 
                  justify="center"
                  w="full"
                >
                  <Button
                    size={isMobile ? "md" : "lg"}
                    bg="whiteAlpha.200"
                    color="white"
                    leftIcon={<Icon as={FaEdit} />}
                    borderRadius="full"
                    px={isMobile ? 4 : 8}
                    _hover={{ bg: 'whiteAlpha.300', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    backdropFilter="blur(10px)"
                    onClick={() => navigate('/perfil/editar')}
                    w={isMobile ? "full" : "auto"}
                  >
                    Editar Perfil
                  </Button>
                  <Button
                    size={isMobile ? "md" : "lg"}
                    variant="outline"
                    color="white"
                    borderColor="whiteAlpha.400"
                    leftIcon={<Icon as={FaSignOutAlt} />}
                    borderRadius="full"
                    px={isMobile ? 4 : 8}
                    _hover={{ 
                      bg: 'whiteAlpha.200', 
                      borderColor: 'white',
                      transform: 'translateY(-2px)'
                    }}
                    transition="all 0.2s"
                    onClick={handleLogout}
                    w={isMobile ? "full" : "auto"}
                  >
                    Sair
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Card>
          <Box>
            <HStack spacing={4} mb={8} align="center">
              <Box
                p={3}
                bg={useColorModeValue('blue.50', 'blue.900')}
                borderRadius="xl"
              >
                <Icon as={FaListAlt} boxSize={6} color="blue.500" />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading as="h2" size="xl" color={headingColor} fontWeight="bold">
                  Meus Relatos
                </Heading>
                <Text color={textColor} fontSize="md">
                  {relatosPessoais.length} relato{relatosPessoais.length !== 1 ? 's' : ''} encontrado{relatosPessoais.length !== 1 ? 's' : ''}
                </Text>
              </VStack>
            </HStack>
            {isLoadingRelatos ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} borderRadius="2xl" overflow="hidden">
                    <Skeleton height="180px" />
                    <CardBody p={5}>
                      <VStack align="stretch" spacing={4}>
                        <SkeletonText noOfLines={2} spacing={2} />
                        <SkeletonText noOfLines={3} spacing={2} />
                        <Skeleton height="20px" />
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            ) : error ? (
              <Alert status="error" borderRadius="xl" shadow="lg">
                <AlertIcon as={FaExclamationCircle} />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Erro ao carregar relatos</Text>
                  <Text fontSize="sm">{error}</Text>
                </VStack>
              </Alert>
            ) : relatosPessoais.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                {relatosPessoais.map((relato) => (
                  <RelatoItemCard
                    key={relato.id}
                    relato={relato}
                    onDelete={handleDeleteRelato}
                    onEdit={handleEditRelato}
                    onConversa={(r) => {
                      setRespostaSelecionada(r.resposta || null);
                      setStatusSelecionado(r.status);
                      setPrioridadeSelecionada(r.prioridade);
                      setModalConversaOpen(true);
                    }}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Box
                textAlign="center"
                p={12}
                borderWidth="2px"
                borderStyle="dashed"
                borderRadius="2xl"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                bg={useColorModeValue('gray.50', 'gray.800')}
              >
                <VStack spacing={4}>
                  <Box
                    p={4}
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    borderRadius="full"
                  >
                    <Icon as={FaListAlt} boxSize={8} color={textColor} />
                  </Box>
                  <VStack spacing={2}>
                    <Heading size="md" color={headingColor}>
                      Nenhum relato encontrado
                    </Heading>
                    <Text fontSize="md" color={textColor} maxW="400px">
                      Você ainda não fez nenhum relato. Que tal começar reportando um problema em sua cidade?
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="blue"
                    size="lg"
                    borderRadius="full"
                    px={8}
                    onClick={() => navigate('/relatar')}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    Fazer Primeiro Relato
                  </Button>
                </VStack>
              </Box>
            )}
          </Box>
          <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="2xl" 
            isCentered
            motionPreset="slideInBottom"
          >
            <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
            <ModalContent 
              bg={modalBg} 
              borderRadius="2xl" 
              shadow="2xl"
              mx={4}
              border="none"
            >
              <ModalHeader 
                borderBottom="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                borderTopRadius="2xl"
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <HStack spacing={3}>
                  <Box
                    p={2}
                    bg={useColorModeValue('blue.100', 'blue.800')}
                    borderRadius="lg"
                  >
                    <Icon as={FaEdit} color="blue.500" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold">Editar Relato</Text>
                    <Text fontSize="sm" color={textColor}>
                      Atualize as informações do seu relato
                    </Text>
                  </VStack>
                </HStack>
              </ModalHeader>
              <ModalCloseButton 
                borderRadius="full" 
                top={4} 
                right={4}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
              />
              <ModalBody p={8}>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold" 
                      color={headingColor}
                      mb={2}
                    >
                      Título do Relato
                    </FormLabel>
                    <Input
                      value={tituloEditado}
                      onChange={(e) => setTituloEditado(e.target.value)}
                      placeholder="Digite um título claro e descritivo"
                      size="lg"
                      borderRadius="xl"
                      focusBorderColor="blue.500"
                      isDisabled={isUpdating}
                      bg={useColorModeValue('white', 'gray.700')}
                      border="2px solid"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _hover={{
                        borderColor: useColorModeValue('gray.300', 'gray.500')
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                    />
                    <Text fontSize="sm" color={textColor} mt={1}>
                      {tituloEditado.length}/100 caracteres
                    </Text>
                  </FormControl>
                  <FormControl>
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold" 
                      color={headingColor}
                      mb={2}
                    >
                      Descrição Detalhada
                    </FormLabel>
                    <Textarea
                      value={descricaoEditada}
                      onChange={(e) => setDescricaoEditada(e.target.value)}
                      placeholder="Descreva o problema com mais detalhes..."
                      rows={6}
                      borderRadius="xl"
                      focusBorderColor="blue.500"
                      isDisabled={isUpdating}
                      bg={useColorModeValue('white', 'gray.700')}
                      border="2px solid"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _hover={{
                        borderColor: useColorModeValue('gray.300', 'gray.500')
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      resize="vertical"
                    />
                    <Text fontSize="sm" color={textColor} mt={1}>
                      {descricaoEditada.length}/500 caracteres
                    </Text>
                  </FormControl>
                  {selectedRelato && (
                    <Box
                      p={4}
                      bg={useColorModeValue('blue.50', 'blue.900')}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={useColorModeValue('blue.200', 'blue.700')}
                    >
                      <VStack align="start" spacing={3}>
                        <HStack spacing={2}>
                          <Icon as={FaMapMarkerAlt} color="blue.500" />
                          <Text fontSize="sm" fontWeight="semibold" color={headingColor}>
                            Localização
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={textColor} pl={6}>
                          {[
                            selectedRelato.endereco.rua,
                            selectedRelato.endereco.numero,
                            selectedRelato.endereco.bairro,
                            `${selectedRelato.endereco.cidade}-${selectedRelato.endereco.estado}`,
                          ].filter(Boolean).join(', ')}
                        </Text>
                        <HStack spacing={2}>
                          <Icon as={FaCalendarAlt} color="blue.500" />
                          <Text fontSize="sm" fontWeight="semibold" color={headingColor}>
                            Data do Relato
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={textColor} pl={6}>
                          {formatDate(selectedRelato.dataCriacao)}
                        </Text>
                        <HStack spacing={4} pt={2}>
                          <Badge
                            colorScheme={getStatusColor(selectedRelato.status)}
                            variant="solid"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize="xs"
                          >
                            {selectedRelato.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            colorScheme={getPriorityColor(selectedRelato.prioridade)}
                            variant="solid"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize="xs"
                          >
                            Prioridade {selectedRelato.prioridade}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter 
                borderTop="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                borderBottomRadius="2xl"
                bg={useColorModeValue('gray.50', 'gray.700')}
                p={6}
              >
                <HStack spacing={4} w="full" justify="flex-end">
                  <Button
                    size="lg"
                    variant="ghost"
                    leftIcon={<Icon as={FaTimes} />}
                    onClick={onClose}
                    isDisabled={isUpdating}
                    borderRadius="xl"
                    px={8}
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="lg"
                    colorScheme="blue"
                    leftIcon={<Icon as={FaSave} />}
                    onClick={handleSaveEdit}
                    isLoading={isUpdating}
                    loadingText="Salvando..."
                    borderRadius="xl"
                    px={8}
                    shadow="lg"
                    _hover={{ 
                      transform: 'translateY(-2px)',
                      shadow: 'xl'
                    }}
                    transition="all 0.2s"
                    isDisabled={!tituloEditado.trim() || !descricaoEditada.trim()}
                  >
                    Salvar Alterações
                  </Button>
                </HStack>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Modal isOpen={modalConversaOpen} onClose={() => setModalConversaOpen(false)} isCentered>
            <ModalOverlay />
            <ModalContent borderRadius="2xl" boxShadow="2xl" bg={useColorModeValue('white', 'gray.800')}>
              <ModalHeader display="flex" alignItems="center" gap={2} bg={useColorModeValue('blue.50', 'blue.900')} borderTopRadius="2xl">
                <Icon as={FaComments} color="blue.500" boxSize={6} mr={2} />
                <Text fontWeight="bold" fontSize="xl" color={useColorModeValue('blue.700', 'blue.200')}>Conversa com a Prefeitura</Text>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody p={8}>
                {respostaSelecionada ? (
                  <VStack align="center" spacing={6} w="full">
                    <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.100')} textAlign="center" fontWeight="medium">
                      <b>Mensagem do Admin:</b><br />
                      <span style={{ fontWeight: 400 }}>{respostaSelecionada}</span>
                    </Text>
                    <HStack spacing={4} justify="center">
                      {statusSelecionado && (
                        <Badge colorScheme={getStatusColor(statusSelecionado)} fontSize="md" px={4} py={2} borderRadius="lg" fontWeight="bold" boxShadow="md">
                          {statusSelecionado.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      {prioridadeSelecionada && (
                        <Badge colorScheme="yellow" fontSize="md" px={4} py={2} borderRadius="lg" fontWeight="bold" boxShadow="md">
                          Prioridade {prioridadeSelecionada.charAt(0).toUpperCase() + prioridadeSelecionada.slice(1)}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center">Nenhuma resposta registrada para este relato.</Text>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
    </PullToRefresh>
  );
}