export interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Problema {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  localizacao: string;
  coordenadas: Coordenadas;
  endereco: Endereco;
  plusCode: string;
  dataCriacao: Date;
  status: 'pendente' | 'em_andamento' | 'resolvido';
}

export interface FormData {
  titulo: string;
  categoria: string;
  descricao: string;
  endereco: Endereco;
  coordenadas: Coordenadas;
  plusCode: string;
}

export type Categoria = 'infraestrutura' | 'iluminacao' | 'limpeza' | 'seguranca' | 'outros';