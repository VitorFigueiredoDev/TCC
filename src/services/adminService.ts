import { ref, get, set, onValue } from 'firebase/database';
import { database, auth } from '../config/firebase';
import { User } from 'firebase/auth';

interface AdminPermissoes {
  nome: string;
  permissionLevel: 'admin' | 'superadmin';
  permissoes: {
    editarStatus: boolean;
    excluirRelatos: boolean;
    gerenciarAdmins: boolean;
    visualizarEstatisticas: boolean;
  };
}

export const AdminService = {
  async verificarAutorizacaoAdmin(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    try {
      const adminRef = ref(database, `admins/${user.uid}`);
      const snapshot = await get(adminRef);
      
      if (!snapshot.exists()) return false;
      
      const adminData = snapshot.val();
      return adminData.permissionLevel === 'admin' || adminData.permissionLevel === 'superadmin';
    } catch (error) {
      console.error('Erro ao verificar autorização de admin:', error);
      return false;
    }
  },

  async monitorarPermissoesAdmin(uid: string, callback: (permissoes: AdminPermissoes | null) => void) {
    const adminRef = ref(database, `admins/${uid}`);
    return onValue(adminRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });
  },
  async listarLogs() {
    try {
      // Verificar se o usuário atual é admin
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const isAdmin = await this.verificarAutorizacaoAdmin(currentUser);
      if (!isAdmin) {
        throw new Error('Permission denied');
      }

      const logsRef = ref(database, 'admin_logs');
      const snapshot = await get(logsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = snapshot.val();
      return Object.values(logs).sort((a: any, b: any) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
    } catch (error) {
      console.error('Erro ao listar logs:', error);
      throw error;
    }
  },
  async verificarAdmin(user: User | null) {
    if (!user) return false;
    
    try {
      const adminsRef = ref(database, 'admins');
      const snapshot = await get(adminsRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  },

  async verificarCredenciaisAdmin(user: User | null) {
    if (!user) return false;
    return this.verificarAutorizacaoAdmin(user);
  },

  async registrarAdmin(uid: string) {
    try {
      const adminRef = ref(database, `admins/${uid}`);
      await set(adminRef, {
        email: auth.currentUser?.email,
        dataCriacao: new Date().toISOString(),
        nome: 'Administrador',
        permissionLevel: 'admin',
        permissoes: {
          editarStatus: true,
          excluirRelatos: true,
          gerenciarAdmins: false,
          visualizarEstatisticas: true
        }
      });
      return true;
    } catch (error) {
      console.error('Erro ao registrar admin:', error);
      throw error;
    }
  },

  async verificarPermissoes(uid: string): Promise<AdminPermissoes | null> {
    try {
      const adminRef = ref(database, `admins/${uid}`);
      const snapshot = await get(adminRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const adminData = snapshot.val();
      return {
        nome: adminData.nome || 'Administrador',
        permissionLevel: adminData.permissionLevel || 'admin',
        permissoes: {
          editarStatus: adminData.permissoes?.editarStatus ?? true,
          excluirRelatos: adminData.permissoes?.excluirRelatos ?? true,
          gerenciarAdmins: adminData.permissoes?.gerenciarAdmins ?? false
        }
      };
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return null;
    }
  }
};