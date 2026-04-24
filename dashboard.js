// Sistema de Dashboard
class DashboardSystem {
    constructor() {
        this.chart = null;
        this.categoriaChart = null;
        this.evolucaoChart = null;
    }

    // Inicializar dashboard
    async init() {
        await this.atualizarResumo();
        await this.criarGraficoMensal();
        this.configurarDatasPadrao();
    }

    // Atualizar resumo financeiro
    async atualizarResumo(filtros = {}) {
        try {
            // Carregar dados
            await entradasSystem.carregarEntradas(filtros);
            await saidasSystem.carregarSaidas(filtros);

            // Calcular totais
            const totalEntradas = entradasSystem.calcularTotal();
            const totalSaidas = saidasSystem.calcularTotal();
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

            // Atualizar gráficos
            await this.atualizarGraficos();

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

    // Criar gráfico de categorias
    async atualizarGraficoCategorias() {
        const ctx = document.getElementById('categoriaChart');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (this.categoriaChart) {
            this.categoriaChart.destroy();
        }

        // Obter dados por categoria
        const dados = await this.obterDadosPorCategoria();

        this.categoriaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.labels,
                datasets: [{
                    data: dados.valores,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)',
                        'rgba(83, 102, 255, 0.8)'
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

    // Criar gráfico de evolução
    async atualizarGraficoEvolucao() {
        const ctx = document.getElementById('evolucaoChart');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (this.evolucaoChart) {
            this.evolucaoChart.destroy();
        }

        // Obter dados de evolução
        const dados = await this.obterDadosEvolucao();

        this.evolucaoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dados.labels,
                datasets: [{
                    label: 'Saldo Acumulado',
                    data: dados.saldos,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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

    // Obter dados por categoria
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
    async obterDadosEolucao() {
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
