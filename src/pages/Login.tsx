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
import { getDatabase, ref, get, set } from 'firebase/database';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar papel do usuário
      const adminRef = ref(database, `admins/${user.uid}`);
      const snapshot = await get(adminRef);
      const isAdmin = snapshot.exists();

      toast({
        title: 'Login realizado com sucesso!',
        status: 'success',
        duration: 2000,
      });

      // Redirecionar com base no papel
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro no login',
        description: 'Email ou senha inválidos',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarAdmin = async (uid, email) => {
    const adminRef = ref(database, `admins/${uid}`);
    
    await set(adminRef, {
      email: email,
      permissionLevel: 'admin',
      dataCriacao: new Date().toISOString(),
      permissoes: {
        gerenciarAdmins: true,
        excluirRelatos: true,
        editarStatus: true,
        visualizarEstatisticas: true
      }
    });
  };

  const adicionarAdminFirestore = async (uid, email) => {
    const db = getFirestore();
    const adminRef = doc(db, 'admins', uid);
    
    await setDoc(adminRef, {
      email: email,
      permissionLevel: 'admin',
      dataCriacao: new Date().toISOString(),
      permissoes: {
        gerenciarAdmins: true,
        excluirRelatos: true,
        editarStatus: true,
        visualizarEstatisticas: true
      }
    });
  };

  return (
    <Container maxW="container.sm" mt="80px">
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">Login</Heading>
        <Box 
          as="form" 
          onSubmit={handleLogin}
          bg="whiteAlpha.200" 
          p={8} 
          borderRadius="md"
          boxShadow="md"
        >
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                bg="whiteAlpha.100"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Senha</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                bg="whiteAlpha.100"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </FormControl>
            
            <VStack w="100%" spacing={4} pt={4}>
              <Button 
                type="submit" 
                colorScheme="blue" 
                w="100%"
                isLoading={isLoading}
                size="lg"
              >
                Entrar
              </Button>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 