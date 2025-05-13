import { ref, push, get, update, remove, set } from 'firebase/database';
import { database } from '../config/firebase';

export interface Relato {
  id?: string;
  titulo: string;
  tipo: string;
  descricao: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  foto?: string;
  status: 'pendente' | 'em_andamento' | 'resolvido';
  dataCriacao: string;
  usuarioId: string;
  resposta?: string;
  dataAtualizacao?: string;
  atualizadoPor?: string;
  comentarios?: Comentario[];
}

export interface Comentario {
  id: string;
  usuarioId: string;
  texto: string;
  dataCriacao: string;
  nomeUsuario: string;
  isAdmin?: boolean;
}

import { cacheService } from './cacheService';
import { v4 as uuidv4 } from 'uuid';

// Chaves para cache
const CACHE_KEYS = {
  RELATOS: 'relatos',
  PERFIL: (userId: string) => `perfil_${userId}`,
  COMENTARIOS: (relatoId: string) => `comentarios_${relatoId}`
};

// Validações
const validacoes = {
  relato: (relato: Omit<Relato, 'id' | 'status' | 'dataCriacao'>) => {
    if (!relato.titulo || relato.titulo.length < 5) {
      throw new Error('O título deve ter pelo menos 5 caracteres');
    }
    if (!relato.descricao || relato.descricao.length < 10) {
      throw new Error('A descrição deve ter pelo menos 10 caracteres');
    }
    if (!relato.tipo || !['buraco', 'iluminacao', 'lixo', 'calcada', 'outros'].includes(relato.tipo)) {
      throw new Error('Tipo de relato inválido');
    }
    return true;
  },
  comentario: (comentario: Omit<Comentario, 'id' | 'dataCriacao'>) => {
    if (!comentario.texto || comentario.texto.trim().length < 2) {
      throw new Error('O comentário deve ter pelo menos 2 caracteres');
    }
    return true;
  }
}

export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  dataCadastro: string;
  fotoPerfil?: string;
  configuracoes: {
    notificacoesEmail: boolean;
    notificacoesPush: boolean;
    perfilPublico: boolean;
  };
  estatisticas: {
    totalRelatos: number;
    relatosResolvidos: number;
    comentariosFeitos: number;
    ultimaAtividade: string;
  };
}

