import { Box, Grid, GridItem, Heading, Text, VStack, Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button, HStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure } from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { Map } from './Map';
import { ProblemService } from '../services/problemService';
import { Problema } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProblemList() {
  const [problems, setProblems] = useState<Problema[]>(ProblemService.getProblems());
  const [selectedProblem, setSelectedProblem] = useState<Problema | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const handleProblemClick = (problem: Problema) => {
    setSelectedProblem(problem);
    onOpen();
  };

  const handleDelete = (id: string) => {
    setSelectedProblem(problems.find(p => p.id === id) || null);
    onDeleteOpen();
  };

  const confirmDelete = () => {
    if (selectedProblem) {
      const success = ProblemService.deleteProblem(selectedProblem.id);
      if (success) {
        setProblems(ProblemService.getProblems());
        toast({
          title: 'Problema excluído com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }
    onDeleteClose();
  };

  const getStatusColor = (status: Problema['status']) => {
    switch (status) {
      case 'pendente':
        return 'yellow';
      case 'em_andamento':
        return 'blue';
      case 'resolvido':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: Problema['status']) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'resolvido':
        return 'Resolvido';
      default:
        return status;
    }
  };

  return (
    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
      <GridItem>
        <VStack align="stretch" spacing={4}>
          <Heading size="lg" mb={4}>Problemas Relatados</Heading>
          {problems.map((problem) => (
            <Box
              key={problem.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              boxShadow="sm"
              cursor="pointer"
              onClick={() => handleProblemClick(problem)}
              _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
              transition="all 0.2s"
            >
              <HStack justify="space-between" width="100%">
                <Heading size="md">{problem.titulo}</Heading>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(problem.id);
                  }}
                >
                  Excluir
                </Button>
              </HStack>
              <Badge colorScheme="blue" mt={2}>{problem.categoria}</Badge>
              <Badge colorScheme={getStatusColor(problem.status)} ml={2}>
                {getStatusText(problem.status)}
              </Badge>
              <Text mt={2} color="gray.600">{problem.localizacao}</Text>
              <Text mt={2}>{problem.descricao}</Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Relatado em: {format(new Date(problem.dataCriacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
            </Box>
          ))}
          {problems.length === 0 && (
            <Text color="gray.500">Nenhum problema relatado ainda.</Text>
          )}
        </VStack>
      </GridItem>

      <GridItem>
        <Box height="calc(100vh - 200px)" borderRadius="lg" overflow="hidden">
          <Map
            center={selectedProblem 
              ? [selectedProblem.coordenadas.lat, selectedProblem.coordenadas.lng]
              : [-19.7472, -47.9381]}
            zoom={13}
            position={selectedProblem 
              ? new L.LatLng(selectedProblem.coordenadas.lat, selectedProblem.coordenadas.lng)
              : null}
            categoria={selectedProblem?.categoria || 'outros'}
          />
        </Box>
      </GridItem>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProblem?.titulo}
            <Badge colorScheme="blue" ml={2}>
              {selectedProblem?.categoria}
            </Badge>
            <Badge colorScheme={getStatusColor(selectedProblem?.status || 'pendente')} ml={2}>
              {getStatusText(selectedProblem?.status || 'pendente')}
            </Badge>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4}>
              <Text><strong>Localização:</strong> {selectedProblem?.localizacao}</Text>
              <Text><strong>Descrição:</strong> {selectedProblem?.descricao}</Text>
              <Text fontSize="sm" color="gray.500">
                Relatado em: {selectedProblem && format(new Date(selectedProblem.dataCriacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
              {selectedProblem?.plusCode && (
                <Text><strong>Plus Code:</strong> {selectedProblem.plusCode}</Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Problema
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir este problema? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Grid>
  );
} 