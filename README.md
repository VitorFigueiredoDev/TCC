# 🚨 CidadeAlerta

## 📱 Sobre o Projeto

O CidadeAlerta é uma aplicação web moderna desenvolvida para facilitar o reporte e gerenciamento de problemas urbanos. Permite que cidadãos relatem problemas em sua cidade, como buracos na via, iluminação pública defeituosa, lixo acumulado e problemas em calçadas.

## 🌟 Funcionalidades Principais

- 📍 Reporte de problemas com geolocalização
- 📸 Upload de fotos dos problemas
- 🗺️ Visualização em mapa dos problemas reportados
- 👥 Sistema de autenticação de usuários
- 👨‍💼 Painel administrativo para gestão dos relatos
- 📊 Dashboard com estatísticas e métricas
- 🔔 Sistema de notificações
- 🎯 Acompanhamento de status dos relatos

## 🏗️ Arquitetura do Sistema

### Frontend
- Arquitetura baseada em componentes React
- Gerenciamento de estado global com Context API
- Roteamento dinâmico com React Router
- Interface responsiva e acessível com Chakra UI
- Integração com mapas usando Leaflet

### Backend
- Arquitetura serverless com Firebase
- Sistema de autenticação seguro
- Banco de dados em tempo real
- Storage para arquivos e imagens
- Hosting automatizado

## 🛠️ Tecnologias Utilizadas

O CidadeAlerta é construído com um conjunto de tecnologias modernas e robustas para garantir uma experiência de usuário fluida, segura e eficiente. Abaixo detalhamos as principais ferramentas e bibliotecas empregadas no desenvolvimento:

### **Frontend (Interface do Usuário)**

- **React.js (v18.2.0):** Biblioteca JavaScript declarativa, eficiente e flexível para construir interfaces de usuário complexas e componentizadas.
- **TypeScript (v5.3.3):** Superset do JavaScript que adiciona tipagem estática opcional, melhorando a manutenibilidade e a detecção de erros em tempo de desenvolvimento.
- **Vite (v5.0.12):** Ferramenta de build extremamente rápida que oferece uma experiência de desenvolvimento moderna, com Hot Module Replacement (HMR) instantâneo e otimizações para produção.
- **Chakra UI (v2.8.2):** Biblioteca de componentes React simples, modular e acessível que acelera o desenvolvimento de interfaces bonitas e consistentes.
  - Dependências associadas: `@emotion/react` (v11.11.3), `@emotion/styled` (v11.11.0) para estilização CSS-in-JS.
- **React Router DOM (v6.21.1):** Biblioteca para gerenciamento de rotas em aplicações React, permitindo a navegação entre diferentes páginas e componentes de forma declarativa.
- **React Icons (v4.12.0):** Coleção popular de ícones SVG que podem ser facilmente incorporados em projetos React, oferecendo uma vasta gama de opções visuais.
- **Leaflet (v1.9.4) & React-Leaflet (v4.2.1):** Bibliotecas para a criação de mapas interativos e responsivos.
  - `@types/leaflet` (v1.9.17): Definições de tipo TypeScript para Leaflet.
  - `react-leaflet-cluster` (v2.1.0): Extensão para agrupar marcadores em mapas Leaflet, melhorando a performance com grande quantidade de pontos.
- **Framer Motion (v10.18.0):** Biblioteca de animação para React que facilita a criação de animações fluidas e interativas.
- **Lottie-React (v2.3.1) & @lottiefiles/dotlottie-react (v0.13.5):** Permitem a integração de animações Lottie (animações vetoriais baseadas em JSON) de forma fácil em aplicações React.
- **date-fns (v4.1.0):** Biblioteca moderna para manipulação de datas em JavaScript, oferecendo um conjunto completo de funções utilitárias.
- **uuid (v11.1.0):** Para a geração de identificadores únicos universais (UUIDs).
  - `@types/uuid` (v10.0.0): Definições de tipo TypeScript para uuid.
