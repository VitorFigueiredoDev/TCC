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
    <Container maxW="container.sm" mt={["20px", "40px", "80px"]} px={[4, 6, 8]}>
      <VStack spacing={[4, 6, 8]} align="stretch">
        <Heading textAlign="center" fontSize={["2xl", "3xl", "4xl"]}>Cadastro</Heading>
        <Box 
          as="form" 
          onSubmit={handleSubmit}
          bg="whiteAlpha.200" 
          p={[4, 6, 8]} 
          borderRadius="md"
          boxShadow="md"
          w="100%"
        >
          <VStack spacing={[3, 4]} w="100%">
            <FormControl isRequired>
              <FormLabel fontSize={["sm", "md"]}>Nome</FormLabel>
              <Input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                size={["sm", "md"]}
                fontSize={["sm", "md"]}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize={["sm", "md"]}>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                size={["sm", "md"]}
                fontSize={["sm", "md"]}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize={["sm", "md"]}>Senha</FormLabel>
              <Input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                size={["sm", "md"]}
                fontSize={["sm", "md"]}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize={["sm", "md"]}>Confirmar Senha</FormLabel>
              <Input
                type="password"
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
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
              Cadastrar
            </Button>

            <HStack spacing={1} fontSize={["xs", "sm"]} justify="center" w="100%" mt={[2, 4]}>
              <Text>Já tem uma conta?</Text>
              <ChakraLink as={Link} to="/login" color="blue.400">
                Faça login
              </ChakraLink>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}