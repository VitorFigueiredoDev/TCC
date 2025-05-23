import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Heading, Text, VStack, Box, useColorModeValue,
  Avatar, Spinner, Button, Alert, AlertIcon, Divider,
  SimpleGrid, Card, CardHeader, CardBody, Tag, Icon,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth'; // Import User type
import { FaSignOutAlt, FaEdit, FaExclamationCircle, FaListAlt, FaUserCircle } from 'react-icons/fa';

import { auth } from '../config/firebase'; // Seu arquivo de configuração do Firebase Auth
import { RelatosService, Relato } from '../services/relatosService'; // Seu serviço de relatos e tipo

// Interface para o estado do usuário, pode ser expandida
interface UserProfile extends User {
  // Adicione campos personalizados se você os armazena no Firestore/RTDB
}

// Componente para exibir um único relato
const RelatoItemCard: React.FC<{ relato: Relato }> = ({ relato }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const tagColorScheme = useColorModeValue('blue', 'teal');

  // Função para formatar data (exemplo simples)
  const formatDate = (date: any) => {
    if (!date) return 'Data não disponível';
    const d = date.toDate ? date.toDate() : new Date(date); // Handle Firebase Timestamp or JS Date
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <Card borderWidth="1px" borderColor={cardBorderColor} bg={cardBg} shadow="sm" borderRadius="md">
      <CardHeader pb={2}>
        <Heading size="sm" noOfLines={1}>{relato.titulo}</Heading>
      </CardHeader>
      <CardBody pt={0}>
        <Text fontSize="sm" color={textColor} mb={2}>
          Tipo: <Tag size="sm" colorScheme={tagColorScheme} variant="solid">{relato.tipo}</Tag>
        </Text>
        {relato.dataCriacao && (
          <Text fontSize="xs" color="gray.500">
            Relatado em: {formatDate(relato.dataCriacao)}
          </Text>
        )}
        {relato.status && (
            <Text fontSize="xs" color="gray.500">
                Status: <Tag size="sm" colorScheme={relato.status === 'resolvido' ? 'green' : 'yellow'}>{relato.status}</Tag>
            </Text>
        )}
        {/* Poderia adicionar um link para ver detalhes do relato se existir essa página */}
        {/* <Button size="xs" mt={2} variant="link" onClick={() => navigate(`/problemas/${relato.id}`)}>Ver Detalhes</Button> */}
      </CardBody>
    </Card>
  );
};