// Adicionar métodos para gerenciar perfil
export const RelatosService = {
  async listarRelatos() {
    try {
      // Tenta obter do cache
      const cachedRelatos = cacheService.get<Relato[]>(CACHE_KEYS.RELATOS);
      if (cachedRelatos) {
        return cachedRelatos;
      }

      const relatosRef = ref(database, 'relatos');
      const snapshot = await get(relatosRef);
      const relatos: Relato[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const relato = childSnapshot.val();
          relato.id = childSnapshot.key;
          relatos.push(relato);
        });
      }

      // Armazena no cache
      cacheService.set(CACHE_KEYS.RELATOS, relatos);
      return relatos;
    } catch (error) {
      console.error('Erro ao listar relatos:', error);
      throw error;
    }
  },

  async adicionarRelato(relato: Omit<Relato, 'id' | 'status' | 'dataCriacao'>, fotoFile?: File) {
    try {
      // Validar dados do relato
      validacoes.relato(relato);

      let fotoBase64 = '';
      
      // Converter a foto para Base64 se existir
      if (fotoFile) {
        if (fotoFile.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('A foto não pode ser maior que 5MB');
        }
        if (!fotoFile.type.startsWith('image/')) {
          throw new Error('O arquivo deve ser uma imagem');
        }
        
        fotoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fotoFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }

      // Criar o objeto do relato
      const novoRelato: Omit<Relato, 'id'> = {
        ...relato,
        foto: fotoBase64,
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
      };

      // Salvar no Realtime Database
      const relatosRef = ref(database, 'relatos');
      const novoRelatoRef = await push(relatosRef, novoRelato);

      const relatoCompleto = {
        id: novoRelatoRef.key,
        ...novoRelato
      };

      // Atualizar cache
      const relatosAtuais = cacheService.get<Relato[]>(CACHE_KEYS.RELATOS) || [];
      cacheService.set(CACHE_KEYS.RELATOS, [...relatosAtuais, relatoCompleto]);

      return relatoCompleto;
    } catch (error) {
      console.error('Erro ao adicionar relato:', error);
      throw error;
    }
  },


  async atualizarStatus(id: string, atualizacao: { status: Relato['status']; resposta?: string; prioridade?: 'alta' | 'media' | 'baixa' }) {
    try {
      if (!['pendente', 'em_andamento', 'resolvido'].includes(atualizacao.status)) {
        throw new Error('Status inválido');
      }

      if (atualizacao.prioridade && !['alta', 'media', 'baixa'].includes(atualizacao.prioridade)) {
        throw new Error('Prioridade inválida');
      }

      const relatoRef = ref(database, `relatos/${id}`);
      const snapshot = await get(relatoRef);
      
      if (!snapshot.exists()) {
        throw new Error('Relato não encontrado');
      }

      const dadosAtualizacao = {
        status: atualizacao.status,
        dataAtualizacao: new Date().toISOString(),
        ...(atualizacao.resposta && { resposta: atualizacao.resposta }),
        ...(atualizacao.prioridade && { prioridade: atualizacao.prioridade })
      };
      
      await update(relatoRef, dadosAtualizacao);

      // Atualizar cache
      const relatosAtuais = cacheService.get<Relato[]>(CACHE_KEYS.RELATOS);
      if (relatosAtuais) {
        const relatosAtualizados = relatosAtuais.map(r => 
          r.id === id ? { ...r, ...atualizacao } : r
        );
        cacheService.set(CACHE_KEYS.RELATOS, relatosAtualizados);
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  },

  async excluirRelato(id: string) {
    try {
      const relatoRef = ref(database, `relatos/${id}`);
      await remove(relatoRef);
      return true;
    } catch (error) {
      console.error('Erro ao excluir relato:', error);
      throw error;
    }
  },

  async isAdmin(user: any): Promise<boolean> {
    if (!user) return false;
    
    try {
      const adminRef = ref(database, `admins/${user.uid}`);
      const snapshot = await get(adminRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      return false;
    }
  },

  async adicionarAdmin(userId: string, email: string) {
    try {
      const adminRef = ref(database, `admins/${userId}`);
      await set(adminRef, {
        email,
        dataCriacao: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar admin:', error);
      throw error;
    }
  },

  async removerAdmin(userId: string) {
    try {
      const adminRef = ref(database, `admins/${userId}`);
      await remove(adminRef);
      return true;
    } catch (error) {
      console.error('Erro ao remover admin:', error);
      throw error;
    }
  },

  async adicionarComentario(relatoId: string, comentario: Omit<Comentario, 'id' | 'dataCriacao'>) {
    try {
      const comentariosRef = ref(database, `relatos/${relatoId}/comentarios`);
      const novoComentario = {
        ...comentario,
        id: uuidv4(),
        dataCriacao: new Date().toISOString()
      };
      
      await push(comentariosRef, novoComentario);
      return novoComentario;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  },

  async excluirComentario(relatoId: string, comentarioId: string) {
    try {
      const comentarioRef = ref(database, `relatos/${relatoId}/comentarios/${comentarioId}`);
      await remove(comentarioRef);
      return true;
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      throw error;
    }
  },

  async atualizarPerfil(userId: string, dados: Partial<PerfilUsuario>) {
    try {
      const perfilRef = ref(database, `usuarios/${userId}/perfil`);
      await update(perfilRef, {
        ...dados,
        dataAtualizacao: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  async obterPerfil(userId: string) {
    try {
      const perfilRef = ref(database, `usuarios/${userId}/perfil`);
      const snapshot = await get(perfilRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  }
};