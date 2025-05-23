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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  useBreakpointValue,
  Icon,
  Divider,
} from '@chakra-ui/react';
import {
  FaSun,
  FaMoon,
  FaUser,
  FaExclamationCircle,
  FaList,
  FaMap,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaHome,
  FaUserCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { getDatabase, ref, get } from 'firebase/database';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Hooks de estado
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Valores responsivos (Hooks chamados incondicionalmente)
  const isMobile = useBreakpointValue({ base: true, md: false });
  const logoTextSize = useBreakpointValue({ base: "lg", md: "xl" });
  const logoIconSize = useBreakpointValue({ base: "md", md: "lg" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

  // Valores de Cor (Hooks chamados incondicionalmente)
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const logoColor = useColorModeValue("blue.600", "blue.300");
  const logoHoverColor = useColorModeValue("blue.700", "blue.200");
  const generalHoverBg = useColorModeValue("blue.50", "blue.700Alpha"); // Usado em commonButtonProps
  const themeButtonHoverBg = useColorModeValue("gray.200", "gray.700"); // Específico para o botão de tema
  const menuItemLogoutColor = useColorModeValue("red.500", "red.300"); // Cor para o item "Sair"

  useEffect(() => {
    const handleAuthChange = async (user: any) => {
      setIsAuthenticated(!!user);
      if (user) {
        try {
          const database = getDatabase();
          const adminRef = ref(database, `admins/${user.uid}`);
          const adminSnapshot = await get(adminRef);
          setIsAdmin(adminSnapshot.exists());
        } catch (error) {
          console.error('Erro ao verificar status de admin:', error);
          setIsAdmin(false);
          toast({
            title: 'Erro ao verificar permissões',
            description: 'Não foi possível verificar o status de administrador.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        setIsAdmin(false);
      }
    };

    const unsubscribe = AuthService.addAuthStateListener(handleAuthChange);
    const currentUser = AuthService.getCurrentUser();
    handleAuthChange(currentUser); // Chama para o usuário atual no mount

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [toast]); // toast pode ser mantido se o linter insistir, mas geralmente é estável.

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      toast({
        title: 'Logout realizado com sucesso', status: 'success', duration: 3000, isClosable: true, position: 'top',
      });
      navigate('/');
      if (isOpen) onClose();
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout', description: error instanceof Error ? error.message : 'Ocorreu um erro.', status: 'error', duration: 3000, isClosable: true, position: 'top',
      });
    }
  };

  const navigateAndClose = (path: string) => {
    navigate(path);
    if (isOpen) onClose();
  };

  const menuOptions = [
    { icon: <FaExclamationCircle />, label: 'Relatar Problema', path: '/relatar', alwaysShow: true },
    { icon: <FaList />, label: 'Ver Problemas', path: '/problemas', alwaysShow: true },
    { icon: <FaMap />, label: 'Mapa', path: '/mapa', alwaysShow: true },
    { icon: <FaCog />, label: 'Admin', path: '/admin', showWhen: isAdmin, requiresAuth: true },
  ];

  const commonButtonProps = {
    variant: "ghost", colorScheme: "blue", size: buttonSize, borderRadius: "md", _hover: { bg: generalHoverBg }
  };

  const drawerButtonProps = {
    ...commonButtonProps, justifyContent: "flex-start", width: "full",
  };

  return (
    <Box
      px={{ base: 3, md: 4 }} py={2} position="sticky" top="0"
      bg={bgColor} boxShadow="sm" zIndex="sticky"
      transition="background-color 0.3s ease, box-shadow 0.3s ease"
    >
      <Flex maxW="container.xl" mx="auto" justify="space-between" align="center" height={{ base: "50px", md: "60px" }}>
        <HStack
          spacing={2} align="center" cursor="pointer"
          onClick={() => navigateAndClose('/')} role="group" aria-label="Ir para a página inicial"
        >
          <Icon as={FaHome} fontSize={logoIconSize} color={logoColor} transition="color 0.2s" _groupHover={{ color: logoHoverColor }} />
          <Text fontSize={logoTextSize} fontWeight="bold" color={logoColor} transition="color 0.2s" _groupHover={{ color: logoHoverColor }} userSelect="none">
            Home
          </Text>
        </HStack>

        {!isMobile && (
          <HStack spacing={{ base: 1, md: 2 }}>
            {menuOptions.map((option, index) => (
              (option.alwaysShow || option.showWhen) && (
                <Button key={index} leftIcon={option.icon} onClick={() => navigateAndClose(option.path)} {...commonButtonProps}>
                  {option.label}
                </Button>
              )
            ))}
            <IconButton
              aria-label={`Alternar para modo ${colorMode === 'light' ? 'escuro' : 'claro'}`}
              icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode} variant="ghost" colorScheme="gray"
              size={buttonSize} borderRadius="full" _hover={{ bg: themeButtonHoverBg }} // Usando a variável
            />
            {isAuthenticated ? (
              <Menu>
                <MenuButton as={Button} rightIcon={<FaUserCircle />} variant="outline" colorScheme="blue" size={buttonSize} borderRadius="md">
                  Conta
                </MenuButton>
                <MenuList zIndex="popover" boxShadow="lg" borderColor={borderColor}>
                  <MenuItem icon={<FaUserCircle />} onClick={() => navigateAndClose('/perfil')}>
                    Meu Perfil
                  </MenuItem>
                  <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout} color={menuItemLogoutColor}> {/* Usando a variável */}
                    Sair
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <>
                <Button leftIcon={<FaUser />} variant="outline" colorScheme="blue" size={buttonSize} borderRadius="md" onClick={() => navigateAndClose('/login')}>
                  Login
                </Button>
                <Button colorScheme="blue" size={buttonSize} borderRadius="md" onClick={() => navigateAndClose('/cadastro')}>
                  Cadastro
                </Button>
              </>
            )}
          </HStack>
        )}

        {isMobile && (
          <IconButton
            aria-label="Abrir menu" icon={<FaBars />}
            variant="ghost" onClick={onOpen} size={buttonSize}
          />
        )}
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={bgColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>Menu</DrawerHeader>
          <DrawerBody pt={4}>
            <VStack spacing={3} align="stretch">
              {menuOptions.map((option, index) => (
                (option.alwaysShow || option.showWhen) && (
                  <Button key={index} leftIcon={option.icon} onClick={() => navigateAndClose(option.path)} {...drawerButtonProps}>
                    {option.label}
                  </Button>
                )
              ))}
              <Divider my={3} borderColor={borderColor} />
              <Flex align="center" justify="space-between" p={2} borderRadius="md" _hover={{bg: generalHoverBg}}> {/* Usando a variável */}
                <Text fontSize="sm">Mudar Tema</Text>
                <IconButton
                  aria-label={`Alternar para modo ${colorMode === 'light' ? 'escuro' : 'claro'}`}
                  icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                  onClick={toggleColorMode} variant="ghost" colorScheme="gray"
                  size="sm" borderRadius="full" _hover={{ bg: themeButtonHoverBg }} // Usando a variável
                />
              </Flex>
              <Divider my={3} borderColor={borderColor}/>
              {isAuthenticated ? (
                <>
                  <Button leftIcon={<FaUserCircle />} onClick={() => navigateAndClose('/perfil')} {...drawerButtonProps}>
                    Meu Perfil
                  </Button>
                  <Button leftIcon={<FaSignOutAlt />} onClick={handleLogout} {...{...drawerButtonProps, colorScheme: "red"}}>
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button leftIcon={<FaUser />} onClick={() => navigateAndClose('/login')} {...drawerButtonProps}>
                    Login
                  </Button>
                  <Button colorScheme="blue" variant="solid" width="full" borderRadius="md" onClick={() => navigateAndClose('/cadastro')}>
                    Cadastro
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}