export default function Perfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingRelatos, setIsLoadingRelatos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cores e estilos dinâmicos
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('gray.50', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const containerMt = { base: "70px", md: "90px" }; // Consistente com RelatarProblema

  // Efeito para buscar dados do usuário
  useEffect(() => {
    console.log('Perfil: auth.onAuthStateChanged listener setup');
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('Perfil: auth.onAuthStateChanged triggered, currentUser:', currentUser);
      if (currentUser) {
        setUser(currentUser as UserProfile); // Cast para seu tipo UserProfile
        console.log('Perfil: User set:', currentUser);
        // Aqui você poderia buscar dados adicionais do perfil do Firestore/RTDB se necessário
        // Ex: const userProfileData = await fetchUserProfile(currentUser.uid);
        //    setUser({ ...currentUser, ...userProfileData });
      } else {
        console.log('Perfil: No user logged in, navigating to /login');
        navigate('/login'); // Redireciona se não estiver logado
      }
      setIsLoadingUser(false);
      console.log('Perfil: setIsLoadingUser(false)');
    });
    return () => {
      console.log('Perfil: auth.onAuthStateChanged listener cleanup');
      unsubscribe(); // Limpa o listener ao desmontar
    };
  }, [navigate]);

  // Efeito para buscar relatos do usuário
  useEffect(() => {
    console.log('Perfil: Relatos useEffect triggered, user:', user);
    if (user && user.uid) {
      setIsLoadingRelatos(true);
      console.log('Perfil: Fetching relatos for user:', user.uid);
      RelatosService.getRelatosPorUsuario(user.uid)
        .then((userRelatos) => {
          console.log('Perfil: Relatos fetched successfully:', userRelatos);
          setRelatos(userRelatos);
          setError(null);
        })
        .catch((err) => {
          console.error("Perfil: Erro ao buscar relatos:", err);
          setError("Não foi possível carregar seus relatos. Tente novamente mais tarde.");
        })
        .finally(() => {
          setIsLoadingRelatos(false);
          console.log('Perfil: setIsLoadingRelatos(false)');
        });
    } else {
      console.log('Perfil: Skipping relatos fetch, user is null or has no uid');
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    console.log('Perfil: handleLogout called');
    try {
      await auth.signOut();
      console.log('Perfil: User signed out, navigating to /login');
      navigate('/login');
    } catch (e) {
      console.error("Perfil: Erro ao fazer logout:", e);
      // Tratar erro de logout (ex: exibir toast)
    }
  }, [navigate]);

  console.log('Perfil: Rendering component, isLoadingUser:', isLoadingUser, 'user:', user, 'isLoadingRelatos:', isLoadingRelatos, 'relatos.length:', relatos.length, 'error:', error);

  if (isLoadingUser) {
    return (
      <Container centerContent mt={containerMt} py={{ base: 6, md: 10 }}>
        <Spinner size="xl" />
        <Text mt={4}>Carregando perfil...</Text>
      </Container>
    );
  }

  if (!user) {
    // Normalmente o useEffect já redirecionaria, mas é uma salvaguarda.
    return (
      <Container centerContent mt={containerMt} py={{ base: 6, md: 10 }}>
        <Alert status="warning">
          <AlertIcon />
          Você não está autenticado. Redirecionando para login...
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" mt={containerMt} py={{ base: 6, md: 10 }}>
      <VStack spacing={8} align="stretch">
        <Card p={6} bg={cardBg} borderWidth="1px" borderColor={cardBorderColor} borderRadius="xl" shadow="lg">
          <VStack spacing={4} align="center">
            <Avatar
              size="2xl"
              name={user.displayName || user.email || undefined}
              src={user.photoURL || undefined}
              icon={<FaUserCircle fontSize="3.5rem" />} // Ícone padrão maior
              borderWidth="3px"
              borderColor={useColorModeValue('blue.500', 'blue.300')}
            />
            <Heading as="h1" size="lg" color={headingColor} textAlign="center">
              {user.displayName || 'Usuário'}
            </Heading>
            <Text color={textColor} fontSize="md" textAlign="center">
              {user.email}
            </Text>
            <HStack spacing={4} mt={2}>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                leftIcon={<Icon as={FaEdit} />}
                onClick={() => navigate('/perfil/editar')} // Placeholder para página de edição
              >
                Editar Perfil
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                variant="ghost"
                leftIcon={<Icon as={FaSignOutAlt} />}
                onClick={handleLogout}
              >
                Sair
              </Button>
            </HStack>
          </VStack>
        </Card>

        <Divider my={6} />

        <Box>
          <Heading as="h2" size="lg" mb={6} color={headingColor} display="flex" alignItems="center">
            <Icon as={FaListAlt} mr={3} /> Meus Relatos
          </Heading>
          {isLoadingRelatos ? (
            <VStack>
              <Spinner />
              <Text>Carregando seus relatos...</Text>
            </VStack>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon as={FaExclamationCircle} />
              {error}
            </Alert>
          ) : relatos.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {relatos.map((relato) => (
                <RelatoItemCard key={relato.id} relato={relato} />
              ))}
            </SimpleGrid>
          ) : (
            <Text color={textColor} textAlign="center" p={5} borderWidth="1px" borderStyle="dashed" borderRadius="md" borderColor={cardBorderColor}>
              Você ainda não fez nenhum relato.
            </Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
}