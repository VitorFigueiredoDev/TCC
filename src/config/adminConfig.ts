import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { firebaseConfig } from './firebase';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Credenciais do Superadmin
const SUPER_ADMIN = {
  email: 'admin@falatriangulo.com',
  senha: 'Admin@123',
  permissoes: {
    permissionLevel: 'superadmin',
    gerenciarAdmins: true,
    excluirRelatos: true,
    editarStatus: true,
    visualizarEstatisticas: true
  }
};

export const configurarSuperAdmin = async () => {
  try {
    // Criar usuário
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      SUPER_ADMIN.email,
      SUPER_ADMIN.senha
    );

    // Configurar permissões no banco
    const adminRef = ref(database, `admins/${userCredential.user.uid}`);
    await set(adminRef, {
      email: SUPER_ADMIN.email,
      permissionLevel: 'superadmin',
      dataCriacao: new Date().toISOString(),
      permissoes: SUPER_ADMIN.permissoes
    });

    return {
      email: SUPER_ADMIN.email,
      senha: SUPER_ADMIN.senha
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      // Se já existe, retorna as credenciais
      return {
        email: SUPER_ADMIN.email,
        senha: SUPER_ADMIN.senha
      };
    }
    throw error;
  }
}; 