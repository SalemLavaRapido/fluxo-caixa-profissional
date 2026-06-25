// Sistema de Dashboard
class DashboardSystem {
    constructor() {
        this.chart = null;
        this.categoriaChart = null;
        this.evolucaoChart = null;
    }

    // Inicializar dashboard
    async init() {
        // Configurar datas do mês atual ANTES de carregar dados
        this.configurarDatasPadrao();
        
        // Obter filtros do mês atual
        const filtros = this.obterFiltrosAtuais();
        
        await this.atualizarResumo(filtros);
        // Não criar gráfico mensal na inicialização (carrega 6 meses de dados)
        // await this.criarGraficoMensal();
        
        // Carregar contas a pagar
        if (typeof carregarContasPagar === 'function') {
            await carregarContasPagar(filtros);
        }
    }

    // Atualizar resumo financeiro
    async atualizarResumo(filtros = {}) {
        try {
            // Calcular totais diretamente no banco (muito mais rápido)
            const totalEntradas = await this.calcularTotalEntradas(filtros);
            const totalSaidas = await this.calcularTotalSaidas(filtros);
            const saldoFinal = totalEntradas - totalSaidas;

            // Calcular percentual de crescimento
            const percentualCrescimento = totalSaidas > 0 ?
                ((totalEntradas - totalSaidas) / totalSaidas * 100) : 0;

            // Atualizar cards
            this.atualizarCard('totalEntradas', totalEntradas);
            this.atualizarCard('totalSaidas', totalSaidas);
            this.atualizarCard('saldoFinal', saldoFinal);
            this.atualizarCard('percentualCrescimento', percentualCrescimento, '%');

            // Atualizar cores baseado no saldo
            const saldoElement = document.getElementById('saldoFinal');
            if (saldoElement) {
                saldoElement.className = saldoFinal >= 0 ? 'text-success' : 'text-danger';
            }

            // Carregar dados para tabelas e gráficos (após atualizar cards)
            await entradasSystem.carregarEntradas(filtros);
            await saidasSystem.carregarSaidas(filtros);

            // Atualizar gráficos
            await this.atualizarGraficos();
            
            // Renderizar tabela única de saídas
            if (saidasSystem && saidasSystem.renderizarTabela) {
                await saidasSystem.renderizarTabela();
            }

            // Carregar contas a pagar usando os mesmos filtros do dashboard
            if (typeof carregarContasPagar === 'function') {
                await carregarContasPagar(filtros);
            }

        } catch (error) {
            console.error('Erro ao atualizar resumo:', error);
        }
    }

    // Atualizar card
    atualizarCard(id, valor, sufixo = 'R$ ') {
        const element = document.getElementById(id);
        if (element) {
            if (sufixo === '%') {
                element.textContent = valor.toFixed(1) + sufixo;
            } else {
                element.textContent = this.formatarDinheiro(valor);
            }
        }
    }

    // Criar gráfico mensal
    async criarGraficoMensal() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        // Destruir gráfico existente se houver
        if (this.chart) {
            this.chart.destroy();
        }

