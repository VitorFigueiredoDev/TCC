# 🏙️ Sistema de Gestão de Problemas Urbanos

![Badge](https://img.shields.io/badge/React-18.2.0-blue?logo=react)
![Badge](https://img.shields.io/badge/Firebase-Cloud-orange?logo=firebase)
![Badge](https://img.shields.io/badge/TypeScript-4.x-blue?logo=typescript)
![Badge](https://img.shields.io/badge/ChakraUI-Component-green?logo=chakraui)
![Badge](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Descrição do Projeto

O **Sistema de Gestão de Problemas Urbanos** é uma plataforma web desenvolvida para facilitar o reporte, acompanhamento e gerenciamento de problemas urbanos em cidades. O objetivo é conectar cidadãos e administração pública, promovendo uma cidade mais organizada, segura e participativa. Usuários podem relatar ocorrências, acompanhar o status das soluções e contribuir para a melhoria do ambiente urbano.

---

## 💡 Motivação

A ideia deste projeto surgiu da necessidade de criar uma solução tecnológica que auxilie na identificação e resolução de problemas urbanos, como buracos em vias, iluminação pública, descarte irregular de lixo, entre outros. O propósito é incentivar a participação cidadã, aumentar a transparência e agilizar a resposta do poder público, tornando as cidades mais inteligentes e colaborativas.

---

## 🚀 Tecnologias Utilizadas

| Frontend         | Backend & Infraestrutura |
|------------------|-------------------------|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=white) | ![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?logo=firebase&logoColor=white) |
| TypeScript       | Authentication          |
| Vite             | Realtime Database       |
| Chakra UI        | Storage                 |
| React Router DOM | Hosting                 |
| Framer Motion    |                         |
| React Icons      |                         |
| Leaflet & React Leaflet |                 |
| Fuse.js          |                         |
| Date-fns         |                         |
| UUID             |                         |

---

## 🖥️ Telas e Funcionalidades

<details>
<summary><strong>1. Autenticação</strong></summary>

- **Login** (`Login.tsx`): Autenticação via Firebase, validação de formulários.
- **Cadastro** (`Cadastro.tsx`, `Register.tsx`): Registro de usuários, upload de foto de perfil.
</details>

<details>
<summary><strong>2. Página Inicial</strong> (`Home.tsx`)</summary>

- Dashboard principal com estatísticas, feed de problemas recentes e navegação rápida.
</details>

<details>
<summary><strong>3. Mapa</strong> (`Mapa.tsx`)</summary>

- Visualização interativa dos problemas, clusters por região, filtros, busca e integração com Leaflet.
</details>

<details>
<summary><strong>4. Reporte de Problemas</strong></summary>

- **RelatarProblema.tsx / ReportProblem.tsx**: Formulário, upload de imagens, seleção de localização e categoria.
</details>

<details>
<summary><strong>5. Listagem de Problemas</strong> (`ProblemList.tsx`)</summary>

- Lista com filtros, ordenação, status e ações rápidas.
</details>

<details>
<summary><strong>6. Perfil do Usuário</strong> (`Perfil.tsx` / `Profile.tsx`)</summary>

- Informações, histórico, configurações e estatísticas pessoais.
</details>

<details>
<summary><strong>7. Área Administrativa</strong> (`Admin.tsx`)</summary>

- Dashboard, gerenciamento de usuários, moderação e relatórios.
- **PrimeiroAdmin.tsx**: Configuração inicial do admin e permissões.
</details>

---

## ⚡ Como rodar o projeto

```bash
# 1. Clone o repositório
git clone [URL_DO_REPOSITORIO]

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente do Firebase
# Crie um arquivo .env na raiz e adicione as credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

---

## 📦 Scripts Disponíveis

| Comando            | Descrição                                 |
|--------------------|-------------------------------------------|
| `npm run dev`      | Inicia o servidor de desenvolvimento      |
| `npm run build`    | Gera a build de produção                  |
| `npm run lint`     | Executa o linter                          |
| `npm run preview`  | Visualiza a build de produção localmente  |

---

## 🔒 Segurança

- Autenticação via Firebase
- Regras de segurança no Realtime Database
- Validação de dados no frontend e backend
- Proteção de rotas administrativas

---

## 📱 Responsividade

- Design responsivo (desktop, tablet e mobile)
- Interface adaptativa com Chakra UI

---

## 🎯 Funcionalidades Principais

- 📍 Reporte e geolocalização de problemas urbanos
- 🗂️ Sistema de moderação e dashboard administrativo
- 👤 Perfis de usuário e histórico de reportes
- 🖼️ Upload de imagens
- 🔎 Busca e filtros avançados
- 🗺️ Visualização em mapa interativo

---

## 🤝 Como contribuir

1. Faça um Fork
2. Crie uma branch (`git checkout -b feature/SuaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: SuaFeature'`)
4. Push na branch (`git push origin feature/SuaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
