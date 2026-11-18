# Instalação e operação técnica

O projeto usa Node.js e npm, Expo Router, React Native e Supabase. O [manifesto](../package.json) declara Expo `^57.0.21`, React 19.2.3 e React Native 0.86.3. O [AGENTS.md](../AGENTS.md) aponta para a referência do SDK 54. A instalação usa as versões do [lockfile](../package-lock.json). [Referência versionada do SDK 54 no repositório oficial](https://github.com/expo/expo/blob/sdk-54/docs/pages/versions/v54.0.0/index.mdx).

## Desenvolvimento local

Execute na raiz do repositório:

```powershell
npm ci
Copy-Item .env.example .env
```

Crie o arquivo a partir do exemplo apenas na primeira configuração. Preencha as duas variáveis com a URL do projeto e sua chave publicável, disponíveis no Supabase.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

As variáveis `EXPO_PUBLIC_*` são incorporadas ao aplicativo. Use a chave publicável do projeto e armazene credenciais administrativas fora do cliente.

O banco precisa conter as tabelas-base e as migrações descritas no [guia de arquitetura](arquitetura-e-banco.md). Para recuperação de senha, a URL usada pelo código local é `http://localhost:8081/resetPassword`. Autorize esse endereço nas configurações de redirecionamento do Supabase Auth para desenvolvimento.

| Comando | Resultado |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento do Expo |
| `npm run web` | Inicia o aplicativo no navegador |
| `npm run android` | Inicia com destino Android |
| `npm run ios` | Inicia com destino iOS |

A execução nativa depende da configuração de dispositivo ou simulador para a plataforma. Para o primeiro acesso, use o cadastro do aplicativo, confirme o e-mail quando solicitado e depois entre com e-mail e senha.

## Exportação web

A configuração em [app.json](../app.json) usa Metro e saída web estática. Com as variáveis do ambiente de destino preenchidas, execute:

```powershell
npx expo export --platform web
```

O resultado fica em `dist/`. Ao preparar outro domínio, ajuste a [URL de recuperação de senha no aplicativo](../app/%28auth%29/sendResetPassword.tsx) e autorize o endereço correspondente no Supabase antes de exportar. Abra a aplicação publicada por HTTPS e valide cadastro, login, acesso direto às rotas e recuperação de senha. O cadastro de pedidos precisa gerar a chave da requisição com `crypto.randomUUID()`, que está disponível na web em contextos seguros, como HTTPS e localhost.

## Diagnóstico

| Sintoma | Conferência |
| --- | --- |
| Erro na inicialização do cliente Supabase | Confirme URL e chave no `.env` e reinicie o Expo após alterar as variáveis |
| Link de recuperação volta para localhost | Confira o endereço fixo no código e a lista de URLs autorizadas no Auth |
| Consulta falha por tabela, coluna ou relação ausente | Compare o esquema do ambiente com as migrações e com a base exigida |
| Caixa vazio ao trocar de conta | Confira o usuário autenticado. O caixa exibe lançamentos do próprio usuário |
| Exclusão retorna erro de relacionamento | Confira referências do cadastro em pedidos e itens no banco |
