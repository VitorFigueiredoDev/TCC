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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaCheck, FaClock, FaExclamationTriangle, FaUserShield, FaHistory } from 'react-icons/fa';
import { RelatosService, Relato } from '../services/relatosService';
import { AdminService } from '../services/adminService';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [selectedRelato, setSelectedRelato] = useState<Relato | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resposta, setResposta] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const [adminPermissoes, setAdminPermissoes] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    resolvidos: 0
  });

  useEffect(() => {
    // Verificar se o usuário é admin e suas permissões
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const permissoes = await AdminService.verificarPermissoes(user.uid);
      if (!permissoes) {
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
      carregarDados();
    };

    checkAdmin();
  }, [navigate]);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      // Carregar relatos
      const dados = await RelatosService.listarRelatos();
      setRelatos(dados);
      
      // Atualizar estatísticas
      setStats({
        total: dados.length,
        pendentes: dados.filter(r => r.status === 'pendente').length,
        emAndamento: dados.filter(r => r.status === 'em_andamento').length,
        resolvidos: dados.filter(r => r.status === 'resolvido').length
      });

      // Carregar logs de auditoria se tiver permissão
      if (adminPermissoes?.permissionLevel === 'superadmin') {
        const logsData = await AdminService.listarLogs();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (relato: Relato, novoStatus: 'pendente' | 'em_andamento' | 'resolvido') => {
    if (!adminPermissoes?.permissoes.editarStatus) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para alterar o status dos relatos.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await RelatosService.atualizarStatus(relato.id!, novoStatus, resposta);
      await carregarDados();
      toast({
        title: 'Status atualizado',
        description: 'O status do relato foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do relato.',
        status: 'error',
        duration: 3000,
      });
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

  const relatosFiltrados = relatos.filter(relato => {
    const matchTipo = !filtroTipo || relato.tipo === filtroTipo;
    const matchStatus = !filtroStatus || relato.status === filtroStatus;
    const matchBusca = !busca || 
      relato.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      relato.endereco.rua.toLowerCase().includes(busca.toLowerCase()) ||
      relato.endereco.bairro.toLowerCase().includes(busca.toLowerCase());
    
    return matchTipo && matchStatus && matchBusca;
  });

  return (
    <Container maxW="container.xl" mt={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Painel Administrativo</Heading>

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
            {/* Painel de Relatos */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
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

                <HStack spacing={4}>
                  <Input
                    placeholder="Buscar relatos..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    flex={1}
                  />
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
                </HStack>

                {isLoading ? (
                  <Center py={8}>
                    <Spinner size="xl" />
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {relatosFiltrados.map(relato => (
                      <Card key={relato.id}>
                        <CardBody>
                          <VStack align="stretch" spacing={4}>
                            {relato.foto && (
                              <Image
                                src={relato.foto}
                                alt={relato.titulo}
                                borderRadius="lg"
                                w="100%"
                                h="200px"
                                objectFit="cover"
                              />
                            )}
                            
                            <Flex justify="space-between" align="center">
                              <Heading size="md">{relato.titulo}</Heading>
                              <Badge colorScheme={getStatusColor(relato.status)}>
                                {relato.status.replace('_', ' ')}
                              </Badge>
                            </Flex>
                            
                            <Text color="gray.500">
                              {[
                                relato.endereco.rua,
                                relato.endereco.numero,
                                relato.endereco.bairro,
                                `${relato.endereco.cidade}-${relato.endereco.estado}`
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
                                  onClick={() => handleDelete(relato.id!)}
                                />
                              )}
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            {/* Painel de Administradores (apenas para superadmin) */}
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
                      {admins.map(admin => (
                        <Tr key={admin.uid}>
                          <Td>{admin.email}</Td>
                          <Td>{admin.permissionLevel}</Td>
                          <Td>
                            <VStack align="start" spacing={2}>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0" fontSize="sm">
                                  Gerenciar Admins
                                </FormLabel>
                                <Switch
                                  isChecked={admin.permissoes.gerenciarAdmins}
                                  isDisabled={admin.permissionLevel === 'superadmin'}
                                />
                              </FormControl>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel mb="0" fontSize="sm">
                                  Excluir Relatos
                                </FormLabel>
                                <Switch
                                  isChecked={admin.permissoes.excluirRelatos}
                                  isDisabled={admin.permissionLevel === 'superadmin'}
                                />
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

            {/* Painel de Logs (apenas para superadmin) */}
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

        {/* Modal de Gerenciamento de Relato */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Gerenciar Relato</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedRelato && (
                <VStack spacing={4} align="stretch">
                  <Text><strong>Título:</strong> {selectedRelato.titulo}</Text>
                  <Text><strong>Descrição:</strong> {selectedRelato.descricao}</Text>
                  <Text><strong>Localização:</strong> {[
                    selectedRelato.endereco.rua,
                    selectedRelato.endereco.numero,
                    selectedRelato.endereco.bairro,
                    `${selectedRelato.endereco.cidade}-${selectedRelato.endereco.estado}`
                  ].filter(Boolean).join(', ')}</Text>
                  
                  <Divider />
                  
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={selectedRelato.status}
                      onChange={(e) => handleStatusChange(selectedRelato, e.target.value as any)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="resolvido">Resolvido</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Resposta/Observação</FormLabel>
                    <Textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      placeholder="Digite uma resposta ou observação sobre o relato..."
                    />
                  </FormControl>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={() => {
                if (selectedRelato) {
                  handleStatusChange(selectedRelato, selectedRelato.status);
                }
              }}>
                Salvar
              </Button>
              <Button onClick={onClose}>Cancelar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 