        // Obter dados dos últimos 6 meses
        const dados = await this.obterDadosMensais();

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dados.labels,
                datasets: [
                    {
                        label: 'Entradas',
                        data: dados.entradas,
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Saídas',
                        data: dados.saidas,
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    }

    // Obter dados mensais
    async obterDadosMensais() {
        const meses = [];
        const valoresEntradas = [];
        const valoresSaidas = [];
        const labels = [];

        // Gerar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            
            const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
            const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
            
            const dataInicio = primeiroDia.toISOString().split('T')[0];
            const dataFim = ultimoDia.toISOString().split('T')[0];

            // Carregar entradas do mês
            await entradasSystem.carregarEntradas({ dataInicio, dataFim });
            const totalEntradas = entradasSystem.calcularTotal();

            // Carregar saídas do mês
            await saidasSystem.carregarSaidas({ dataInicio, dataFim });
            const totalSaidas = saidasSystem.calcularTotal();

            labels.push(data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
            valoresEntradas.push(totalEntradas);
            valoresSaidas.push(totalSaidas);
        }

        return {
            labels: labels,
            entradas: valoresEntradas,
            saidas: valoresSaidas
        };
    }

    // Atualizar gráficos
    async atualizarGraficos() {
        await this.atualizarGraficoCategorias();
        await this.atualizarGraficoEvolucao();
    }

    // Criar gráfico de categorias - ENTRADAS
    async atualizarGraficoCategoriaEntradas() {
        const ctx = document.getElementById('categoriaEntradasChart');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (this.categoriaEntradasChart) {
            this.categoriaEntradasChart.destroy();
        }

        // Obter dados por categoria de entradas
        const dados = await this.obterDadosPorCategoriaEntradas();

        this.categoriaEntradasChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.labels,
                datasets: [{
                    data: dados.valores,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.85)',   // Azul
                        'rgba(220, 53, 69, 0.85)',    // Vermelho
                        'rgba(40, 167, 69, 0.85)',    // Verde
                        'rgba(255, 193, 7, 0.85)',    // Amarelo
                        'rgba(111, 66, 193, 0.85)',   // Roxo
                        'rgba(255, 127, 0, 0.85)',    // Laranja
                        'rgba(139, 69, 19, 0.85)',    // Marrom
                        'rgba(232, 62, 140, 0.85)',   // Rosa
                        'rgba(23, 162, 184, 0.85)',   // Ciano
                        'rgba(108, 117, 125, 0.85)'   // Cinza
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = 'R$ ' + context.parsed.toLocaleString('pt-BR');
                                return label + ': ' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Criar gráfico de categorias - SAÍDAS
    async atualizarGraficoCategoriaSaidas() {
        const ctx = document.getElementById('categoriaSaidasChart');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (this.categoriaSaidasChart) {
            this.categoriaSaidasChart.destroy();
        }

        // Obter dados por categoria de saídas
        const dados = await this.obterDadosPorCategoriaSaidas();

        this.categoriaSaidasChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.labels,
                datasets: [{
                    data: dados.valores,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.85)',   // Azul
                        'rgba(220, 53, 69, 0.85)',    // Vermelho
                        'rgba(40, 167, 69, 0.85)',    // Verde
                        'rgba(255, 193, 7, 0.85)',    // Amarelo
                        'rgba(111, 66, 193, 0.85)',   // Roxo
                        'rgba(255, 127, 0, 0.85)',    // Laranja
                        'rgba(139, 69, 19, 0.85)',    // Marrom
                        'rgba(232, 62, 140, 0.85)',   // Rosa
                        'rgba(23, 162, 184, 0.85)',   // Ciano
                        'rgba(108, 117, 125, 0.85)'   // Cinza
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = 'R$ ' + context.parsed.toLocaleString('pt-BR');
                                return label + ': ' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Manter compatibilidade com chamada antiga
    async atualizarGraficoCategorias() {
        await this.atualizarGraficoCategoriaEntradas();
        await this.atualizarGraficoCategoriaSaidas();
    }

    // Função vazia para evolução (removido)
    async atualizarGraficoEvolucao() {
        // Gráfico de evolução removido - substituído por categorias separadas
    }

    // Obter dados por categoria - ENTRADAS
    async obterDadosPorCategoriaEntradas() {
        const categorias = {};
        
        // Agrupar apenas entradas por categoria
        entradasSystem.entradas.forEach(entrada => {
            const cat = entradasSystem.formatarCategoria(entrada.categoria);
            categorias[cat] = (categorias[cat] || 0) + parseFloat(entrada.valor);
        });

        return {
            labels: Object.keys(categorias),
            valores: Object.values(categorias)
        };
    }

    // Obter dados por categoria - SAÍDAS
    async obterDadosPorCategoriaSaidas() {
        const categorias = {};
        
        // Agrupar apenas saídas por categoria
        saidasSystem.saidas.forEach(saida => {
            const cat = saidasSystem.formatarCategoria(saida.categoria);
            categorias[cat] = (categorias[cat] || 0) + parseFloat(saida.valor);
        });

        return {
            labels: Object.keys(categorias),
            valores: Object.values(categorias)
        };
    }

    // Obter dados por categoria (mantido para compatibilidade)
    async obterDadosPorCategoria() {
        const categorias = {};
        
        // Agrupar entradas por categoria
        entradasSystem.entradas.forEach(entrada => {
            const cat = entradasSystem.formatarCategoria(entrada.categoria);
            categorias[cat] = (categorias[cat] || 0) + parseFloat(entrada.valor);
        });

        // Agrupar saídas por categoria
        saidasSystem.saidas.forEach(saida => {
            const cat = saidasSystem.formatarCategoria(saida.categoria);
            categorias[cat] = (categorias[cat] || 0) - parseFloat(saida.valor);
        });

        return {
            labels: Object.keys(categorias),
            valores: Object.values(categorias)
        };
    }

    // Obter dados de evolução
    async obterDadosEvolucao() {
        const dados = await this.obterDadosMensais();
        const saldos = [];
        let saldoAcumulado = 0;

        dados.entradas.forEach((entrada, index) => {
            saldoAcumulado += entrada - dados.saidas[index];
            saldos.push(saldoAcumulado);
        });

        return {
            labels: dados.labels,
            saldos: saldos
        };
    }

    // Configurar datas padrão
    configurarDatasPadrao() {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const dataInicio = document.getElementById('dataInicio');
        const dataFim = document.getElementById('dataFim');

        if (dataInicio) {
            dataInicio.value = primeiroDia.toISOString().split('T')[0];
        }

        if (dataFim) {
            dataFim.value = ultimoDia.toISOString().split('T')[0];
        }
    }

    // Obter filtros atuais (categoria apenas para saídas)
    obterFiltrosAtuais() {
        const dataInicio = document.getElementById('dataInicio')?.value;
        const dataFim = document.getElementById('dataFim')?.value;
        const categoria = document.getElementById('filtroCategoria')?.value;

        const filtros = {};
        if (dataInicio) filtros.dataInicio = dataInicio;
        if (dataFim) filtros.dataFim = dataFim;
        // Categoria apenas para saídas, não para entradas
        if (categoria) filtros.categoriaSaidas = categoria;

        return filtros;
    }

    // Calcular total de entradas diretamente no banco
    async calcularTotalEntradas(filtros = {}) {
        try {
            let query = supabase
                .from('entradas')
                .select('valor')
                .eq('user_id', authSystem.getCurrentUserId());

            if (filtros.dataInicio) {
                query = query.gte('data', filtros.dataInicio);
            }
            if (filtros.dataFim) {
                query = query.lte('data', filtros.dataFim);
            }
            // NÃO aplicar filtro de categoria às entradas - apenas para saídas

            const { data, error } = await query;
            if (error) throw error;

            // Somar valores no frontend
            return data ? data.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) : 0;
        } catch (error) {
            console.error('Erro ao calcular total de entradas:', error);
            return 0;
        }
    }

    // Calcular total de saídas diretamente no banco
    async calcularTotalSaidas(filtros = {}) {
        try {
            let query = supabase
                .from('saidas')
                .select('*')
                .eq('user_id', authSystem.getCurrentUserId());

            if (filtros.dataInicio) {
                query = query.gte('data', filtros.dataInicio);
            }
            if (filtros.dataFim) {
                query = query.lte('data', filtros.dataFim);
            }
            // Usar categoriaSaidas em vez de categoria
            if (filtros.categoriaSaidas) {
                query = query.eq('categoria', filtros.categoriaSaidas);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Somar valores no frontend
            return data ? data.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) : 0;
        } catch (error) {
            console.error('Erro ao calcular total de saídas:', error);
            return 0;
        }
    }

    // Formatar dinheiro
    formatarDinheiro(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(valor));
    }
}

// Instância global
const dashboardSystem = new DashboardSystem();

// Exportar para uso em outros módulos
window.dashboardSystem = dashboardSystem;
