# Sistema de Gestão de Problemas Urbanos

## 📋 Descrição
Este é um sistema web desenvolvido para gerenciamento e reporte de problemas urbanos, permitindo que cidadãos reportem problemas em suas comunidades e que administradores gerenciem essas ocorrências de forma eficiente.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React** (v18.2.0) - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool e servidor de desenvolvimento
- **Chakra UI** - Biblioteca de componentes React
- **React Router DOM** - Roteamento da aplicação
- **Framer Motion** - Biblioteca para animações
- **React Icons** - Ícones para a interface
- **Leaflet** - Biblioteca para mapas interativos
- **React Leaflet** - Componentes React para Leaflet
- **Fuse.js** - Biblioteca de busca fuzzy
- **Date-fns** - Manipulação de datas
- **UUID** - Geração de identificadores únicos

### Backend & Infraestrutura
- **Firebase**
  - Authentication - Autenticação de usuários
  - Realtime Database - Banco de dados em tempo real
  - Storage - Armazenamento de arquivos
  - Hosting - Hospedagem da aplicação

## 🎨 Telas e Funcionalidades

### 1. Autenticação
- **Login** (`Login.tsx`)
  - Autenticação de usuários
  - Integração com Firebase Auth
  - Validação de formulários

- **Cadastro** (`Cadastro.tsx`, `Register.tsx`)
  - Registro de novos usuários
  - Validação de dados
  - Upload de foto de perfil

### 2. Página Inicial (`Home.tsx`)
- Dashboard principal
- Estatísticas de problemas
- Feed de problemas recentes
- Navegação rápida para funcionalidades principais

### 3. Mapa (`Mapa.tsx`)
- Visualização interativa de problemas
- Clusters de problemas por região
- Filtros e busca
- Integração com Leaflet para visualização de mapas

### 4. Reporte de Problemas
- **RelatarProblema.tsx** / **ReportProblem.tsx**
  - Formulário de reporte
  - Upload de imagens
  - Seleção de localização
  - Categorização de problemas

### 5. Listagem de Problemas (`ProblemList.tsx`)
- Lista de problemas reportados
- Filtros e ordenação
- Status de problemas
- Ações rápidas

### 6. Perfil do Usuário
- **Perfil.tsx** / **Profile.tsx**
  - Informações do usuário
  - Histórico de reportes
  - Configurações de conta
  - Estatísticas pessoais

### 7. Área Administrativa
- **Admin.tsx**
  - Dashboard administrativo
  - Gerenciamento de usuários
  - Moderação de problemas
  - Relatórios e estatísticas

- **PrimeiroAdmin.tsx**
  - Configuração inicial do administrador
  - Definição de permissões

## 🛠️ Configuração do Ambiente

1. Clone o repositório
```bash
git clone [URL_DO_REPOSITÓRIO]
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente do Firebase
- Crie um arquivo `.env` na raiz do projeto
- Adicione as credenciais do Firebase

4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run lint` - Executa o linter
- `npm run preview` - Visualiza a build de produção localmente

## 🔒 Segurança
- Autenticação via Firebase
- Regras de segurança no Realtime Database
- Validação de dados no frontend e backend
- Proteção de rotas administrativas

## 📱 Responsividade
- Design responsivo para diferentes dispositivos
- Interface adaptativa usando Chakra UI
- Otimização para mobile

## 🎯 Funcionalidades Principais
- Reporte de problemas urbanos
- Geolocalização de problemas
- Sistema de moderação
- Dashboard administrativo
- Perfis de usuário
- Upload de imagens
- Sistema de busca
- Visualização em mapa

## 🤝 Contribuição
1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
