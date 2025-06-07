import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Badge,
  Progress,
  Switch,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Card,
  CardBody,
  Image,
  Select,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { FaEdit, FaMedal, FaBell, FaLock, FaList } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(auth.currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    nome: '',
    telefone: '',
    bairro: '',
    notificacoesEmail: true,
    notificacoesPush: true,
    perfilPublico: true,
  });

  const bgCard = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Dados mockados para demonstração
  const meusRelatos = [
    {
      id: 1,
      tipo: 'Buraco na Via',
      data: new Date(),
      status: 'em_andamento',
      localizacao: 'Av. Principal, Centro',
      foto: 'https://via.placeholder.com/150',
      protocolo: 'PROT-001',
      resposta: 'Em análise pela secretaria responsável',
    },
    // Adicione mais relatos conforme necessário
  ];

  const conquistas = [
    {
      titulo: 'Primeiro Relato',
      descricao: 'Parabéns pelo seu primeiro relato!',
      icone: '🌟',
    },
    {
      titulo: 'Cidadão Ativo',
      descricao: '10 relatos enviados',
      icone: '🏆',
    },
  ];

  const handleSaveProfile = () => {
    toast({
      title: 'Perfil atualizado',
      status: 'success',
      duration: 3000,
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendente: 'yellow',
      em_andamento: 'blue',
      resolvido: 'green',
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  if (!user) return null;

  return (
    <Container maxW="container.xl" py={8} mt="60px">
      <VStack spacing={8} align="stretch">
        {/* Seção de Informações Pessoais */}
        <Card bg={bgCard} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <HStack spacing={8} align="flex-start">
              <VStack>
                <Avatar 
                  size="2xl" 
                  name={user.displayName || undefined}
                  src={user.photoURL || undefined}
                />
                {!isEditing && (
                  <Button leftIcon={<FaEdit />} onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                )}
              </VStack>

              <VStack align="stretch" flex={1} spacing={4}>
                <HStack justify="space-between">
                  <Heading size="lg">{user.displayName || 'Usuário'}</Heading>
                  <Badge colorScheme="green">Verificado</Badge>
                </HStack>

                {isEditing ? (
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Nome Completo</FormLabel>
                      <Input value={userData.nome} onChange={(e) => setUserData({...userData, nome: e.target.value})} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Telefone</FormLabel>
                      <Input value={userData.telefone} onChange={(e) => setUserData({...userData, telefone: e.target.value})} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Bairro/Região</FormLabel>
                      <Input value={userData.bairro} onChange={(e) => setUserData({...userData, bairro: e.target.value})} />
                    </FormControl>
                    <HStack>
                      <Button colorScheme="blue" onClick={handleSaveProfile}>Salvar</Button>
                      <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    <Text><strong>Email:</strong> {user.email}</Text>
                    <Text><strong>Telefone:</strong> {userData.telefone || 'Não informado'}</Text>
                    <Text><strong>Bairro:</strong> {userData.bairro || 'Não informado'}</Text>
                    <Text><strong>Membro desde:</strong> {format(user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</Text>
                  </VStack>
                )}
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Tabs isLazy>
          <TabList>
            <Tab><HStack><FaList /><Text>Meus Relatos</Text></HStack></Tab>
            <Tab><HStack><FaMedal /><Text>Conquistas</Text></HStack></Tab>
            <Tab><HStack><FaBell /><Text>Notificações</Text></HStack></Tab>
            <Tab><HStack><FaLock /><Text>Configurações</Text></HStack></Tab>
          </TabList>

          <TabPanels>
            {/* Painel de Relatos */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Select placeholder="Filtrar por status" w="200px">
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendentes</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="resolvido">Resolvidos</option>
                  </Select>
                </HStack>

                {meusRelatos.map((relato) => (
                  <Card key={relato.id} bg={bgCard} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <HStack spacing={4} align="flex-start">
                        {relato.foto && (
                          <Image
                            src={relato.foto}
                            alt={relato.tipo}
                            boxSize="100px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        )}
                        <VStack align="stretch" flex={1}>
                          <HStack justify="space-between">
                            <Heading size="md">{relato.tipo}</Heading>
                            <Badge colorScheme={getStatusColor(relato.status)}>
                              {relato.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </HStack>
                          <Text><strong>Data:</strong> {format(relato.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</Text>
                          <Text><strong>Localização:</strong> {relato.localizacao}</Text>
                          <Text><strong>Protocolo:</strong> {relato.protocolo}</Text>
                          {relato.resposta && (
                            <Text><strong>Resposta:</strong> {relato.resposta}</Text>
                          )}
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>

            {/* Painel de Conquistas */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>Nível de Engajamento</Heading>
                  <Progress value={70} colorScheme="green" mb={2} />
                  <Text>Pontuação: 700/1000 pontos</Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {conquistas.map((conquista, index) => (
                    <Card key={index} bg={bgCard} borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <HStack>
                          <Text fontSize="2xl">{conquista.icone}</Text>
                          <VStack align="start">
                            <Heading size="sm">{conquista.titulo}</Heading>
                            <Text>{conquista.descricao}</Text>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Painel de Notificações */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Notificações removidas */}
              </VStack>
            </TabPanel>

            {/* Painel de Configurações */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={bgCard} borderWidth={1} borderColor={borderColor}>
                  <CardBody>
                    <Heading size="md" mb={4}>Preferências de Notificação</Heading>
                    <VStack align="stretch" spacing={4}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Notificações por Email</FormLabel>
                        <Switch 
                          isChecked={userData.notificacoesEmail}
                          onChange={(e) => setUserData({...userData, notificacoesEmail: e.target.checked})}
                        />
                      </FormControl>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Notificações Push</FormLabel>
                        <Switch 
                          isChecked={userData.notificacoesPush}
                          onChange={(e) => setUserData({...userData, notificacoesPush: e.target.checked})}
                        />
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bgCard} borderWidth={1} borderColor={borderColor}>
                  <CardBody>
                    <Heading size="md" mb={4}>Privacidade</Heading>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Perfil Público</FormLabel>
                      <Switch 
                        isChecked={userData.perfilPublico}
                        onChange={(e) => setUserData({...userData, perfilPublico: e.target.checked})}
                      />
                    </FormControl>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
} 