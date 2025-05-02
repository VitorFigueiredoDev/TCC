import React, { useState, useEffect } from 'react';
import { useToast, Box, Text, Button, Container, FormControl, FormLabel, Input, Textarea, VStack, Select, Heading, HStack, IconButton, Spinner, Image } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FaLocationArrow } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RelatosService } from '../services/relatosService';
import { auth } from '../config/firebase';


// Corrigir os ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para eventos do mapa
function MapEvents({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationFound(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Função para obter o endereço a partir das coordenadas usando a API Nominatim do OpenStreetMap
const getAddressFromCoords = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.error) {
      throw new Error('Endereço não encontrado');
    }
    
    const address = data.address || {};
    
    return {
      rua: address.road || address.street || address.pedestrian || '',
      numero: address.house_number || '',
      bairro: address.suburb || address.neighbourhood || address.quarter || '',
      cidade: address.city || address.town || address.village || address.municipality || 'Uberaba',
      estado: address.state || 'MG'
    };
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return {
      rua: '',
      numero: '',
      bairro: '',
      cidade: 'Uberaba',
      estado: 'MG'
    };
  }
};

export default function RelatarProblema() {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: '',
    foto: null as File | null,
    rua: '',
    numero: '',
    bairro: '',
    cidade: 'Uberaba',
    estado: 'MG',
    coordenadas: { lat: -19.7487, lng: -47.9386 }
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error('Endereço não encontrado');
      }
      
      const address = data.address || {};
      
      setFormData(prev => ({
        ...prev,
        coordenadas: { lat, lng },
        rua: address.road || address.street || address.pedestrian || '',
        numero: address.house_number || '',
        bairro: address.suburb || address.neighbourhood || address.quarter || '',
        cidade: address.city || address.town || address.village || address.municipality || 'Uberaba',
        estado: address.state || 'MG'
      }));
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    }
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          getAddressFromCoords(latitude, longitude);
        },
        (error) => {
          toast({
            title: 'Erro ao obter localização',
            description: 'Não foi possível obter sua localização atual.',
            status: 'error',
            duration: 3000,
          });
        }
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, foto: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      toast({
        title: 'Erro ao enviar',
        description: 'Você precisa estar logado para relatar um problema.',
        status: 'error',
        duration: 3000,
      });
      navigate('/login');
      return;
    }

    if (!formData.titulo || !formData.descricao || !formData.tipo) {
      toast({
        title: 'Erro ao enviar',
        description: 'Por favor, preencha todos os campos obrigatórios',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);

      await RelatosService.adicionarRelato({
        titulo: formData.titulo,
        tipo: formData.tipo,
        descricao: formData.descricao,
        coordenadas: formData.coordenadas,
        endereco: {
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
        },
        usuarioId: auth.currentUser.uid,
      }, formData.foto || undefined);

      toast({
        title: 'Problema relatado com sucesso!',
        description: 'Seu relato foi enviado e será analisado.',
        status: 'success',
        duration: 3000,
      });
      
      navigate('/problemas');
    } catch (error) {
      console.error('Erro ao enviar relato:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Ocorreu um erro ao enviar seu relato. Tente novamente.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" mt="80px">
      <VStack spacing={8} align="stretch">
        <Heading>Relatar Problema</Heading>
        
        {/* Mapa */}
        <Box position="relative" h="400px" borderRadius="lg" overflow="hidden">
          <MapContainer
            center={[formData.coordenadas.lat, formData.coordenadas.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[formData.coordenadas.lat, formData.coordenadas.lng]} />
            <MapEvents onLocationFound={getAddressFromCoords} />
          </MapContainer>
          
          <IconButton
            aria-label="Usar localização atual"
            icon={<FaLocationArrow />}
            position="absolute"
            top={4}
            right={4}
            zIndex={1000}
            onClick={handleLocationClick}
            colorScheme="blue"
          />
        </Box>

        {/* Exibição do endereço */}
        {(formData.rua || formData.bairro) && (
          <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Text>
              {[
                formData.rua,
                formData.numero,
                formData.bairro,
                `${formData.cidade}-${formData.estado}`
              ].filter(Boolean).join(', ')}
            </Text>
          </Box>
        )}

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Título</FormLabel>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Buraco na calçada"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Tipo do Problema</FormLabel>
              <Select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Selecione o tipo do problema"
              >
                <option value="buraco">Buraco na Via</option>
                <option value="iluminacao">Problema de Iluminação</option>
                <option value="lixo">Descarte Irregular de Lixo</option>
                <option value="calcada">Calçada Danificada</option>
                <option value="outros">Outros</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o problema em detalhes"
                rows={4}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Foto do Problema</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                p={1}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="100%"
              mt={4}
              isLoading={isLoading}
              loadingText="Enviando..."
            >
              Enviar Relato
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}