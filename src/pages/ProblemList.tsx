import { Box, Grid, GridItem, Heading, Text, VStack, Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useBreakpointValue, Button, HStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useProblemas } from '../contexts/ProblemasContext';
import { mapStyle, createCategoryIcon } from '../utils/mapConfig';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Problema as ProblemaAtualizado } from '../types/index';

const defaultPosition = { lat: -18.9188, lng: -48.2768 }; // Uberlândia

interface MapControllerProps {
  selectedProblem: ProblemaAtualizado | null;
}

function MapController({ selectedProblem }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedProblem && selectedProblem.coordenadas) {
      map.setView(
        [selectedProblem.coordenadas.lat, selectedProblem.coordenadas.lng],
        16,
        {
          animate: true,
          duration: 0.8,
          easeLinearity: 0.5
        }
      );
    }
  }, [selectedProblem?.id, map]); // Dependência otimizada

  return null;
}

// Componente para customizar o estilo do marcador destacado
interface HighlightedMarkerProps {
  problema: ProblemaAtualizado | null;
}

function HighlightedMarker({ problema }: HighlightedMarkerProps) {
  if (!problema || !problema.coordenadas || typeof problema.coordenadas.lat !== 'number' || typeof problema.coordenadas.lng !== 'number') return null;
  
  return (
    <Marker
      position={[problema.coordenadas.lat, problema.coordenadas.lng]}
      icon={createCategoryIcon(problema.categoria, true)}
      zIndexOffset={1000}
    />
  );
}

// Componente para lidar com cliques no mapa para limpar seleção
interface MapClickHandlerProps {
  onMapClick: () => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: () => {
      // Se clicar em qualquer lugar do mapa (não em um marcador)
      onMapClick();
    }
  });
  
  return null;
}

