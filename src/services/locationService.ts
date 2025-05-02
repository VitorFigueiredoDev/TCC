import { Coordenadas, Endereco } from '../types';
// Removendo a importação problemática do OpenLocationCode
// import OpenLocationCode from 'open-location-code';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

export class LocationService {
  static async getCurrentPosition(): Promise<Coordenadas> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erro de geolocalização:', error.code, error.message);
          // Fornecer coordenadas padrão em caso de erro
          resolve({
            lat: -19.7472,
            lng: -47.9381 // Uberaba-MG padrão
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Aumentado para 15 segundos
          maximumAge: 0
        }
      );
    });
  }

  static watchPosition(
    onSuccess: (coords: Coordenadas) => void,
    onError: (error: GeolocationPositionError) => void
  ): number {
    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000
      }
    );
  }

  static stopWatching(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  static async getAddressFromCoords(coords: Coordenadas): Promise<Endereco> {
    try {
      const response = await fetch(
        `${NOMINATIM_URL}?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CitizenReportApp/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          },
          cache: 'no-cache'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
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
      // Retornar endereço padrão em caso de erro
      return {
        rua: 'Localização selecionada',
        numero: '',
        bairro: 'Área marcada no mapa',
        cidade: 'Uberaba',
        estado: 'MG'
      };
    }
  }

  static generatePlusCode(coords: Coordenadas): string {
    try {
      // Implementando uma versão simplificada de código de localização
      const lat = coords.lat.toFixed(6);
      const lng = coords.lng.toFixed(6);
      return `${lat},${lng}`;
    } catch (error) {
      console.error('Erro ao gerar código de localização:', error);
      // Fallback em caso de erro
      return `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
    }
  }

  static formatAddress(endereco: Endereco): string {
    const parts = [
      endereco.rua,
      endereco.numero,
      endereco.bairro,
      `${endereco.cidade}-${endereco.estado}`
    ].filter(Boolean);
    
    return parts.join(', ');
  }
} 