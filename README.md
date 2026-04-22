# Fluxo de Caixa Profissional

Sistema completo de fluxo de caixa web com autenticação, dashboard e relatórios em PDF.

## Características

- **Autenticação completa**: Login, cadastro, logout
- **CRUD completo**: Entradas e saídas com edição e exclusão
- **Dashboard interativo**: Gráficos e resumo financeiro
- **Relatórios PDF**: Exportação profissional de dados
- **Filtros avançados**: Por data e categoria
- **Design responsivo**: Funciona em desktop e mobile
- **Dados na nuvem**: Integração com Supabase
- **Segurança**: Cada usuário vê apenas seus dados

## Tecnologias

- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript puro
- **Backend**: Supabase (PostgreSQL)
- **Gráficos**: Chart.js
- **PDF**: jsPDF
- **Autenticação**: Supabase Auth

## Instalação

### 1. Configurar Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** > **New Query**
4. Execute o script do arquivo `setup-supabase.sql`
5. Vá em **Settings** > **API**
6. Copie a **URL** e a **anon public key**

### 2. Configurar o Aplicativo

1. Abra o arquivo `js/config.js`
2. Substitua as credenciais:
   ```javascript
   const SUPABASE_CONFIG = {
       URL: 'https://SEU_PROJETO.supabase.co',
       ANON_KEY: 'SUA_ANON_KEY'
   };
   ```

### 3. Executar Localmente

1. Use um servidor local (Python, Node.js, ou Live Server)
2. Abra `index.html` no navegador
3. Cadastre um novo usuário
4. Comece a usar!

## Deploy

### Netlify

1. Crie uma conta em [netlify.com](https://netlify.com)
2. Conecte seu repositório GitHub
3. Configure o build:
   - **Build command**: `echo "No build required"`
   - **Publish directory**: `.`
4. Adicione as variáveis de ambiente:
   - `SUPABASE_URL`: Sua URL do Supabase
   - `SUPABASE_ANON_KEY`: Sua chave do Supabase

### Vercel

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Importe o projeto do GitHub
3. Configure as variáveis de ambiente
4. Deploy!

## Estrutura do Projeto

```
fluxo-caixa-profissional/
|-- index.html              # Página principal
|-- js/
|   |-- config.js          # Configuração do Supabase
|   |-- auth.js            # Sistema de autenticação
|   |-- entradas.js        # Gestão de entradas
|   |-- saidas.js          # Gestão de saídas
|   |-- dashboard.js       # Dashboard e gráficos
|   |-- relatorios.js      # Relatórios e exportação
|   |-- app.js             # Aplicação principal
|-- setup-supabase.sql     # Script de setup do banco
|-- README.md               # Este arquivo
```

## Funcionalidades

### Autenticação
- Login com email e senha
- Cadastro de novos usuários
- Logout seguro
- Sessão persistente

### Entradas (Receitas)
- Adicionar novas entradas
- Editar entradas existentes
- Excluir entradas
- Categorias: Vendas, Serviços, Aluguel, Investimentos, Outras

### Saídas (Despesas)
- Adicionar novas saídas
- Editar saídas existentes
- Excluir saídas
- Categorias: Aluguel, Funcionários, Fornecedores, Impostos, Marketing, Transporte, Outras
- Tipos: Fixo ou Variável

### Dashboard
- Resumo financeiro em tempo real
- Gráfico de barras mensal
- Cards com totais
- Percentual de crescimento

### Filtros
- Filtro por período (data inicial e final)
- Filtro por categoria
- Aplicação automática

### Relatórios
- Geração de PDF profissional
- Exportação para CSV
- Relatório para impressão
- Dados completos do usuário

## Segurança

- **Row Level Security**: Cada usuário vê apenas seus dados
- **Validação de entrada**: Todos os campos são validados
- **SQL Injection Protection**: Usando Supabase com parâmetros
- **XSS Protection**: Sanitização de dados
- **HTTPS**: Recomendado para produção

## API Reference

### Entradas

```javascript
// Carregar entradas
await entradasSystem.carregarEntradas(filtros);

// Salvar entrada
await entradasSystem.salvarEntrada({
    data: '2024-01-01',
    descricao: 'Venda de produto',
    categoria: 'vendas',
    valor: 100.00
});

// Excluir entrada
await entradasSystem.excluirEntrada(id);
```

### Saídas

```javascript
// Carregar saídas
await saidasSystem.carregarSaidas(filtros);

// Salvar saída
await saidasSystem.salvarSaida({
    data: '2024-01-01',
    descricao: 'Aluguel',
    categoria: 'aluguel',
    tipo: 'fixo',
    valor: 500.00
});

// Excluir saída
await saidasSystem.excluirSaida(id);
```

## Customização

### Adicionar Novas Categorias

1. No `setup-supabase.sql`, adicione à cláusula `CHECK`
2. No `js/entradas.js`, adicione ao `getCategorias()`
3. No `js/saidas.js`, adicione ao `getCategorias()`

### Modificar Cores

Edite as variáveis CSS no `index.html`:
```css
:root {
    --primary-color: #007bff;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --info-color: #17a2b8;
}
```

## Troubleshooting

### Problemas Comuns

1. **"Supabase not configured"**
   - Configure as credenciais em `js/config.js`
   - Execute o script `setup-supabase.sql`

2. **"Login not working"**
   - Verifique se as tabelas foram criadas
   - Confirme as políticas RLS estão ativas

3. **"Charts not displaying"**
   - Verifique o console para erros
   - Confirme se há dados para exibir

4. **"PDF not generating"**
   - Verifique se o jsPDF está carregando
   - Teste com dados de exemplo

### Logs

Verifique o console do navegador para mensagens de erro e debug.

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

MIT License - sinta-se livre para usar este projeto.

## Suporte

Para suporte, abra uma issue no GitHub ou contate o desenvolvedor.

---

**Desenvolvido com HTML5, CSS3, JavaScript e Supabase**
