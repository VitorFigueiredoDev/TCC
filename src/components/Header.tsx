import {
  Box,
  Flex,
  Button,
  IconButton,
  useColorMode,
  Text,
  HStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FaSun, FaMoon, FaUser, FaExclamationCircle, FaList, FaMap, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { getDatabase, ref, get } from 'firebase/database';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const handleAuthChange = async (user: any) => {
      setIsAuthenticated(!!user);
      try {
        if (user) {
          // Verifica se o usuário é admin no Realtime Database
          const database = getDatabase();
          const adminRef = ref(database, `admins/${user.uid}`);
          const adminSnapshot = await get(adminRef);
          setIsAdmin(adminSnapshot.exists());
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
        setIsAdmin(false);
      }
    };

    const unsubscribe = AuthService.addAuthStateListener(handleAuthChange);
    
    // Verifica o estado inicial de autenticação
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      handleAuthChange(currentUser);
    }

   
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      toast({
        title: 'Logout realizado com sucesso',
        status: 'success',
        duration: 3000,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box 
      px={4} 
      py={4} 
      position="static" 
      bg={bgColor}
      boxShadow="md"
      zIndex={9999}
      height="64px"
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

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Button
                  leftIcon={<FaCog />}
                  variant="ghost"
                  onClick={() => navigate('/admin')}
                >
                  Admin
                </Button>
              )}
              <IconButton
                aria-label="Sair"
                icon={<FaSignOutAlt />}
                variant="ghost"
                onClick={handleLogout}
              />
            </>
          ) : (
            <>
              <Button
                leftIcon={<FaUser />}
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/cadastro')}
              >
                Cadastro
              </Button>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}