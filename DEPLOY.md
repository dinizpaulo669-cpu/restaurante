# Deploy no Render - RestaurantePro

## Pré-requisitos

1. Conta no Render (https://render.com)
2. Repositório Git do projeto
3. Banco Supabase configurado

## Passos para Deploy

### 1. Preparar o Repositório

1. Faça push do código para GitHub/GitLab
2. Certifique-se que os arquivos `render.yaml` e `.env.example` estão incluídos

### 2. Configurar no Render

1. Acesse https://render.com e faça login
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório Git
4. Configure as seguintes opções:

**Configurações Básicas:**
- Name: `restaurante-pro`
- Environment: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Configurações Avançadas:**
- Node Version: `20.x` (ou mais recente)
- Health Check Path: `/health`

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no painel do Render:

```
NODE_ENV=production
SUPABASE_URL=sua_url_completa_do_supabase
SESSION_SECRET=chave_secreta_aleatoria
PORT=10000
```

### 4. Configurar Banco de Dados

Após o deploy inicial:

1. Acesse o terminal do serviço no Render
2. Execute: `npm run db:push --force`
3. Isso criará as tabelas no Supabase

### 5. Testar a Aplicação

1. Acesse a URL fornecida pelo Render
2. Teste a rota `/health` para verificar se está funcionando
3. Teste o login e funcionalidades principais

## Solução de Problemas

### Build Falha
- Verifique se todas as dependências estão no package.json
- Certifique-se que a variável SUPABASE_URL está configurada

### Aplicação não inicia
- Verifique os logs no painel do Render
- Confirme se o PORT está configurado como 10000

### Banco não conecta
- Verifique se a SUPABASE_URL está correta
- Execute `npm run db:push --force` via terminal do Render

## Comandos Úteis

```bash
# Verificar status do serviço
curl https://seu-app.onrender.com/health

# Push schema para o banco (via terminal do Render)
npm run db:push --force

# Ver logs em tempo real
# Use o painel do Render → Logs
```

## Configuração Automática

O arquivo `render.yaml` está configurado para deploy automático. Alternativamente, você pode:

1. Importar via "Infrastructure as Code"
2. Apontar para o arquivo `render.yaml` do repositório
3. O Render configurará automaticamente baseado no arquivo