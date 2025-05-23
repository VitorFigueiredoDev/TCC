import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Flex,
  Image,
  chakra,
  Stack,
  Badge,
  HStack,
  useDisclosure,
  Card,
  CardBody,
  AspectRatio,
  Circle,
  Divider,
  Center,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaUsers, FaClipboardList, FaChevronRight, FaBuilding, FaRoad, FaWater, FaArrowRight, FaStar, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { RelatosService, Relato } from '../services/relatosService';

// Componente de animação com Chakra + Framer Motion
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => !["transition"].includes(prop)
});

// Componente de card de problema com design moderno
const ProblemCard = ({
  title,
  description,
  category,
  status,
  imageUrl,
  tipo
}: {
  title: string;
  description: string;
  category?: string;
  status?: string;
  imageUrl?: string;
  tipo?: string;
}) => {
  const bgCard = useColorModeValue('white', 'gray.800');
  // Sombra mais suave para o tema branco
  const shadowColor = useColorModeValue('0px 7px 29px rgba(100, 100, 111, 0.15)', '0px 8px 32px rgba(0, 0, 0, 0.2)');
  const borderColor = useColorModeValue('gray.100', 'gray.700'); // Borda sutil para definição

  const mapTipoToImg = {
    buraco: '/imagens/Buraco na Via.jpg',
    iluminacao: '/imagens/Problema de Iluminação.jpg',
    lixo: '/imagens/Descarte irregular de Lixo.jpg',
    calcada: '/imagens/Calçada Danificada.jpg',
    outros: '/imagens/Outros.jpg',
  };
  const imagemPadrao = tipo ? (mapTipoToImg[tipo] || mapTipoToImg['outros']) : '/imagens/Outros.jpg';

  return (
    <Card
      overflow="hidden"
      bg={bgCard}
      shadow="none" // Sombra aplicada no hover para melhor performance inicial
      borderWidth="1px" // Borda sutil para definir o card no tema branco
      borderColor={borderColor}
      borderRadius="2xl" // Um pouco mais arredondado para suavidade
      transition="all 0.3s ease-in-out"
      _hover={{
        transform: 'translateY(-6px) scale(1.015)',
        boxShadow: shadowColor
      }}
      height="100%"
      position="relative"
      role="group" // Para _groupHover na imagem
    >
      {/* Overlay decorativo sutil */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="50px"
        height="50px"
        background={useColorModeValue(
          "linear-gradient(135deg, rgba(66,153,225,0.08) 0%, rgba(159,122,234,0.08) 100%)", // Mais sutil
          "linear-gradient(135deg, rgba(66,153,225,0.1) 0%, rgba(159,122,234,0.1) 100%)"
        )}
        borderBottomLeftRadius="xl" // Coerente com borderRadius do Card
        zIndex={1}
      />

      <AspectRatio ratio={16 / 9}>
        <Box position="relative">
          <Image
            src={imageUrl || imagemPadrao}
            alt={title}
            objectFit="cover"
            w="full"
            h="full"
            transition="transform 0.4s ease-out" // Suavizar transição
            _groupHover={{ transform: 'scale(1.08)' }} // Zoom mais sutil na imagem
          />
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            height="60%" // Um pouco maior para garantir legibilidade do texto se o título for sobre a imagem
            background="linear-gradient(to top, rgba(0,0,0,0.5), transparent)"
            opacity={0.8} // Levemente mais forte
          />
        </Box>
      </AspectRatio>

      <CardBody p={5}> {/* Padding um pouco menor */}
        <VStack align="stretch" spacing={3}>
          <Flex justify="space-between" align="center">
            <Badge
              colorScheme={status === 'Resolvido' ? 'green' : status === 'Em progresso' ? 'yellow' : 'blue'} // Orange pode ser muito forte, Yellow é uma alternativa
              variant="subtle" // Variante subtle é boa para temas claros
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="medium" // Um pouco menos forte
            >
              {status || 'Reportado'}
            </Badge>
            <Circle size="8" bg={useColorModeValue("blue.50", "blue.800")} >
              <Icon as={
                category === 'Infraestrutura' ? FaBuilding :
                  category === 'Vias' ? FaRoad :
                    FaWater // Ícone padrão
              } color="blue.500" _dark={{ color: "blue.300" }} boxSize="16px" />
            </Circle>
          </Flex>

          <Box>
            <Heading size="md" mb={1} fontWeight="semibold" noOfLines={1} color={useColorModeValue('gray.700', 'white')}>
              {title}
            </Heading>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} noOfLines={2} lineHeight="base">
              {description}
            </Text>
          </Box>

          <Divider borderColor={useColorModeValue('gray.200', 'gray.700')} />

          <HStack justify="space-between" align="center">
            <Text fontSize="xs" fontWeight="medium" color={useColorModeValue('gray.500', 'gray.400')}>
              {category || 'Geral'} {/* Texto mais genérico se não houver categoria */}
            </Text>
            <Icon as={FaArrowRight} color="blue.400" _dark={{ color: "blue.300" }} boxSize="14px" />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Componente de estatística
const StatBox = ({ icon, number, label }) => {
  // Para tema branco, um fundo branco sólido com sombra pode ser mais clean que glassmorphism,
  // ou um glassmorphism com borda mais visível.
  const bgBox = useColorModeValue('white', 'gray.700'); // Menos transparência para melhor leitura no branco
  const borderColor = useColorModeValue('gray.200', 'gray.600'); // Borda mais visível no branco
  const shadow = useColorModeValue('md', 'lg'); // Sombra padrão do Chakra

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <Card
      ref={ref}
      bg={bgBox}
      // backdropFilter={useColorModeValue("blur(10px)", "blur(20px)")} // Opcional: manter se gostar do efeito
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      shadow={shadow}
      overflow="hidden"
      position="relative"
      _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} // Sombra mais pronunciada no hover
      transition="all 0.3s ease-out"
    >
      {/* Gradiente decorativo mais sutil */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        background={useColorModeValue(
          "linear-gradient(135deg, rgba(66,153,225,0.03) 0%, rgba(159,122,234,0.03) 100%)",
          "linear-gradient(135deg, rgba(66,153,225,0.05) 0%, rgba(159,122,234,0.05) 100%)"
        )}
        opacity={inView ? 1 : 0}
        transition="opacity 0.8s ease-in-out"
      />

      <CardBody p={6} textAlign="center" position="relative" zIndex={1}>
        <VStack spacing={4}>
          <Circle size="14" bg={useColorModeValue("blue.100", "blue.800")} // Mais contraste
          >
            <Icon as={icon} w={7} h={7} color="blue.500" _dark={{ color: "blue.300" }} />
          </Circle>
          <Box>
            <Text fontWeight="bold" fontSize="3xl" mb={1} // Ajuste de tamanho e peso
                  bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
              {number}
            </Text>
            <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm" fontWeight="medium">
              {label}
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Componente de feature
const FeatureBox = ({ icon, title, description }) => {
  const bgBox = useColorModeValue('white', 'gray.700'); // Consistência com StatBox
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <Card
      ref={ref}
      bg={bgBox}
      borderRadius="xl" // Consistência
      shadow="base" // Sombra base sutil
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      position="relative"
      p={6} // Padding interno
      _hover={{
        shadow: 'lg', // Sombra mais forte no hover
        transform: 'translateY(-4px)'
      }}
      transition="all 0.3s ease-out"
      height="100%" // Para alinhar altura em SimpleGrid
    >
      {/* Elemento decorativo sutil */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="80px"
        height="80px"
        background={useColorModeValue(
            "linear-gradient(135deg, rgba(66,153,225,0.04) 0%, rgba(159,122,234,0.04) 100%)",
            "linear-gradient(135deg, rgba(66,153,225,0.06) 0%, rgba(159,122,234,0.06) 100%)"
        )}
        borderBottomLeftRadius="3xl" // Mais pronunciado
      />

      <VStack spacing={5} align="flex-start" position="relative" zIndex={1}> {/* Alinhar à esquerda */}
        <Flex justify="space-between" align="flex-start" w="full">
          <Circle size="12" bg={useColorModeValue("blue.100", "blue.800")} >
            <Icon as={icon} w={6} h={6} color="blue.500" _dark={{ color: "blue.300" }} />
          </Circle>
          {/* Ícone opcional, pode ser removido se parecer muito busy */}
          {/* <Icon as={FaChartLine} color={useColorModeValue("blue.300", "blue.500")} boxSize="20px" /> */}
        </Flex>

        <Box>
          <Heading size="md" mb={2} fontWeight="semibold" color={useColorModeValue('gray.700', 'white')}>
            {title}
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm" lineHeight="tall"> {/* Maior espaçamento entre linhas */}
            {description}
          </Text>
        </Box>
      </VStack>
    </Card>
  );
};

export default function Home() {
  const navigate = useNavigate();
  // const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false }); // isOpen e onToggle não estão sendo usados no return. Removido para simplificar.
  const { ref, inView } = useInView({ // Este inView parece controlar a animação do Hero.
    threshold: 0.1,
    triggerOnce: true
  });

  const [ultimosProblemas, setUltimosProblemas] = useState<Relato[]>([]);

  // useEffect para animação do Hero (exemplo, se necessário)
  // useEffect(() => {
  // if (inView) {
  // // Lógica de animação baseada no inView do Hero, se houver
  // }
  // }, [inView]);

  useEffect(() => {
    async function buscarUltimosProblemas() {
      try {
        const relatos = await RelatosService.listarRelatos();
        const ordenados = relatos.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
        setUltimosProblemas(ordenados.slice(0, 3));
      } catch (error) {
        console.error("Erro ao buscar últimos problemas:", error); // Adicionar log
      }
    }
    buscarUltimosProblemas();
  }, []);

  const textColor = useColorModeValue('gray.700', 'gray.300'); // Um pouco mais escuro para melhor contraste no branco
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');

  const heroBackgroundImage = useColorModeValue(
    "url('/imagens/SUNCITY.png')",
    "url('/imagens/NIGHTCITY.jpg')"
  );

  const overlayGradient = useColorModeValue(
    // Gradiente mais suave para o tema claro, para não sobrecarregar a imagem SUNCITY
    "linear-gradient(135deg, rgba(59, 130, 246, 0.75), rgba(147, 51, 234, 0.65))", // Ajustar opacidade
    "linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(55, 48, 163, 0.8))"
  );

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')}> {/* Fundo global sutilmente off-white */}
      {/* Hero Section */}
      <Box
        ref={ref} // Adicionar ref aqui se a animação do Hero depender dele
        bgImage={heroBackgroundImage}
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        minH="90vh" // Ligeiramente menor se não precisar de full viewport height
        display="flex"
        alignItems="center"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: overlayGradient,
          zIndex: 0
        }}
      >
        {/* Elementos flutuantes com opacidade ajustada para tema claro */}
        <MotionBox position="absolute" top="10%" left="5%" w="20px" h="20px" bg="white" opacity={useColorModeValue(0.15, 0.1)} borderRadius="full" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
        <MotionBox position="absolute" top="30%" right="10%" w="12px" h="12px" bg="white" opacity={useColorModeValue(0.2, 0.15)} borderRadius="full" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}/>
        <MotionBox position="absolute" bottom="20%" left="15%" w="16px" h="16px" bg="white" opacity={useColorModeValue(0.15, 0.1)} borderRadius="full" animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 1 }}/>

        <Container maxW="container.xl" position="relative" zIndex={1} py={{ base: 20, md: 28 }}>
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            spacing={{ base: 10, md: 16 }}
            justify="space-between"
          >
            <VStack
              align={{ base: 'center', lg: 'flex-start' }}
              spacing={8} // Ajustar espaçamento
              maxW={{ base: 'full', lg: '3xl' }}
              textAlign={{ base: 'center', lg: 'left' }}
            >
              <MotionBox initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
                <Text
                  fontSize="md" // Um pouco menor para hierarquia
                  fontWeight="semibold" // Medium ou Semibold
                  color="whiteAlpha.800"
                  mb={2} // Menor margem
                  letterSpacing="wider" // Um pouco mais espaçado
                  textTransform="uppercase"
                >
                  Plataforma Colaborativa
                </Text>
                <Heading
                  as="h1"
                  fontSize={{ base: '3xl', sm: '4xl', md: '5xl', lg: '6xl' }} // Ajustar tamanhos responsivos
                  fontWeight="extrabold" // Manter forte
                  fontFamily="'Inter', sans-serif"
                  mb={4} // Menor margem
                  lineHeight="1.1" // Ajustar altura da linha
                  color="white"
                  /* textShadow="0px 3px 15px rgba(0,0,0,0.25)" // Sombra mais sutil */
                >
                  Fala
                  <Text as="span" bgGradient="linear(to-r,rgb(255, 0, 47),rgb(222, 5, 5))" bgClip="text"> {/* Ajuste no gradiente */}
                    {" "}Triângulo
                  </Text>
                </Heading>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }} // Ajustar
                  mb={8} // Ajustar
                  color="whiteAlpha.900"
                  maxW="xl" // Um pouco menor para não ser tão largo
                  lineHeight="1.7"
                  fontWeight="normal" // Normal para texto corrido
                >
                  Transforme sua cidade através da colaboração.
                  Relate, acompanhe e resolva problemas urbanos de forma inteligente.
                </Text>
              </MotionBox>

              <MotionBox initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}>
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} w="full" maxW={{ sm: 'md', lg: 'lg' }}>
                  <Button
                    size="lg"
                    bg="white"
                    color="blue.600" // Cor do texto mais escura para contraste
                    px={8}
                    py={7} // Manter se o tamanho do botão for importante
                    fontWeight="bold"
                    borderRadius="lg" // Consistência com outros borderRadius
                    rightIcon={<FaArrowRight />}
                    onClick={() => navigate('/relatar')}
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: '0px 6px 20px rgba(255,255,255,0.25)', // Sombra no hover
                      bg: 'gray.50'
                    }}
                    transition="all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    flex={{ base: 'none', sm: 1 }} // Para ocupar espaço igual no mobile
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    Relatar Problema
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    colorScheme="whiteAlpha"
                    borderColor="whiteAlpha.700" // Borda um pouco mais visível
                    px={8}
                    py={7}
                    fontWeight="bold"
                    borderRadius="lg"
                    borderWidth="2px"
                    color="white"
                    _hover={{
                      bg: 'whiteAlpha.200',
                      transform: 'translateY(-2px)'
                    }}
                    transition="all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    onClick={() => navigate('/mapa')}
                    flex={{ base: 'none', sm: 1 }}
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    Explorar Mapa
                  </Button>
                </Stack>
              </MotionBox>
            </VStack>
          </Stack>
        </Container>
      </Box>

      {/* Estatísticas Section */}
      <Box position="relative" py={{ base: 16, md: 24 }} bg={useColorModeValue('gray.50', 'transparent')}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 8 }}>
            <StatBox
              icon={FaMapMarkedAlt}
              number="2,500+"
              label="Problemas reportados"
            />
            <StatBox
              icon={FaUsers}
              number="12K+"
              label="Usuários ativos"
            />
            <StatBox
              icon={FaClipboardList}
              number="76%"
              label="Taxa de resolução"
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('white', 'gray.800')}> {/* Fundo branco puro aqui */}
        <Container maxW="container.xl">
          <VStack spacing={{ base: 12, md: 16 }}>
            <VStack spacing={4} textAlign="center" maxW="2xl"> {/* Um pouco menor maxW */}
              <Text fontSize="sm" fontWeight="bold" color="blue.500" letterSpacing="wide" textTransform="uppercase">
                Como Funciona
              </Text>
              <Heading fontSize={{ base: '2xl', md: '4xl' }} fontWeight="bold" lineHeight="1.2" color={useColorModeValue('gray.700', 'white')}>
                Plataforma Inteligente para
                <Text as="span" color="blue.500"> Cidades Conectadas</Text>
              </Heading>
              <Text fontSize={{base: "md", md: "lg"}} color={subtleTextColor} lineHeight="1.7">
                Nossa tecnologia conecta cidadãos e governo para criar soluções urbanas eficientes e colaborativas.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 8 }} w="full">
              <FeatureBox
                icon={FaMapMarkedAlt}
                title="Mapeamento Inteligente"
                description="Sistema avançado de geolocalização com IA para identificação precisa de problemas urbanos e otimização de rotas de resolução."
              />
              <FeatureBox
                icon={FaUsers}
                title="Comunidade Conectada"
                description="Rede social urbana que conecta cidadãos, lideranças e governo para colaboração em tempo real e engajamento contínuo."
              />
              <FeatureBox
                icon={FaClipboardList}
                title="Analytics Avançado"
                description="Dashboard inteligente com insights preditivos, métricas de performance e relatórios automatizados para tomada de decisão."
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Problemas Recentes */}
      <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('gray.50', 'gray.900')}> {/* Novamente off-white */}
        <Container maxW="container.xl">
          <VStack spacing={{ base: 12, md: 16 }}>
            <VStack spacing={4} textAlign="center">
              <HStack spacing={2}>
                <Circle size="10" bg={useColorModeValue("green.100", "green.800")}>
                  <Icon as={FaStar} color="green.500" _dark={{ color: "green.300" }} boxSize="18px"/>
                </Circle>
                <Text fontSize="sm" fontWeight="bold" color="green.500" letterSpacing="wide" textTransform="uppercase">
                  Recentes
                </Text>
              </HStack>
              <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={useColorModeValue('gray.700', 'white')}>
                Últimos Relatos da Comunidade
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color={subtleTextColor} maxW="xl">
                Veja os problemas mais recentes reportados e acompanhe o progresso das soluções em sua região.
              </Text>
            </VStack>

            {ultimosProblemas.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 6, md: 8 }} w="full">
                {ultimosProblemas.map((problema) => (
                  <ProblemCard
                    key={problema.id}
                    title={problema.titulo}
                    description={problema.descricao}
                    status={problema.status}
                    imageUrl={problema.foto}
                    tipo={problema.tipo}
                    category={problema.categoria} // Adicionei categoria se existir no seu tipo Relato
                  />
                ))}
              </SimpleGrid>
            ) : (
                <Text color={subtleTextColor}>Nenhum problema recente para exibir.</Text>
            )}


            <Button
              variant="ghost"
              colorScheme="blue"
              rightIcon={<FaArrowRight />}
              onClick={() => navigate('/problemas')}
              size="lg"
              borderRadius="lg"
              fontWeight="semibold"
              px={8}
              _hover={{ bg: useColorModeValue('blue.50', 'blue.800'), transform: 'translateX(4px)' }}
              transition="all 0.2s ease-out"
            >
              Ver todos os problemas
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box
        py={{ base: 20, md: 32 }}
        bgGradient="linear(135deg, blue.500, purple.500, pink.400)" // Cores um pouco mais claras/vibrantes
        position="relative"
        overflow="hidden"
      >
        {/* Elementos decorativos */}
        <Box position="absolute" top="-15%" left="-10%" w={{base: "150px", md:"200px"}} h={{base: "150px", md:"200px"}} bg="whiteAlpha.100" borderRadius="full" filter="blur(5px)"/>
        <Box position="absolute" bottom="-15%" right="-10%" w={{base: "200px", md:"300px"}} h={{base: "200px", md:"300px"}} bg="whiteAlpha.100" borderRadius="full" filter="blur(5px)"/>

        <Container maxW="container.lg" position="relative" zIndex={1}> {/* Container um pouco menor para CTA */}
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align="center"
            spacing={{ base: 10, md: 12 }}
            textAlign={{ base: 'center', lg: 'left' }}
          >
            <VStack align={{ base: 'center', lg: 'flex-start' }} spacing={5} maxW="lg">
              <Heading
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="extrabold"
                color="white"
                lineHeight="1.2"
              >
                Seja Parte da
                <Text as="span" color="yellow.300"> Transformação</Text>
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.800" lineHeight="1.7" maxW="md">
                Junte-se a milhares de cidadãos que já estão construindo cidades mais inteligentes e conectadas.
                Sua voz importa, sua ação transforma.
              </Text>
              <HStack spacing={3}>
                <Circle size="10" bg="whiteAlpha.200">
                  <Icon as={FaUsers} color="white" boxSize="20px"/>
                </Circle>
                <Text color="whiteAlpha.800" fontSize="sm" fontWeight="medium">
                  +12.000 cidadãos ativos
                </Text>
              </HStack>
            </VStack>

            <VStack spacing={3}>
              <Button
                size="xl" // Chakra UI não tem 'xl' por padrão, 'lg' é o maior. Se precisar de maior, defina h e minW.
                height="60px" // Exemplo de tamanho maior
                minWidth="280px" // Exemplo
                bg="white"
                color="purple.600"
                _hover={{ bg: 'gray.100', transform: 'translateY(-2px)', shadow: "xl" }}
                px={10} // Padding horizontal
                // py={8} // Padding vertical é controlado por height e fontSize
                borderRadius="xl" // Consistência
                fontWeight="bold"
                fontSize="md"
                onClick={() => navigate('/cadastro')}
                boxShadow="0px 6px 20px rgba(0,0,0,0.15)" // Sombra mais definida
                transition="all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              >
                Criar Conta Gratuita
              </Button>
              <Text fontSize="xs" color="whiteAlpha.700">
                Cadastro rápido • 100% gratuito
              </Text>
            </VStack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}