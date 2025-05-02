import { Problema, FormData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from '../config/firebase';

export class ProblemService {
  private static problems: Problema[] = [];

  static async addProblem(formData: FormData): Promise<Problema> {
    const newProblem: Problema = {
      id: uuidv4(),
      titulo: formData.titulo,
      categoria: formData.categoria,
      descricao: formData.descricao,
      localizacao: formData.endereco.rua 
        ? `${formData.endereco.rua} ${formData.endereco.numero}, ${formData.endereco.bairro}, ${formData.endereco.cidade}-${formData.endereco.estado}`
        : 'Localização não especificada',
      coordenadas: formData.coordenadas,
      endereco: formData.endereco,
      plusCode: formData.plusCode,
      dataCriacao: new Date(),
      status: 'pendente'
    };

    this.problems.push(newProblem);
    return newProblem;
  }

  static getProblems(): Problema[] {
    return [...this.problems];
  }

  static getProblemById(id: string): Problema | undefined {
    return this.problems.find(problem => problem.id === id);
  }

  static updateProblemStatus(id: string, status: Problema['status']): Problema | undefined {
    const problem = this.problems.find(p => p.id === id);
    if (problem) {
      problem.status = status;
    }
    return problem;
  }

  static deleteProblem(id: string): boolean {
    const initialLength = this.problems.length;
    this.problems = this.problems.filter(problem => problem.id !== id);
    return this.problems.length !== initialLength;
  }

  static getProblemsByCategory(category: string): Problema[] {
    return this.problems.filter(problem => problem.categoria === category);
  }

  static getProblemsByStatus(status: Problema['status']): Problema[] {
    return this.problems.filter(problem => problem.status === status);
  }

  static async registerUser(email: string, password: string): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth não foi inicializado corretamente');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuário registrado:", userCredential.user);
    } catch (error: any) {
      console.error("Erro ao registrar usuário:", error);
      throw error;
    }
  }

  static async loginUser(email: string, password: string): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth não foi inicializado corretamente');
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuário logado:", userCredential.user);
    } catch (error: any) {
      console.error("Erro ao logar usuário:", error);
      throw error;
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth não foi inicializado corretamente');
      }
      await signOut(auth);
      console.log("Usuário deslogado");
    } catch (error: any) {
      console.error("Erro ao deslogar usuário:", error);
      throw error;
    }
  }
} 