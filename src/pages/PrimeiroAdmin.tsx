import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  useToast,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getDatabase, ref, set } from 'firebase/database';

export default function PrimeiroAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const database = getDatabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: 'Erro no cadastro',
        description: 'Por favor, preencha todos os campos',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro no cadastro',
        description: 'As senhas não coincidem',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (email !== 'Ronaldinho@gmail.com') {
      toast({
        title: 'Erro no cadastro',
        description: 'O email deve ser Ronaldinho@gmail.com',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Criar usuário admin
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Configurar permissões de admin no banco de dados
      await set(ref(database, `admins/${user.uid}`), {
        email: user.email,
        role: 'superadmin',
        permissoes: {
          editarStatus: true,
          excluirRelatos: true,
          gerenciarAdmins: true,
          verLogs: true
        },
        createdAt: new Date().toISOString()
      });

      toast({
        title: 'Administrador criado com sucesso!',
        description: 'Você será redirecionado para a página de administração',
        status: 'success',
        duration: 3000,
      });

      navigate('/admin');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" mt={["20px", "40px", "80px"]} px={[4, 6, 8]}>
      <VStack spacing={[4, 6, 8]} align="stretch">
        <Heading textAlign="center" fontSize={["2xl", "3xl", "4xl"]}>Configuração Inicial do Administrador</Heading>
        <Text textAlign="center" color="gray.500">
          Configure a conta do administrador principal do sistema.
        </Text>
        
        <Box 
          as="form" 
          onSubmit={handleSubmit}
          bg="whiteAlpha.200" 
          p={[4, 6, 8]} 
          borderRadius="md"
          boxShadow="md"
          w="100%"
        >
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email do Administrador</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@falatriangulo.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Senha</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite uma senha forte"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirmar Senha</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a senha"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={isLoading}
              mt={4}
            >
              Criar Conta de Administrador
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}