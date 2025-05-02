import { createContext, useContext, useState, ReactNode } from 'react';

interface Problema {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  localizacao: string;
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
  plusCode: string;
  dataCriacao: Date;
  status: 'pendente' | 'em_andamento' | 'resolvido';
}

interface ProblemasContextData {
  problemas: Problema[];
  adicionarProblema: (problema: Omit<Problema, 'id' | 'dataCriacao'>) => void;
  excluirProblema: (id: string) => void;
}

const ProblemasContext = createContext<ProblemasContextData>({} as ProblemasContextData);

export function ProblemasProvider({ children }: { children: ReactNode }) {
  const [problemas, setProblemas] = useState<Problema[]>(() => {
    const savedProblemas = localStorage.getItem('problemas');
    if (savedProblemas) {
      return JSON.parse(savedProblemas).map((problema: any) => ({
        ...problema,
        dataCriacao: new Date(problema.dataCriacao)
      }));
    }
    return [];
  });

  const adicionarProblema = (novoProblema: Omit<Problema, 'id' | 'dataCriacao'>) => {
    const problema: Problema = {
      id: Math.random().toString(36).substr(2, 9),
      titulo: novoProblema.titulo || 'Sem título',
      categoria: novoProblema.categoria || 'Geral',
      descricao: novoProblema.descricao || 'Sem descrição',
      localizacao: novoProblema.localizacao || 'Não especificada',
      coordenadas: novoProblema.coordenadas || { lat: 0, lng: 0 },
      endereco: novoProblema.endereco || {
        rua: 'Não informada',
        numero: 'S/N',
        bairro: 'Não informado',
        cidade: 'Não informada',
        estado: 'Não informado'
      },
      plusCode: novoProblema.plusCode || 'Não informado',
      dataCriacao: new Date(),
      status: novoProblema.status || 'pendente'
    };

    setProblemas((prev) => {
      const newProblemas = [...prev, problema];
      localStorage.setItem('problemas', JSON.stringify(newProblemas));
      return newProblemas;
    });
  };

  const excluirProblema = (id: string) => {
    setProblemas((prev) => {
      const newProblemas = prev.filter(problema => problema.id !== id);
      localStorage.setItem('problemas', JSON.stringify(newProblemas));
      return newProblemas;
    });
  };

  return (
    <ProblemasContext.Provider value={{ problemas, adicionarProblema, excluirProblema }}>
      {children}
    </ProblemasContext.Provider>
  );
}

export function useProblemas() {
  const context = useContext(ProblemasContext);
  if (!context) {
    throw new Error('useProblemas deve ser usado dentro de um ProblemasProvider');
  }
  return context;
}