- **Open Location Code (Plus Codes) (v1.0.3):** Biblioteca para codificar e decodificar Plus Codes, que são endereços baseados em latitude e longitude.
- **React Intersection Observer (v9.16.0):** Hook React para observar mudanças na interseção de um elemento com a viewport ou outro elemento, útil para lazy loading e animações baseadas em scroll.

### **Backend (Serviços e Lógica de Negócios)**

- **Firebase (v11.6.0):** Plataforma de desenvolvimento de aplicativos do Google que fornece uma variedade de serviços backend, incluindo:
  - **Firebase Authentication:** Para gerenciamento seguro de autenticação de usuários (login com email/senha, provedores sociais, etc.).
  - **Firebase Realtime Database (`@firebase/database` v1.0.14):** Banco de dados NoSQL hospedado na nuvem que permite armazenar e sincronizar dados em tempo real entre clientes.
  - **Firebase Storage (`@firebase/storage` v0.13.7):** Para armazenamento e recuperação de arquivos gerados pelo usuário, como imagens de problemas reportados.
  - **Firebase Hosting:** Para hospedagem rápida e segura de aplicações web estáticas e dinâmicas.

### **Ferramentas de Desenvolvimento e Qualidade de Código**

- **ESLint (v8.56.0):** Ferramenta de linting para identificar e corrigir problemas no código JavaScript e TypeScript, garantindo a consistência e prevenindo erros.
  - Plugins associados: `@typescript-eslint/eslint-plugin` (v6.19.0), `@typescript-eslint/parser` (v6.19.0), `eslint-plugin-react-hooks` (v4.6.0), `eslint-plugin-react-refresh` (v0.4.5).
- **Node.js:** Ambiente de execução JavaScript server-side, utilizado para as ferramentas de build e desenvolvimento.
- **NPM (Node Package Manager):** Gerenciador de pacotes padrão para o Node.js, utilizado para instalar e gerenciar as dependências do projeto.

## 📝 Padrões de Código

- **Convenções de Nomenclatura:**
  - Componentes: PascalCase
  - Funções e variáveis: camelCase
  - Constantes: UPPER_SNAKE_CASE

- **Estrutura de Arquivos:**
  ```
  src/
  ├── components/     # Componentes reutilizáveis
  ├── config/         # Configurações (Firebase, etc)
  ├── contexts/       # Contextos React
  ├── pages/          # Páginas da aplicação
  ├── services/       # Serviços e integrações
  ├── styles/         # Estilos globais
  ├── types/          # Definições de tipos TypeScript
  └── utils/          # Funções utilitárias
  ```

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn
- Conta no Firebase

### Instalação e Configuração

1. Clone o repositório:
```bash
git clone https://github.com/VitorFigueiredoDev/TCC.git
cd TCC
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env`
- Preencha com suas credenciais do Firebase

4. Execute o projeto:
```bash
npm run dev # Ambiente de desenvolvimento
npm run build # Compilação para produção
npm run preview # Visualização da build
```

## 🧪 Testes

- **Testes Unitários:**
```bash
npm run test
```

- **Testes E2E:**
```bash
npm run test:e2e
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição

- Siga os padrões de código estabelecidos
- Documente novas funcionalidades
- Adicione testes para novas features
- Mantenha o código limpo e bem documentado

## 🔐 Segurança

- Autenticação segura via Firebase
- Regras de segurança para banco de dados e storage
- Validação de dados no cliente e servidor
- Proteção contra XSS e injeção de código
- Não compartilhe chaves de API ou credenciais

## 🌐 Deploy

### Deploy Automático
- Integração contínua com GitHub Actions
- Deploy automático no Firebase Hosting

### Deploy Manual


```bash
npm run build
firebase deploy
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Vitor Figueiredo

---

⭐️ Se este projeto te ajudou, considere dar uma estrela no GitHub!
