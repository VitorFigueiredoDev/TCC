import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Select,
} from '@chakra-ui/react';
import { useState } from 'react';
import { auth } from '../config/firebase';
import { AdminService } from '../services/adminService';
import { useNavigate } from 'react-router-dom';

export default function PrimeiroAdmin() {
  const [formData, setFormData] = useState({
    email: '',
    permissionLevel: 'admin' as const,
    permissoes: {
      gerenciarAdmins: false,
      excluirRelatos: false,
      editarStatus: true,
      visualizarEstatisticas: true,
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    if (!formData.email) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para realizar esta ação.',
          status: 'error',
          duration: 3000,
        });
        navigate('/login');
        return;
      }

      // Verificar se já existe algum admin
      const isAlreadyAdmin = await AdminService.verificarPermissoes(user.uid);
      if (isAlreadyAdmin) {
        toast({
          title: 'Aviso',
          description: 'Você já é um administrador.',
          status: 'info',
          duration: 3000,
        });
        navigate('/admin');
        return;
      }

      // Adicionar como admin
      await AdminService.adicionarAdmin({
        uid: user.uid,
        email: formData.email,
        permissionLevel: 'superadmin', // O primeiro admin sempre é superadmin
        permissoes: {
          gerenciarAdmins: true,
          excluirRelatos: true,
          editarStatus: true,
          visualizarEstatisticas: true,
        }
      }, user.uid);
      
      toast({
        title: 'Sucesso!',
        description: 'Você agora é um administrador do sistema.',
        status: 'success',
        duration: 3000,
      });
      
      navigate('/admin');
    } catch (error: any) {
      console.error('Erro ao configurar admin:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível configurar o administrador.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={6}>
        <Heading>Configuração do Primeiro Administrador</Heading>
        
        <Text textAlign="center" color="gray.600">
          Esta página permite configurar o primeiro administrador do sistema.
          Como primeiro administrador, você terá acesso total ao sistema.
        </Text>

        <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email do Administrador</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Digite seu email"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              isLoading={isLoading}
              onClick={handleSetupAdmin}
              width="100%"
            >
              Configurar como Administrador
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 