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
  Link as ChakraLink,
  HStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getDatabase, ref, get } from 'firebase/database';
import { RelatosService } from '../services/relatosService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const database = getDatabase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Erro no login',
        description: 'Por favor, preencha todos os campos',
        status: 'error',
        duration: 2000,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Realizar login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar se é admin
      const adminRef = ref(database, `admins/${userCredential.user.uid}`);
      const adminSnapshot = await get(adminRef);
      
      if (adminSnapshot.exists()) {
        toast({
          title: 'Login de administrador realizado com sucesso!',
          status: 'success',
          duration: 2000,
        });
        navigate('/admin');
      } else {
        toast({
          title: 'Login realizado com sucesso!',
          status: 'success',
          duration: 2000,
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      let errorMessage = 'Email ou senha inválidos';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde';
      }

      toast({
        title: 'Erro no login',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de administrador movidas para o serviço RelatosService

  return (
    <Container maxW="container.sm" mt={["20px", "40px", "80px"]} px={[4, 6, 8]}>
      <VStack spacing={[4, 6, 8]} align="stretch">
        <Heading textAlign="center" fontSize={["2xl", "3xl", "4xl"]}>Login</Heading>
        <Box 
          as="form" 
          onSubmit={handleLogin}
          bg="whiteAlpha.200" 
          p={[4, 6, 8]} 
          borderRadius="md"
          boxShadow="md"
          w="100%"
        >
          <VStack spacing={[3, 4]} w="100%">
            <FormControl isRequired>
              <FormLabel fontSize={["sm", "md"]}>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                size={["sm", "md"]}
                fontSize={["sm", "md"]}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel fontSize={["sm", "md"]}>Senha</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                size={["sm", "md"]}
                fontSize={["sm", "md"]}
              />
            </FormControl>
            
            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={isLoading}
              size={["sm", "md"]}
              fontSize={["sm", "md"]}
              mt={[2, 4]}
            >
              Entrar
            </Button>
            
            <HStack spacing={1} fontSize={["xs", "sm"]} justify="center" w="100%" mt={[2, 4]}>
              <Text>Não tem uma conta?</Text>
              <ChakraLink as={Link} to="/cadastro" color="blue.400">
                Cadastre-se
              </ChakraLink>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}