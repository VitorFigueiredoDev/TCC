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

- **Frontend:**
  - React.js com TypeScript
  - Chakra UI para interface
  - React Router para navegação
  - React Icons para ícones
  - Leaflet para mapas interativos

- **Backend:**
  - Firebase Authentication
  - Firebase Realtime Database
  - Firebase Storage
  - Firebase Hosting

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
