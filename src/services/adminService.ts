import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';

const ADMIN_EMAIL = 'admin@falatriangulo.com';
const ADMIN_PASSWORD = 'admin123';

interface AdminPermissoes {
  nome: string;
  permissionLevel: 'admin' | 'superadmin';
  permissoes: {
    editarStatus: boolean;
    excluirRelatos: boolean;
    gerenciarAdmins: boolean;
  };
}

export const AdminService = {
  async listarLogs() {
    try {
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
      return [];
    }
  },
  async verificarAdmin(email: string) {
    if (email !== ADMIN_EMAIL) return false;
    
    try {
      const adminsRef = ref(database, 'admins');
      const snapshot = await get(adminsRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  },

  async verificarCredenciaisAdmin(email: string, senha: string) {
    return email === ADMIN_EMAIL && senha === ADMIN_PASSWORD;
  },

  async registrarAdmin(uid: string) {
    try {
      const adminRef = ref(database, `admins/${uid}`);
      await set(adminRef, {
        email: ADMIN_EMAIL,
        dataCriacao: new Date().toISOString(),
        nome: 'Administrador',
        permissionLevel: 'admin',
        permissoes: {
          editarStatus: true,
          excluirRelatos: true,
          gerenciarAdmins: false
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