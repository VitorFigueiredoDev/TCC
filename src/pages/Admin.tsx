import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  Image,
  HStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  IconButton,
  Flex,
  Spinner,
  Center,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaEdit, FaTrash, FaExclamationTriangle, FaUserShield, FaHistory, FaInfoCircle } from 'react-icons/fa';
import { RelatosService } from '../services/relatosService';
import { AdminService } from '../services/adminService';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import Player from "lottie-react";

const MAP_TIPO_TO_IMG: Record<string, string> = {
  buraco: '/imagens/Buraco na Via.jpg',
  iluminacao: '/imagens/Problema de Iluminação.jpg',
  lixo: '/imagens/Descarte irregular de Lixo.jpg',
  calcada: '/imagens/Calçada Danificada.jpg',
  sinalizacao: '/imagens/problema sinlizaçao.jpg',
  outros: '/imagens/Outros.jpg',
};

interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface Relato {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'resolvido';
  prioridade: 'alta' | 'media' | 'baixa';
  tipo: string;
  dataCriacao: string;
  foto?: string;
  endereco: Endereco;
  resposta?: string;
}

interface AdminPermissoes {
  nome?: string;
  permissionLevel: 'admin' | 'superadmin';
  permissoes: {
    editarStatus: boolean;
    excluirRelatos: boolean;
    gerenciarAdmins?: boolean;
  };
  adminList?: Array<{
    id: string;
    email: string;
    permissionLevel: 'admin' | 'superadmin';
    permissoes: { gerenciarAdmins: boolean; excluirRelatos: boolean };
    ultimoAcesso: string;
  }>;
}

interface Log {
  id: string;
  data: string;
  usuarioId: string;
  acao: string;
  detalhes: { tipo: string };
}

const useAdminData = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminPermissoes, setAdminPermissoes] = useState<AdminPermissoes | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    resolvidos: 0,
    altaPrioridade: 0,
    mediaPrioridade: 0,
    baixaPrioridade: 0,
  });

  const checkAdmin = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('Usuário não autenticado');
      navigate('/login');
      return;
    }
    console.log('Usuário autenticado:', user.uid);
    const permissoes = await AdminService.verificarPermissoes(user.uid);
    console.log('Permissões do usuário:', permissoes);
    if (!permissoes) {
      console.log('Usuário sem permissões de admin:', user.uid);
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    setAdminPermissoes(permissoes);
  };

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const dados = await RelatosService.listarRelatos();
      console.log('Relatos carregados:', dados);
      setRelatos(dados);
      setStats({
        total: dados.length,
        pendentes: dados.filter(r => r.status === 'pendente').length,
        emAndamento: dados.filter(r => r.status === 'em_andamento').length,
        resolvidos: dados.filter(r => r.status === 'resolvido').length,
        altaPrioridade: dados.filter(r => r.prioridade === 'alta').length,
        mediaPrioridade: dados.filter(r => r.prioridade === 'media').length,
        baixaPrioridade: dados.filter(r => r.prioridade === 'baixa').length,
      });

      if (adminPermissoes?.permissionLevel === 'superadmin') {
        const logsData = await AdminService.listarLogs();
        console.log('Logs carregados:', logsData);
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { relatos, isLoading, stats, adminPermissoes, logs, carregarDados, checkAdmin };
};

