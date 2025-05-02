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
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.senha || !formData.confirmarSenha) {
      toast({
        title: 'Erro no cadastro',
        description: 'Por favor, preencha todos os campos',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: 'Erro no cadastro',
        description: 'As senhas não coincidem',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (formData.senha.length < 6) {
      toast({
        title: 'Erro no cadastro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.senha
      );

      await updateProfile(userCredential.user, {
        displayName: formData.nome
      });

      toast({
        title: 'Cadastro realizado com sucesso!',
        status: 'success',
        duration: 3000,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let errorMessage = 'Ocorreu um erro ao criar sua conta';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso';
      }

      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" mt="80px">
      <VStack spacing={8}>
        <Heading>Criar Conta</Heading>
        <VStack spacing={4} w="100%">
          <Box w="100%" as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome completo</FormLabel>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite seu email"
                  autoComplete="email"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Senha</FormLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Digite sua senha"
                  autoComplete="new-password"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirmar Senha</FormLabel>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  placeholder="Confirme sua senha"
                  autoComplete="new-password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                w="100%"
                isLoading={isLoading}
              >
                Criar Conta
              </Button>

              <Text>
                Já tem uma conta?{' '}
                <ChakraLink as={Link} to="/login" color="blue.500">
                  Faça login
                </ChakraLink>
              </Text>
            </VStack>
          </Box>
        </VStack>
      </VStack>
    </Container>
  );
} 