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
}

export const RelatosService = {
  async adicionarRelato(relato: Omit<Relato, 'id' | 'status' | 'dataCriacao'>, fotoFile?: File) {
    try {
      let fotoBase64 = '';
      
      // Converter a foto para Base64 se existir
      if (fotoFile) {
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

      return {
        id: novoRelatoRef.key,
        ...novoRelato
      };
    } catch (error) {
      console.error('Erro ao adicionar relato:', error);
      throw error;
    }
  },

  async listarRelatos() {
    try {
      const relatosRef = ref(database, 'relatos');
      const snapshot = await get(relatosRef);

      const relatos: Relato[] = [];
      snapshot.forEach((childSnapshot) => {
        relatos.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Ordenar por data de criação (do mais recente para o mais antigo)
      return relatos.sort((a, b) => 
        new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );
    } catch (error) {
      console.error('Erro ao listar relatos:', error);
      throw error;
    }
  },

  async atualizarStatus(id: string, novoStatus: Relato['status'], resposta?: string) {
    try {
      const relatoRef = ref(database, `relatos/${id}`);
      const atualizacao = {
        status: novoStatus,
        dataAtualizacao: new Date().toISOString(),
        ...(resposta && { resposta })
      };
      
      await update(relatoRef, atualizacao);
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
  }
};