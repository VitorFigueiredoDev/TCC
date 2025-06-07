# 🚀 Projeto TCC - Sistema de Gerenciamento de Estabelecimentos

## 📋 Sobre o Projeto
Este é um sistema web desenvolvido como Trabalho de Conclusão de Curso (TCC) que permite o gerenciamento e visualização de estabelecimentos em um mapa interativo.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js** - Framework principal para construção da interface
- **TypeScript** - Para tipagem estática e melhor desenvolvimento
- **Tailwind CSS** - Para estilização moderna e responsiva
- **React Router** - Para navegação entre páginas
- **React Icons** - Para ícones intuitivos na interface

### Mapa e Localização
- **Google Maps API** - Para exibição do mapa interativo
- **Geolocation API** - Para obter localização do usuário
- **Google Places API** - Para autocompletar endereços na busca

### Backend
- **Firebase** - Plataforma como serviço (PaaS) para:
  - **Firestore** - Banco de dados NoSQL
  - **Authentication** - Sistema de autenticação
  - **Storage** - Armazenamento de arquivos
  - **Hosting** - Hospedagem da aplicação

### Funcionalidades Principais

#### 🔍 Barra de Busca
- Implementada com Google Places Autocomplete
- Permite busca por endereços com sugestões em tempo real
- Integração com o mapa para centralizar na localização buscada

#### 🗺️ Mapa Interativo
- Visualização em tempo real dos estabelecimentos
- Marcadores personalizados para diferentes tipos de estabelecimento
- Zoom e pan suaves para melhor navegação
- Clusters de marcadores para melhor performance

#### 👤 Sistema de Usuários
- Cadastro e login de usuários
- Perfis personalizados
- Níveis de acesso (admin/usuário comum)

#### 📝 Gerenciamento de Estabelecimentos
- Cadastro de novos estabelecimentos
- Edição de informações existentes
- Upload de imagens
- Categorização e filtros

## 🚀 Como Executar o Projeto

1. Clone o repositório:
```bash
git clone https://github.com/VitorFigueiredoDev/TCC.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo `.env` na raiz do projeto
- Adicione suas chaves de API do Google e Firebase

4. Execute o projeto:
```bash
npm run dev
```

## 🔑 Configuração do Ambiente

### Google Maps API
1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative as APIs necessárias:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Gere uma chave de API e adicione ao `.env`

### Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Configure a autenticação
3. Crie um banco de dados Firestore
4. Adicione as credenciais ao projeto

## 📱 Responsividade
- Design totalmente responsivo
- Adaptação para diferentes tamanhos de tela
- Interface otimizada para mobile

## 🔒 Segurança
- Autenticação via Firebase
- Proteção de rotas
- Validação de dados
- Sanitização de inputs

## 🤝 Contribuição
1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor
Vitor Figueiredo - [GitHub](https://github.com/VitorFigueiredoDev)

---
⭐️ From [VitorFigueiredoDev](https://github.com/VitorFigueiredoDev)