export default function Admin() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const { relatos, isLoading, stats, adminPermissoes, logs, carregarDados, checkAdmin } = useAdminData();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('data');
  const [selectedRelato, setSelectedRelato] = useState<Relato | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resposta, setResposta] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [novoStatus, setNovoStatus] = useState<'pendente' | 'em_andamento' | 'resolvido'>('pendente');
  const [novaPrioridade, setNovaPrioridade] = useState<'alta' | 'media' | 'baixa'>('media');

  const relatosFiltrados = useMemo(() => {
    return relatos
      .filter(relato => {
        const matchTipo = !filtroTipo || relato.tipo === filtroTipo;
        const matchStatus = !filtroStatus || relato.status === filtroStatus;
        const matchPrioridade = !filtroPrioridade || relato.prioridade === filtroPrioridade;
        const matchBusca = !busca || 
          relato.descricao.toLowerCase().includes(busca.toLowerCase()) ||
          relato.endereco.rua.toLowerCase().includes(busca.toLowerCase()) ||
          relato.endereco.bairro.toLowerCase().includes(busca.toLowerCase()) ||
          relato.endereco.cidade.toLowerCase().includes(busca.toLowerCase());
        return matchTipo && matchStatus && matchPrioridade && matchBusca;
      })
      .sort((a, b) => {
        switch (ordenacao) {
          case 'prioridade':
            const prioridadePeso = { alta: 3, media: 2, baixa: 1 };
            return (prioridadePeso[b.prioridade] || 0) - (prioridadePeso[a.prioridade] || 0);
          case 'status':
            const statusPeso = { pendente: 3, em_andamento: 2, resolvido: 1 };
            return (statusPeso[b.status] || 0) - (statusPeso[a.status] || 0);
          case 'data':
          default:
            return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
        }
      });
  }, [relatos, filtroTipo, filtroStatus, filtroPrioridade, busca, ordenacao]);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (adminPermissoes) {
      carregarDados();
    }
  }, [adminPermissoes]);

  const handleStatusChange = async () => {
    if (!adminPermissoes?.permissoes.editarStatus) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para alterar o status dos relatos.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!selectedRelato || !novoStatus || !novaPrioridade) {
      toast({
        title: 'Erro',
        description: 'Dados inválidos para atualização.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!auth.currentUser) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        status: 'error',
        duration: 3000,
      });
      navigate('/login');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Chamando atualizarStatus:', {
        id: selectedRelato.id,
        status: novoStatus,
        prioridade: novaPrioridade,
        resposta: resposta.trim(),
        usuarioId: auth.currentUser.uid,
      });

      await RelatosService.atualizarStatus(selectedRelato.id, {
        status: novoStatus,
        resposta: resposta.trim(),
        prioridade: novaPrioridade,
      });

      await carregarDados();
      toast({
        title: 'Status atualizado',
        description: 'O status do relato foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
      });

      setResposta('');
      setSelectedRelato(null);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o status do relato.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminPermissoes?.permissoes.excluirRelatos) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para excluir relatos.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este relato?')) {
      try {
        await RelatosService.excluirRelato(id);
        await carregarDados();
        toast({
          title: 'Relato excluído',
          description: 'O relato foi excluído com sucesso.',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Erro ao excluir relato:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o relato.',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendente: 'yellow',
      em_andamento: 'blue',
      resolvido: 'green',
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  return (
    <Container maxW="container.xl" mt={8}>
      <VStack spacing={8} align="stretch">
        <Heading mb={4}>Bem-vindo, {adminPermissoes?.nome || 'Administrador'}</Heading>

        <Tabs>
          <TabList>
            <Tab><HStack><FaExclamationTriangle /><Text>Relatos</Text></HStack></Tab>
            {adminPermissoes?.permissionLevel === 'superadmin' && (
              <>
                <Tab><HStack><FaUserShield /><Text>Administradores</Text></HStack></Tab>
                <Tab><HStack><FaHistory /><Text>Logs</Text></HStack></Tab>
              </>
            )}
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <Grid templateColumns="repeat(4, 1fr)" gap={6}>
                  <GridItem colSpan={4}>
                    <StatGroup>
                      <Stat>
                        <StatLabel>Total de Relatos</StatLabel>
                        <StatNumber>{stats.total}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Pendentes</StatLabel>
                        <StatNumber color="yellow.500">{stats.pendentes}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Em Andamento</StatLabel>
                        <StatNumber color="blue.500">{stats.emAndamento}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Resolvidos</StatLabel>
                        <StatNumber color="green.500">{stats.resolvidos}</StatNumber>
                      </Stat>
                    </StatGroup>
                  </GridItem>
                  <GridItem colSpan={4}>
                    <StatGroup>
                      <Stat>
                        <StatLabel>Alta Prioridade</StatLabel>
                        <StatNumber>{stats.altaPrioridade}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Média Prioridade</StatLabel>
                        <StatNumber>{stats.mediaPrioridade}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Baixa Prioridade</StatLabel>
                        <StatNumber>{stats.baixaPrioridade}</StatNumber>
                      </Stat>
                    </StatGroup>
                  </GridItem>
                </Grid>

                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FaSearch />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar relatos..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        flex={1}
                      />
                    </InputGroup>
                    <Select
                      placeholder="Ordenar por"
                      value={ordenacao}
                      onChange={(e) => setOrdenacao(e.target.value)}
                      w="200px"
                    >
                      <option value="data">Data</option>
                      <option value="prioridade">Prioridade</option>
                      <option value="status">Status</option>
                    </Select>
                  </HStack>
                  <HStack spacing={4}>
                    <Select
                      placeholder="Tipo"
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      w="200px"
                    >
                      <option value="buraco">Buraco na Via</option>
                      <option value="iluminacao">Iluminação</option>
                      <option value="lixo">Lixo</option>
                      <option value="calcada">Calçada</option>
                      <option value="outros">Outros</option>
                    </Select>
                    <Select
                      placeholder="Status"
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      w="200px"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="resolvido">Resolvido</option>
                    </Select>
                    <Select
                      placeholder="Prioridade"
                      value={filtroPrioridade}
                      onChange={(e) => setFiltroPrioridade(e.target.value)}
                      w="200px"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </Select>
                  </HStack>
                </VStack>

                {isLoading ? (
                  <Center py={8}>
                    <Player
                      src="https://lottie.host/aebed8c9-9d58-4776-9176-abfa3499c3f9/kHcDbt0OMr.lottie"
                      style={{ height: 180, width: 180 }}
                      loop
                      autoplay
                    />
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {relatosFiltrados.map(relato => (
                      <Card key={relato.id}>
                        <CardBody>
                          <VStack align="stretch" spacing={4}>
                            <Image
                              src={relato.foto || MAP_TIPO_TO_IMG[relato.tipo] || MAP_TIPO_TO_IMG.outros}
                              alt={relato.titulo}
                              borderRadius="lg"
                              w="100%"
                              h="200px"
                              objectFit="cover"
                            />
                            <Flex justify="space-between" align="center">
                              <Heading size="md">{relato.titulo}</Heading>
                              <HStack>
                                <Badge colorScheme={getStatusColor(relato.status)}>
                                  {relato.status.replace('_', ' ')}
                                </Badge>
                                <Badge colorScheme={relato.prioridade === 'alta' ? 'red' : relato.prioridade === 'media' ? 'yellow' : 'green'}>
                                  Prioridade {relato.prioridade}
                                </Badge>
                              </HStack>
                            </Flex>
                            <Text color="gray.500">
                              {[
                                relato.endereco.rua,
                                relato.endereco.numero,
                                relato.endereco.bairro,
                                `${relato.endereco.cidade}-${relato.endereco.estado}`,
                              ].filter(Boolean).join(', ')}
                            </Text>
                            <Text noOfLines={2}>{relato.descricao}</Text>
                            <Text fontSize="sm" color="gray.500">
                              Relatado em: {new Date(relato.dataCriacao).toLocaleDateString('pt-BR')}
                            </Text>
                            <Divider />
                            <HStack spacing={4} justify="flex-end">
                              {adminPermissoes?.permissoes.editarStatus && (
                                <Button
                                  leftIcon={<FaEdit />}
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRelato(relato);
                                    setNovoStatus(relato.status);
                                    setNovaPrioridade(relato.prioridade || 'media');
                                    setResposta(relato.resposta || '');
                                    onOpen();
                                  }}
                                >
                                  Gerenciar
                                </Button>
                              )}
                              {adminPermissoes?.permissoes.excluirRelatos && (
                                <IconButton
                                  aria-label="Excluir relato"
                                  icon={<FaTrash />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDelete(relato.id)}
                                />
                              )}
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}

                <Modal
                  isOpen={isOpen}
                  onClose={onClose}
                  size="xl"
                  isCentered
                  motionPreset="slideInBottom"
                  returnFocusOnClose={true}
                  closeOnOverlayClick={false}
                  blockScrollOnMount={false}
                  aria-labelledby="modal-title"
                >
                  <ModalOverlay />
                  <ModalContent bg={useColorModeValue('gray.900', 'gray.800')} borderRadius="2xl" boxShadow="2xl" p={2}>
                    <ModalHeader fontWeight="bold" fontSize="2xl" color="blue.300" borderTopRadius="2xl" bg={useColorModeValue('blue.900', 'blue.700')}>
                      Gerenciar Relato
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody p={6}>
                      <VStack spacing={6} align="stretch">
                        <Box bg={useColorModeValue('gray.800', 'gray.700')} borderRadius="lg" p={4} mb={2} boxShadow="md">
                          <Text fontWeight="bold" color="blue.200" mb={2}>Detalhes do Relato:</Text>
                          <Text color="gray.100"><b>Título:</b> {selectedRelato?.titulo}</Text>
                          <Text color="gray.100"><b>Descrição:</b> {selectedRelato?.descricao}</Text>
                          <Text color="gray.100"><b>Endereço:</b> {[selectedRelato?.endereco.rua, selectedRelato?.endereco.numero, selectedRelato?.endereco.bairro].filter(Boolean).join(', ')}</Text>
                          <HStack mt={2} spacing={3}>
                            <Badge colorScheme={getStatusColor(selectedRelato?.status || '')} fontSize="md" px={3} py={1} borderRadius="lg" fontWeight="bold">
                              {selectedRelato?.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge colorScheme="yellow" fontSize="md" px={3} py={1} borderRadius="lg" fontWeight="bold">
                              Prioridade {selectedRelato?.prioridade?.charAt(0).toUpperCase() + selectedRelato?.prioridade?.slice(1)}
                            </Badge>
                          </HStack>
                        </Box>
                        <FormControl id="status-select">
                          <FormLabel color="blue.200">Status</FormLabel>
                          <Select
                            value={novoStatus}
                            onChange={(e) => setNovoStatus(e.target.value as 'pendente' | 'em_andamento' | 'resolvido')}
                            aria-label="Selecionar status"
                            isDisabled={isUpdating}
                            bg={useColorModeValue('gray.800', 'gray.700')}
                            color="white"
                            borderColor={useColorModeValue('gray.600', 'gray.500')}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="resolvido">Resolvido</option>
                          </Select>
                        </FormControl>
                        <FormControl id="prioridade-select">
                          <FormLabel color="blue.200">Prioridade</FormLabel>
                          <Select
                            value={novaPrioridade}
                            onChange={(e) => setNovaPrioridade(e.target.value as 'alta' | 'media' | 'baixa')}
                            aria-label="Selecionar prioridade"
                            isDisabled={isUpdating}
                            bg={useColorModeValue('gray.800', 'gray.700')}
                            color="white"
                            borderColor={useColorModeValue('gray.600', 'gray.500')}
                          >
                            <option value="alta">Alta</option>
                            <option value="media">Média</option>
                            <option value="baixa">Baixa</option>
                          </Select>
                        </FormControl>
                        <FormControl id="resposta-cidadao">
                          <HStack align="center" mb={1} spacing={2}>
                            <FormLabel color="blue.200" mb={0}>Resposta ao Cidadão</FormLabel>
                            <Icon as={FaInfoCircle} color="blue.300" boxSize={4} />
                            <Text color="gray.400" fontSize="sm">Preencha apenas se desejar notificar o cidadão sobre progresso ou conclusão do problema.</Text>
                          </HStack>
                          <Textarea
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                            placeholder="Mensagem para o cidadão..."
                            isDisabled={isUpdating}
                            bg={useColorModeValue('gray.800', 'gray.700')}
                            color="white"
                            borderColor={useColorModeValue('gray.600', 'gray.500')}
                            minH="80px"
                          />
                        </FormControl>
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <Button onClick={onClose} variant="ghost" colorScheme="gray" mr={3} borderRadius="xl">Cancelar</Button>
                      <Button onClick={handleStatusChange} colorScheme="blue" borderRadius="xl" isLoading={isUpdating}>Salvar Alterações</Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </VStack>
            </TabPanel>

            {adminPermissoes?.permissionLevel === 'superadmin' && (
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Gerenciar Administradores</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Email</Th>
                        <Th>Nível</Th>
                        <Th>Permissões</Th>
                        <Th>Último Acesso</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {adminPermissoes?.adminList?.map((admin) => (
                        <Tr key={admin.id}>
                          <Td>{admin.email}</Td>
                          <Td>{admin.permissionLevel}</Td>
                          <Td>
                            <VStack align="start" spacing={2}>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0" fontSize="sm">Gerenciar Admins</FormLabel>
                                <Switch isChecked={admin.permissoes.gerenciarAdmins} isDisabled={admin.permissionLevel === 'superadmin'} />
                              </FormControl>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0" fontSize="sm">Excluir Relatos</FormLabel>
                                <Switch isChecked={admin.permissoes.excluirRelatos} isDisabled={admin.permissionLevel === 'superadmin'} />
                              </FormControl>
                            </VStack>
                          </Td>
                          <Td>{new Date(admin.ultimoAcesso).toLocaleDateString('pt-BR')}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Editar admin"
                                icon={<FaEdit />}
                                size="sm"
                                isDisabled={admin.permissionLevel === 'superadmin'}
                              />
                              <IconButton
                                aria-label="Remover admin"
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                isDisabled={admin.permissionLevel === 'superadmin'}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>
            )}

            {adminPermissoes?.permissionLevel === 'superadmin' && (
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Logs de Auditoria</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Data</Th>
                        <Th>Usuário</Th>
                        <Th>Ação</Th>
                        <Th>Detalhes</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {logs.map(log => (
                        <Tr key={log.id}>
                          <Td>{new Date(log.data).toLocaleString('pt-BR')}</Td>
                          <Td>{log.usuarioId}</Td>
                          <Td>{log.acao}</Td>
                          <Td>{log.detalhes.tipo}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}