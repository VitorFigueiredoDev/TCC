# Guia de Configuração do Firebase Hosting

## Configuração Atual

Seu projeto já possui as configurações básicas para o Firebase Hosting:

- O arquivo `.firebaserc` está configurado com o projeto `falatriangulo-45122`
- O arquivo `firebase.json` está configurado para usar a pasta `dist` como diretório público
- O Firebase CLI já está instalado globalmente no seu sistema

## Passos para Deploy

Siga estes passos para fazer o deploy do seu aplicativo React no Firebase Hosting:

### 1. Construir o Projeto

Primeiro, construa seu projeto React para gerar os arquivos estáticos na pasta `dist`:

```bash
npm run build
```

### 2. Testar Localmente (Opcional)

Você pode testar o build localmente antes de fazer o deploy:

```bash
npm run preview
```

Ou usando o Firebase CLI:

```bash
firebase serve --only hosting
```

### 3. Fazer Login no Firebase (se necessário)

Se você ainda não estiver logado no Firebase CLI, execute:

```bash
firebase login
```

### 4. Deploy para o Firebase Hosting

Para fazer o deploy do seu aplicativo:

```bash
firebase deploy --only hosting
```

Após o deploy bem-sucedido, você receberá URLs para acessar seu site:

- URL do Hosting: `https://falatriangulo-45122.web.app`
- URL do projeto: `https://falatriangulo-45122.firebaseapp.com`

## Configurações Adicionais (Opcional)

### Configurar Domínio Personalizado

Se você quiser usar um domínio personalizado:

1. No console do Firebase, vá para Hosting > Adicionar domínio personalizado
2. Siga as instruções para verificar a propriedade do domínio e configurar os registros DNS

### Configurar Múltiplos Ambientes

Para configurar múltiplos ambientes (desenvolvimento, produção):

1. Crie diferentes projetos no Firebase
2. Use o comando `firebase use` para alternar entre projetos:

```bash
firebase use production  # Alterna para o ambiente de produção
firebase use development # Alterna para o ambiente de desenvolvimento
```

### Automatizar o Deploy com GitHub Actions

Você pode configurar GitHub Actions para automatizar o deploy quando houver push para a branch principal.

## Solução de Problemas

- **Erro 404 após deploy**: Verifique se o arquivo `firebase.json` tem a configuração de rewrite para o SPA:
  ```json
  "rewrites": [{ "source": "**", "destination": "/index.html" }]
  ```

- **Arquivos não atualizados**: Use `firebase deploy --only hosting --force` para forçar a atualização de todos os arquivos

- **Problemas com o cache**: Adicione cabeçalhos de cache no `firebase.json`:
  ```json
  "headers": [{
    "source": "/**",
    "headers": [{
      "key": "Cache-Control",
      "value": "no-cache, no-store, must-revalidate"
    }]
  }]
  ```

## Recursos Adicionais

- [Documentação oficial do Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Guia de início rápido do Firebase Hosting](https://firebase.google.com/docs/hosting/quickstart)
- [Configurações avançadas do firebase.json](https://firebase.google.com/docs/hosting/full-config)