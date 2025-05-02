import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaUsers, FaClipboardList } from 'react-icons/fa';

export default function Home() {
  const navigate = useNavigate();
  const bgBox = useColorModeValue('gray.50', 'gray.700');

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={10} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center" py={10}>
          <Heading
            as="h1"
            size="2xl"
            mb={4}
            bgGradient="linear(to-r, blue.400, blue.600)"
            bgClip="text"
          >
            Fala Triângulo
          </Heading>
          <Text fontSize="xl" mb={8} color="gray.600" _dark={{ color: 'gray.300' }}>
            Sua plataforma para relatar e acompanhar problemas da sua cidade
          </Text>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => navigate('/relatar')}
          >
            Relatar um Problema
          </Button>
        </Box>

        {/* Features Section */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <Box p={6} rounded="lg" bg={bgBox} textAlign="center">
            <Icon as={FaMapMarkedAlt} w={10} h={10} color="blue.500" mb={4} />
            <Heading size="md" mb={3}>Mapeamento Preciso</Heading>
            <Text>Localize e reporte problemas com precisão usando nosso sistema de mapeamento integrado.</Text>
          </Box>

          <Box p={6} rounded="lg" bg={bgBox} textAlign="center">
            <Icon as={FaUsers} w={10} h={10} color="blue.500" mb={4} />
            <Heading size="md" mb={3}>Comunidade Engajada</Heading>
            <Text>Junte-se a outros cidadãos comprometidos em melhorar nossa cidade.</Text>
          </Box>

          <Box p={6} rounded="lg" bg={bgBox} textAlign="center">
            <Icon as={FaClipboardList} w={10} h={10} color="blue.500" mb={4} />
            <Heading size="md" mb={3}>Acompanhamento</Heading>
            <Text>Acompanhe o status e as atualizações dos problemas reportados.</Text>
          </Box>
        </SimpleGrid>

        {/* Call to Action */}
        <Box textAlign="center" py={10}>
          <Heading size="lg" mb={4}>
            Faça Parte da Mudança
          </Heading>
          <Text fontSize="lg" mb={6}>
            Ajude a construir uma cidade melhor para todos.
          </Text>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => navigate('/cadastro')}
          >
            Criar uma Conta
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}