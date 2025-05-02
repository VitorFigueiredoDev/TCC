import { Icon } from 'leaflet';

// Definição das cores por categoria
export const categoryColors = {
  infraestrutura: '#FF6B6B',
  iluminacao: '#FFD93D',
  limpeza: '#6BCB77',
  seguranca: '#4D96FF',
  outros: '#B39CD0'
};

// Configuração do estilo do mapa
export const mapStyle = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19
};

// Função para criar ícone personalizado baseado na categoria
export function createCategoryIcon(categoria: string, isHighlighted: boolean = false) {
  const color = categoryColors[categoria as keyof typeof categoryColors] || categoryColors.outros;
  const size = isHighlighted ? 40 : 32;
  const glowEffect = isHighlighted 
    ? `<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
         <feGaussianBlur stdDeviation="2.5" result="glow"/>
         <feMerge>
           <feMergeNode in="glow"/>
           <feMergeNode in="SourceGraphic"/>
         </feMerge>
       </filter>` 
    : '';
  
  const iconStyle = isHighlighted 
    ? `filter:url(#glow);` 
    : '';
  
  return new Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <style>
          .marker { ${iconStyle} }
        </style>
        ${glowEffect}
        <path class="marker" fill="${color}" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      </svg>`
    )}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
    className: isHighlighted ? 'custom-marker-icon highlighted' : 'custom-marker-icon'
  });
}