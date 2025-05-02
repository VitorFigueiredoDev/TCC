import {
  Box,
  Flex,
  Button,
  IconButton,
  useColorMode,
  Text,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaSun, FaMoon, FaUser, FaExclamationCircle, FaList, FaMap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box 
      px={4} 
      py={2} 
      position="fixed" 
      top={0} 
      left={0} 
      right={0} 
      bg={bgColor}
      boxShadow="sm"
      zIndex={1000}
    >
      <Flex maxW="container.xl" mx="auto" justify="space-between" align="center">
        <Text
          fontSize="xl"
          fontWeight="bold"
          cursor="pointer"
          onClick={() => navigate('/')}
        >
          Fala Triângulo
        </Text>

        <HStack spacing={4}>
          <Button
            leftIcon={<FaExclamationCircle />}
            colorScheme="blue"
            variant="ghost"
            onClick={() => navigate('/relatar')}
          >
            Relatar Problema
          </Button>

          <Button
            leftIcon={<FaList />}
            variant="ghost"
            onClick={() => navigate('/problemas')}
          >
            Ver Problemas
          </Button>

          <Button
            leftIcon={<FaMap />}
            variant="ghost"
            onClick={() => navigate('/mapa')}
          >
            Mapa
          </Button>

          <IconButton
            aria-label={`Alternar para modo ${colorMode === 'light' ? 'escuro' : 'claro'}`}
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            variant="ghost"
          />

          <IconButton
            aria-label="Perfil"
            icon={<FaUser />}
            variant="ghost"
            onClick={() => navigate('/login')}
          />
        </HStack>
      </Flex>
    </Box>
  );
} 