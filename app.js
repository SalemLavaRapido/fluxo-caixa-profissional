// Aplicação Principal
class FluxoCaixaApp {
    constructor() {
        this.initialized = false;
    }

    // Inicializar aplicação
    async init() {
        try {
            console.log('Iniciando Fluxo de Caixa Profissional...');

            // Inicializar Supabase
            if (!initSupabase()) {
                console.error('Falha ao inicializar Supabase');
                showConfigAlert();
                return;
            }

            // Verificar se usuário está logado
            if (authSystem.isLoggedIn()) {
                await this.initMainApp();
            } else {
                this.showLoginScreen();
            }

            this.initialized = true;
            console.log('Aplicação inicializada com sucesso!');

        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            authSystem.showAlert('Erro ao inicializar aplicação: ' + error.message, 'danger');
        }
    }

    // Inicializar aplicação principal
    async initMainApp() {
        try {
            // Mostrar aplicação principal
            authSystem.showMainApp();

            // Inicializar componentes
            await this.initComponents();

            // Carregar dados iniciais
            await this.carregarDadosIniciais();

            console.log('Aplicação principal carregada');

        } catch (error) {
            console.error('Erro ao inicializar aplicação principal:', error);
            throw error;
        }
    }

    // Inicializar componentes
    async initComponents() {
        // Preencher categorias
        entradasSystem.preencherCategorias();
        saidasSystem.preencherCategorias();

        // Preencher filtros
        entradasSystem.preencherFiltros();
        saidasSystem.preencherFiltros();

        // Inicializar dashboard
        await dashboardSystem.init();

        // Configurar event listeners
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Tab change events
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', async (e) => {
                const target = e.target.getAttribute('data-bs-target');
                
                if (target === '#entradas') {
                    await entradasSystem.renderizarTabela();
                } else if (target === '#saidas') {
                    await saidasSystem.renderizarTabela();
                } else if (target === '#relatorios') {
                    await dashboardSystem.atualizarGraficos();
                }
            });
        });

        // Form submissions
        this.setupFormListeners();

        // Filter changes
        this.setupFilterListeners();
    }

    // Configurar listeners de formulários
    setupFormListeners() {
        // Formulário de entrada
        const formEntrada = document.getElementById('formEntrada');
        if (formEntrada) {
            formEntrada.addEventListener('submit', (e) => {
                e.preventDefault();
                salvarEntrada();
            });
        }

        // Formulário de saída
        const formSaida = document.getElementById('formSaida');
        if (formSaida) {
            formSaida.addEventListener('submit', (e) => {
                e.preventDefault();
                salvarSaida();
            });
        }
    }

    // Configurar listeners de filtros
    setupFilterListeners() {
        // Auto-aplicar filtros quando mudar
        const filterInputs = ['dataInicio', 'dataFim', 'filtroCategoria'];
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.debounceAplicarFiltros();
                });
            }
        });
    }

    // Debounce para aplicar filtros
    debounceAplicarFiltros() {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            aplicarFiltros();
        }, 500);
    }

    // Carregar dados iniciais
    async carregarDadosIniciais() {
        try {
            // Carregar dados sem filtros
            await this.carregarTodosDados();

            // Renderizar tabelas
            await entradasSystem.renderizarTabela();
            await saidasSystem.renderizarTabela();

            // Atualizar dashboard
            await dashboardSystem.atualizarResumo();

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            throw error;
        }
    }

    // Carregar todos os dados
    async carregarTodosDados(filtros = {}) {
        await Promise.all([
            entradasSystem.carregarEntradas(filtros),
            saidasSystem.carregarSaidas(filtros)
        ]);
    }

    // Mostrar tela de login
    showLoginScreen() {
        document.getElementById('loginContainer').classList.remove('hidden');
        document.getElementById('registerContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    // Aplicar filtros
    async aplicarFiltros() {
        try {
            authSystem.showLoading(true);

            const filtros = this.obterFiltrosAtuais();
            
            // Carregar dados com filtros
            await this.carregarTodosDados(filtros);

            // Renderizar tabelas
            await entradasSystem.renderizarTabela();
            await saidasSystem.renderizarTabela();

            // Atualizar dashboard
            await dashboardSystem.atualizarResumo(filtros);

            authSystem.showAlert('Filtros aplicados com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            authSystem.showAlert('Erro ao aplicar filtros: ' + error.message, 'danger');
        } finally {
            authSystem.showLoading(false);
        }
    }

    // Obter filtros atuais
    obterFiltrosAtuais() {
        const dataInicio = document.getElementById('dataInicio')?.value;
        const dataFim = document.getElementById('dataFim')?.value;
        const categoria = document.getElementById('filtroCategoria')?.value;

        const filtros = {};
        if (dataInicio) filtros.dataInicio = dataInicio;
        if (dataFim) filtros.dataFim = dataFim;
        if (categoria) filtros.categoria = categoria;

        return filtros;
    }

    // Limpar filtros
    async limparFiltros() {
        try {
            // Limpar campos
            document.getElementById('dataInicio').value = '';
            document.getElementById('dataFim').value = '';
            document.getElementById('filtroCategoria').value = '';

            // Recarregar dados sem filtros
            await this.carregarDadosIniciais();

            authSystem.showAlert('Filtros limpos com sucesso!', 'info');

        } catch (error) {
            console.error('Erro ao limpar filtros:', error);
            authSystem.showAlert('Erro ao limpar filtros: ' + error.message, 'danger');
        }
    }

    // Atualizar dados em tempo real
    async atualizarDados() {
        try {
            await this.carregarDadosIniciais();
            console.log('Dados atualizados com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        }
    }

    // Exportar todos os dados
    async exportarTodosDados() {
        try {
            const dados = {
                entradas: entradasSystem.entradas,
                saidas: saidasSystem.saidas,
                usuario: authSystem.getCurrentUser(),
                dataExportacao: new Date().toISOString(),
                resumo: {
                    totalEntradas: entradasSystem.calcularTotal(),
                    totalSaidas: saidasSystem.calcularTotal(),
                    saldoFinal: entradasSystem.calcularTotal() - saidasSystem.calcularTotal()
                }
            };

            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fluxo-caixa-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            authSystem.showAlert('Dados exportados com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            authSystem.showAlert('Erro ao exportar dados: ' + error.message, 'danger');
        }
    }

    // Verificar status do sistema
    verificarStatus() {
        const status = {
            initialized: this.initialized,
            supabaseConfigured: isSupabaseConfigured(),
            userLoggedIn: authSystem.isLoggedIn(),
            entradasCount: entradasSystem.entradas.length,
            saidasCount: saidasSystem.saidas.length
        };

        console.log('Status do Sistema:', status);
        return status;
    }
}

// Instância global do aplicativo
const app = new FluxoCaixaApp();

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});

// Funções globais para acesso pelo HTML
function aplicarFiltros() {
    app.aplicarFiltros();
}

function limparFiltros() {
    app.limparFiltros();
}

function atualizarDados() {
    app.atualizarDados();
}

function exportarTodosDados() {
    app.exportarTodosDados();
}

function verificarStatus() {
    return app.verificarStatus();
}

// Auto-atualizar dados a cada 5 minutos
setInterval(() => {
    if (authSystem.isLoggedIn()) {
        app.atualizarDados();
    }
}, 5 * 60 * 1000);

// Exportar para uso em outros módulos
window.app = app;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.atualizarDados = atualizarDados;
window.exportarTodosDados = exportarTodosDados;
window.verificarStatus = verificarStatus;
