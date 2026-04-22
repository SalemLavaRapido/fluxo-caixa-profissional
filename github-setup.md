# Como Configurar GitHub para Deploy Automático

## 1. Criar Repositório GitHub

1. Vá para [github.com](https://github.com)
2. Faça login ou crie uma conta
3. Clique em **"New repository"**
4. Configure:
   - **Repository name**: `fluxo-caixa-profissional`
   - **Description**: `Sistema completo de fluxo de caixa web com Supabase`
   - **Visibility**: Public (para deploy gratuito)
   - **Add README**: Não (já existe)
   - **Add .gitignore**: Não (já criamos)
5. Clique em **"Create repository"**

## 2. Configurar Git Local

Abra o terminal/powershell na pasta do projeto:

```bash
# Inicializar repositório Git
git init

# Adicionar repositório remoto
git remote add origin https://github.com/SEU_USERNAME/fluxo-caixa-profissional.git

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "Initial commit: Fluxo de caixa profissional com Supabase"

# Enviar para GitHub
git push -u origin main
```

## 3. Conectar com Netlify

### Opção A: Pelo GitHub (recomendado)

1. Vá para [netlify.com](https://netlify.com)
2. Faça login com **GitHub**
3. Clique em **"New site from Git"**
4. Selecione seu repositório `fluxo-caixa-profissional`
5. Configure:
   - **Build command**: `echo "No build required"`
   - **Publish directory**: `.`
6. **Site settings** > **Environment variables**:
   - `SUPABASE_URL`: `https://emkiewosmlnyjnpujbui.supabase.co`
   - `SUPABASE_ANON_KEY`: `sb_publishable_Bd982ryXG_esL01jPijc_A_2u3pY8vV`
7. Clique em **"Deploy site"**

### Opção B: Upload Direto

1. Compacte a pasta em `.zip`
2. Vá para Netlify > **"Sites"** > **"Add new site"**
3. Arraste o arquivo `.zip`
4. Configure as variáveis de ambiente

## 4. Deploy Automático

Com GitHub conectado:
- **Push para GitHub** = **Deploy automático**
- Cada `git push` atualiza o site

## 5. Comandos Git Úteis

```bash
# Ver status
git status

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "descrição da mudança"

# Enviar para GitHub
git push

# Puxar do GitHub
git pull

# Ver histórico
git log --oneline
```

## 6. Branch para Desenvolvimento

```bash
# Criar branch de desenvolvimento
git checkout -b develop

# Mudar para main
git checkout main

# Mesclar branches
git merge develop
```

## 7. Segurança

**Nunca envie:**
- Senhas ou chaves privadas
- Arquivos `.env`
- Dados sensíveis

**Arquivos já ignorados no `.gitignore`:**
- `node_modules/`
- `.env*`
- Arquivos de backup
- Logs

## Resultado Final

- **Código**: GitHub
- **Dados**: Supabase
- **Deploy**: Netlify
- **CI/CD**: Automático a cada push

Seu sistema estará 100% em nuvem!
