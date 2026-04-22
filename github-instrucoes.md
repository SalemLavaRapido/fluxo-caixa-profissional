# Como Usar seu Repositório GitHub Existente

## Repositório: https://github.com/salemlonasetruckcenter-gif

Você pode usar seu repositório existente! Siga estes passos:

## 1. Clonar o Repositório

```bash
# Se ainda não clonou
git clone https://github.com/salemlonasetruckcenter-gif
cd salemlonasetruckcenter-gif
```

## 2. Copiar Arquivos do Projeto

Copie todos os arquivos da pasta `Fluxo de caixa estacionamento` para a pasta do repositório clonado:

**Arquivos importantes para copiar:**
- `index.html`
- `js/` (pasta inteira)
- `setup-supabase.sql`
- `README.md`
- `.gitignore`
- `netlify.toml` (se existir)

## 3. Fazer Upload para GitHub

```bash
# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Adicionar sistema de fluxo de caixa profissional"

# Enviar para GitHub
git push origin main
```

## 4. Configurar Netlify com este Repositório

1. Vá para [netlify.com](https://netlify.com)
2. **"New site from Git"**
3. Conecte com GitHub
4. Selecione `salemlonasetruckcenter-gif`
5. Configure:
   - **Build command**: `echo "No build required"`
   - **Publish directory**: `.`
6. **Environment variables**:
   - `SUPABASE_URL`: `https://emkiewosmlnyjnpujbui.supabase.co`
   - `SUPABASE_ANON_KEY`: `sb_publishable_Bd982ryXG_esL01jPijc_A_2u3pY8vV`

## 5. Deploy Automático

Agora toda vez que você fizer `git push`, o site será atualizado automaticamente!

## Vantagens de Usar seu Repositório

- **URL personalizada**: `salemlonasetruckcenter-gif`
- **Histórico mantido**: Seus commits anteriores
- **Configurações existentes**: Se já tiver alguma configuração

## Se o Repositório Estiver Vazio

Se o repositório estiver vazio, pode usar diretamente:

```bash
# Na pasta do projeto
git remote add origin https://github.com/salemlonasetruckcenter-gif
git add .
git commit -m "Initial commit: Fluxo de caixa profissional"
git push -u origin main
```

## Verificar Deploy

Após o push:
1. Netlify detectará automaticamente
2. Fará o deploy
3. Gerará uma URL como: `https://seu-projeto.netlify.app`

Pronto! Seu sistema estará online usando seu GitHub existente.
