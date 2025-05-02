import { getDatabase, ref, get } from 'firebase/database';
import { database } from '../config/firebase';

export const AdminService = {
  async verificarPermissoes(user: any) {
    if (!user) return false;
    try {
      const adminRef = ref(database, `admins/${user.uid}`);
      const snapshot = await get(adminRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return null;
    }
  }
}; 