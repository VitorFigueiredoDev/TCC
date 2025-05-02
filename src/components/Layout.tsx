import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  Link as ChakraLink, 
  Stack, 
  IconButton, 
  Drawer, 
  DrawerBody, 
  DrawerHeader, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerCloseButton, 
  useDisclosure, 
  VStack,
  useColorMode,
  useColorModeValue,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  Divider
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaHome, FaExclamationTriangle, FaList, FaBars, FaSun, FaMoon, FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { auth } from '../config/firebase';
import { useEffect, useState } from 'react';
import { RelatosService } from '../services/relatosService';
import { useToast } from '@chakra-ui/react';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const toast = useToast();
  
  // Cores responsivas ao tema
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentColor = useColorModeValue("blue.600", "blue.400");
  const activeBgColor = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const adminStatus = await RelatosService.isAdmin(user);
        setIsAdmin(adminStatus);
      }
    };

    checkAdmin();
    // Adicionar listener para mudanças de autenticação
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        checkAdmin();
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Verificar qual link está ativo com base no caminho atual
  const isActiveLink = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível realizar o logout.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Box 
        as="header" 
        position="static"
        top="0"
        left="0"
        right="0"
        zIndex="1000"
        borderBottomWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Container 
          maxW="container.xl" 
          px={{ base: 2, sm: 4, md: 6 }}
          py={{ base: 2, md: 3 }}
        >
          <Flex justify="space-between" align="center">
            {/* Logo */}
            <RouterLink to="/">
              <Heading 
                size={{ base: "sm", sm: "md" }} 
                color={accentColor}
                fontWeight="bold"
                display="flex"
                alignItems="center"
                letterSpacing="tight"
              >
                <Box as={FaExclamationTriangle} mr={{ base: 0, sm: 2 }} color={accentColor} />
                <Text display={{ base: "none", sm: "block" }}>CidadeAlerta</Text>
              </Heading>
            </RouterLink>

            {/* Menu Desktop */}
            <HStack 
              spacing={{ base: 2, md: 4 }} 
              display={{ base: "none", md: "flex" }}
            >
              <ChakraLink 
                as={RouterLink} 
                to="/" 
                px={3}
                py={2}
                rounded="md"
                bg={isActiveLink('/') ? activeBgColor : 'transparent'}
                color={isActiveLink('/') ? accentColor : textColor}
                _hover={{ bg: activeBgColor, color: accentColor }}
                fontSize={{ base: "sm", md: "md" }}
              >
                <HStack spacing={2}>
                  <FaHome />
                  <Text>Início</Text>
                </HStack>
              </ChakraLink>

              <ChakraLink 
                as={RouterLink} 
                to="/relatar" 
                px={3}
                py={2}
                rounded="md"
                bg={isActiveLink('/relatar') ? activeBgColor : 'transparent'}
                color={isActiveLink('/relatar') ? accentColor : textColor}
                _hover={{ bg: activeBgColor, color: accentColor }}
                fontSize={{ base: "sm", md: "md" }}
              >
                <HStack spacing={2}>
                  <FaExclamationTriangle />
                  <Text>Relatar</Text>
                </HStack>
              </ChakraLink>

              <ChakraLink 
                as={RouterLink} 
                to="/problemas" 
                px={3}
                py={2}
                rounded="md"
                bg={isActiveLink('/problemas') ? activeBgColor : 'transparent'}
                color={isActiveLink('/problemas') ? accentColor : textColor}
                _hover={{ bg: activeBgColor, color: accentColor }}
                fontSize={{ base: "sm", md: "md" }}
              >
                <HStack spacing={2}>
                  <FaList />
                  <Text>Problemas</Text>
                </HStack>
              </ChakraLink>

              {isAdmin && (
                <ChakraLink 
                  as={RouterLink} 
                  to="/admin" 
                  px={3}
                  py={2}
                  rounded="md"
                  bg={isActiveLink('/admin') ? activeBgColor : 'transparent'}
                  color={isActiveLink('/admin') ? accentColor : textColor}
                  _hover={{ bg: activeBgColor, color: accentColor }}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  <HStack spacing={2}>
                    <FaUserCog />
                    <Text>Admin</Text>
                  </HStack>
                </ChakraLink>
              )}
            </HStack>

            {/* Ações do Usuário */}
            <HStack spacing={{ base: 2, md: 3 }}>
              {/* Menu do usuário - Mostrar apenas em desktop */}
              {user ? (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<Avatar size="sm" name={user.email || undefined} bg="blue.500" color="white" />}
                    variant="ghost"
                    aria-label="Menu do usuário"
                    _hover={{ bg: 'transparent' }}
                    display={{ base: "none", md: "flex" }}
                  />
                  <MenuList>
                    <Text px={3} py={2} fontSize="sm" color="gray.500">
                      {user.email}
                    </Text>
                    <MenuItem 
                      icon={<FaSignOutAlt />} 
                      onClick={handleLogout}
                      color="red.500"
                    >
                      Sair
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="ghost"
                  size={{ base: "sm", md: "md" }}
                  display={{ base: "none", md: "flex" }}
                >
                  Entrar
                </Button>
              )}

              {/* Botão de tema - Mostrar apenas em desktop */}
              <IconButton
                aria-label="Alternar tema"
                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                onClick={toggleColorMode}
                variant="ghost"
                size={{ base: "sm", md: "md" }}
                display={{ base: "none", md: "flex" }}
              />

              {/* Botão do menu mobile */}
              <IconButton
                aria-label="Menu"
                icon={<FaBars />}
                onClick={onOpen}
                variant="ghost"
                display={{ base: "flex", md: "none" }}
                size={{ base: "sm", md: "md" }}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Drawer do Menu Mobile */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch" mt={4}>
              <ChakraLink 
                as={RouterLink} 
                to="/" 
                onClick={onClose}
                display="flex"
                alignItems="center"
                p={3}
                rounded="md"
                bg={isActiveLink('/') ? activeBgColor : 'transparent'}
                color={isActiveLink('/') ? accentColor : textColor}
                _hover={{ bg: activeBgColor, color: accentColor }}
              >
                <HStack spacing={3}>
                  <FaHome />
                  <Text>Início</Text>
                </HStack>
              </ChakraLink>

              <ChakraLink 
                as={RouterLink} 
                to="/relatar" 
                onClick={onClose}
                display="flex"
                alignItems="center"
                p={3}
                rounded="md"
                bg={isActiveLink('/relatar') ? activeBgColor : 'transparent'}
                color={isActiveLink('/relatar') ? accentColor : textColor}
                _hover={{ bg: activeBgColor, color: accentColor }}
              >
                <HStack spacing={3}>
                  <FaExclamationTriangle />
                  <Text>Relatar Problema</Text>
                </HStack>
              </ChakraLink>

              <ChakraLink 
                as={RouterLink} 
                to="/problemas" 
                onClick={onClose}
                display="flex"
                alignItems="center"
                p={3}
                rounded="md"
                bg={isActiveLink('/problemas') ? activeBgColor : 'transparent'}
                color={isActiveLink('/problemas') ? accentColor : textColor}
                _hover={{ bg: activeBgColor, color: accentColor }}
              >
                <HStack spacing={3}>
                  <FaList />
                  <Text>Ver Problemas</Text>
                </HStack>
              </ChakraLink>

              {isAdmin && (
                <ChakraLink 
                  as={RouterLink} 
                  to="/admin" 
                  onClick={onClose}
                  display="flex"
                  alignItems="center"
                  p={3}
                  rounded="md"
                  bg={isActiveLink('/admin') ? activeBgColor : 'transparent'}
                  color={isActiveLink('/admin') ? accentColor : textColor}
                  _hover={{ bg: activeBgColor, color: accentColor }}
                >
                  <HStack spacing={3}>
                    <FaUserCog />
                    <Text>Painel Admin</Text>
                  </HStack>
                </ChakraLink>
              )}

              {/* Opções adicionais no menu mobile */}
              <Divider />

              {/* Opção de tema no menu mobile */}
              <Button
                leftIcon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                onClick={() => {
                  toggleColorMode();
                  onClose();
                }}
                variant="ghost"
                justifyContent="flex-start"
                p={3}
                w="100%"
              >
                {colorMode === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </Button>

              {/* Opções de usuário no menu mobile */}
              {user ? (
                <>
                  <Text px={3} py={2} fontSize="sm" color="gray.500">
                    {user.email}
                  </Text>
                  <Button
                    leftIcon={<FaSignOutAlt />}
                    onClick={() => {
                      handleLogout();
                      onClose();
                    }}
                    variant="ghost"
                    colorScheme="red"
                    justifyContent="flex-start"
                    p={3}
                    w="100%"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <ChakraLink 
                  as={RouterLink} 
                  to="/login" 
                  onClick={onClose}
                  display="flex"
                  alignItems="center"
                  p={3}
                  rounded="md"
                  color={textColor}
                  _hover={{ bg: activeBgColor, color: accentColor }}
                >
                  <HStack spacing={3}>
                    <Box>👤</Box>
                    <Text>Entrar</Text>
                  </HStack>
                </ChakraLink>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Conteúdo Principal */}
      <Box 
        as="main" 
        flex="1"
        mt={{ base: "56px", md: "64px" }}
        px={{ base: 2, sm: 4, md: 6 }}
        py={{ base: 4, md: 6 }}
      >
        {children}
      </Box>
    </Box>
  );
}