export default function ListaProblemas() {
  const { problemas = [], excluirProblema } = useProblemas();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProblem, setSelectedProblem] = useState<ProblemaAtualizado | null>(null);
  const [highlightedProblem, setHighlightedProblem] = useState<ProblemaAtualizado | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  
  const gridTemplate = useBreakpointValue({
    base: "1fr",
    lg: "repeat(2, 1fr)"
  });

  // Estilização do body para gerenciar scroll
  useEffect(() => {
    if (isOpen || isDeleteOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isDeleteOpen]);

  const handleCardClick = useCallback((problema: ProblemaAtualizado) => {
    setHighlightedProblem(problema);
  }, []);

  const handleMarkerClick = useCallback((problema: ProblemaAtualizado) => {
    setSelectedProblem(problema);
    onOpen();
  }, [onOpen]);

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const handleOpenDetails = useCallback((problema: ProblemaAtualizado) => {
    setSelectedProblem(problema);
    onOpen();
  }, [onOpen]);

  const confirmDelete = useCallback(() => {
    if (deleteId) {
      try {
        excluirProblema(deleteId);
        
        // Limpar highlightedProblem se o problema excluído for o destacado
        setHighlightedProblem(prev => 
          prev && prev.id === deleteId ? null : prev
        );
        
        onDeleteClose();
        toast({
          title: 'Problema excluído',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Erro ao excluir problema:', error);
        toast({
          title: 'Erro ao excluir problema',
          description: 'Ocorreu um erro ao tentar excluir o problema',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [deleteId, excluirProblema, onDeleteClose, toast]);

  // Limpar o problema destacado
  const clearHighlightedProblem = useCallback(() => {
    setHighlightedProblem(null);
  }, []);
  
  // Manipular clique no mapa (fora de marcadores)
  const handleMapClick = useCallback(() => {
    clearHighlightedProblem();
  }, [clearHighlightedProblem]);

  // Função customizada para fechar modal e limpar seleção
  const handleCloseModal = useCallback(() => {
    onClose();
    setSelectedProblem(null); // Limpar selectedProblem ao fechar o modal
  }, [onClose]);

  // Verificar se coordenadas são válidas
  const hasValidCoordinates = useCallback((problema: ProblemaAtualizado) => {
    return problema.coordenadas && 
           typeof problema.coordenadas.lat === 'number' && 
           typeof problema.coordenadas.lng === 'number' &&
           !isNaN(problema.coordenadas.lat) && 
           !isNaN(problema.coordenadas.lng);
  }, []);

  // Corrigir os tipos de Problema para incluir todas as propriedades necessárias
  const problemasCorrigidos: ProblemaAtualizado[] = problemas.map(problema => ({
    ...problema,
    endereco: problema.endereco || { rua: '', numero: '', bairro: '', cidade: '', estado: '' },
    plusCode: problema.plusCode || '',
    status: problema.status || 'pendente'
  }));

  return (
    <>
      <Grid templateColumns={gridTemplate} gap={6}>
        <GridItem>
          <VStack align="stretch" spacing={4} className="lista-problemas-container">
            <Heading size="lg" mb={4}>Problemas Relatados</Heading>
            {problemasCorrigidos && problemasCorrigidos.length > 0 ? (
              problemasCorrigidos.map((problema) => (
                <Box
                  key={problema.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  boxShadow="sm"
                  cursor="pointer"
                  onClick={() => handleCardClick(problema)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(problema);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Destacar problema: ${problema.titulo}`}
                  _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                  bg={highlightedProblem?.id === problema.id ? "blue.50" : "white"}
                  _dark={{ 
                    bg: highlightedProblem?.id === problema.id ? "blue.900" : "gray.700", 
                    borderColor: highlightedProblem?.id === problema.id ? "blue.700" : "gray.600" 
                  }}
                  position="relative"
                  zIndex={1}
                >
                  <HStack justify="space-between" width="100%">
                    <Heading size="md">{problema.titulo}</Heading>
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(problema);
                        }}
                        position="relative"
                        zIndex={2}
                        aria-label={`Ver detalhes do problema: ${problema.titulo}`}
                      >
                        Detalhes
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(problema.id);
                        }}
                        position="relative"
                        zIndex={2}
                        aria-label={`Excluir problema: ${problema.titulo}`}
                      >
                        Excluir
                      </Button>
                    </HStack>
                  </HStack>
                  <Badge colorScheme="blue" mt={2}>{problema.categoria}</Badge>
                  <Text mt={2} noOfLines={2}>{problema.descricao}</Text>
                  <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }} mt={2}>
                    Relatado em: {new Date(problema.dataCriacao).toLocaleDateString()}
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="gray.500" _dark={{ color: "gray.400" }}>Nenhum problema relatado ainda.</Text>
            )}
          </VStack>
        </GridItem>
        <GridItem>
          <Box height={["300px", "400px", "calc(100vh - 200px)"]} borderRadius="lg" overflow="hidden" position="relative" boxShadow="md">
            <MapContainer
              center={[defaultPosition.lat, defaultPosition.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
              zoomControl={false}
            >
              <TileLayer
                url={mapStyle.url}
                attribution={mapStyle.attribution}
                maxZoom={mapStyle.maxZoom}
              />
              <ZoomControl position="bottomright" />
              <MapController selectedProblem={highlightedProblem || selectedProblem} />
              <MapClickHandler onMapClick={handleMapClick} />
              
            
              
              {/* Clustering de marcadores */}
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={50}
                spiderfyOnMaxZoom={true}
                disableClusteringAtZoom={17}
              >
                {problemasCorrigidos && problemasCorrigidos.map((problema) => (
                  hasValidCoordinates(problema) && (
                    <Marker
                      key={problema.id}
                      position={[problema.coordenadas.lat, problema.coordenadas.lng]}
                      icon={createCategoryIcon(problema.categoria)}
                      eventHandlers={{
                        click: () => handleMarkerClick(problema),
                        keydown: (e) => {
                          if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
                            handleMarkerClick(problema);
                          }
                        }
                      }}
                      opacity={highlightedProblem && highlightedProblem.id !== problema.id ? 0.6 : 1}
                    >
                      <Popup className="custom-popup">
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="bold">{problema.titulo}</Text>
                          <Badge colorScheme="blue">{problema.categoria}</Badge>
                          
                          <Text noOfLines={2}>{problema.descricao.substring(0, 100)}{problema.descricao.length > 100 ? '...' : ''}</Text>
                          
                          <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                            Relatado em: {new Date(problema.dataCriacao).toLocaleDateString()}
                          </Text>
                          
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            width="100%" 
                            mt={2}
                            onClick={() => handleMarkerClick(problema)}
                            aria-label={`Ver detalhes completos de ${problema.titulo}`}
                          >
                            Ver detalhes
                          </Button>
                        </VStack>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </Box>
        </GridItem>
      </Grid>

      <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        size="xl"
        blockScrollOnMount={true}
        motionPreset="slideInBottom"
        aria-labelledby="modal-problem-title"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <ModalContent 
          bg="white" 
          _dark={{ bg: "gray.800", borderColor: "gray.700" }}
          boxShadow="2xl"
          rounded="md"
          mx={4}
        >
          <ModalHeader id="modal-problem-title">
            {selectedProblem?.titulo}
            <Badge colorScheme="blue" ml={2}>
              {selectedProblem?.categoria}
            </Badge>
          </ModalHeader>
          <ModalCloseButton aria-label="Fechar detalhes do problema" />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4} width="100%">
              <Box width="100%">
                <Heading size="sm" mb={2}>Localização</Heading>
                <Text>{selectedProblem?.localizacao || 'Localização não disponível'}</Text>
              </Box>
              
              <Box width="100%">
                <Heading size="sm" mb={2}>Descrição</Heading>
                <Text>{selectedProblem?.descricao}</Text>
              </Box>
              
              <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
                Relatado em: {selectedProblem && new Date(selectedProblem.dataCriacao).toLocaleDateString()}
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        motionPreset="slideInBottom"
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(2px)">
          <AlertDialogContent 
            bg="white" 
            _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            boxShadow="2xl"
            rounded="md"
            mx={4}
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Problema
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir este problema? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={onDeleteClose}
                aria-label="Cancelar exclusão"
              >
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDelete} 
                ml={3}
                aria-label="Confirmar exclusão do problema"
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}