// Sistema de Saídas (Despesas)
class SaidasSystem {
    constructor() {
        this.saidas = [];
        this.contasPagar = [];
        this.editingId = null;
    }

    // Carregar saídas do Supabase
    async carregarSaidas(filtros = {}) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return [];
            }

            const userId = authSystem.getCurrentUserId();

            // Carregar saídas pagas (com prefixo [Conta Paga])
            let querySaidas = supabase
                .from('saidas')
                .select('*')
                .eq('user_id', userId)
                .order('data', { ascending: false });

            // Aplicar filtros em saídas
            if (filtros.dataInicio) {
                querySaidas = querySaidas.gte('data', filtros.dataInicio);
            }
            if (filtros.dataFim) {
                querySaidas = querySaidas.lte('data', filtros.dataFim);
            }
            if (filtros.categoria) {
                querySaidas = querySaidas.eq('categoria', filtros.categoria);
            }

            const { data: dataSaidas, error: errorSaidas } = await querySaidas;

            if (errorSaidas) {
                throw errorSaidas;
            }

            // Filtrar apenas saídas pagas
            this.saidas = (dataSaidas || []).filter(s => s.descricao.startsWith('[Conta Paga]'));

            // Carregar contas a pagar pendentes
            let queryContas = supabase
                .from('contas_pagar')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'pendente')
                .order('data_vencimento', { ascending: false });

            // Aplicar filtros em contas a pagar
            if (filtros.dataInicio) {
                queryContas = queryContas.gte('data_vencimento', filtros.dataInicio);
            }
            if (filtros.dataFim) {
                queryContas = queryContas.lte('data_vencimento', filtros.dataFim);
            }
            if (filtros.categoria) {
                queryContas = queryContas.eq('categoria', filtros.categoria);
            }

            const { data: dataContas, error: errorContas } = await queryContas;

            if (errorContas) {
                // Se tabela não existe, ignorar erro
                if (errorContas.code !== 'PGRST116') {
                    console.error('Erro ao carregar contas a pagar:', errorContas);
                }
            }

            this.contasPagar = dataContas || [];

            return { saidas: this.saidas, contasPagar: this.contasPagar };
        } catch (error) {
            console.error('Erro ao carregar saídas:', error);
            authSystem.showAlert('Erro ao carregar saídas: ' + error.message, 'danger');
            return [];
        }
    }

    // Salvar saída
    async salvarSaida(saida) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return false;
            }

            const userId = authSystem.getCurrentUserId();

            // Se for edição, atualiza na tabela saidas (apenas contas pagas)
            if (this.editingId) {
                saida.user_id = userId;
                const result = await supabase
                    .from('saidas')
                    .update(saida)
                    .eq('id', this.editingId);

                if (result.error) {
                    throw result.error;
                }

                authSystem.showAlert('Saída atualizada com sucesso!', 'success');
            } else {
                // Se for nova conta, salva como conta a pagar pendente
                const contaPagar = {
                    descricao: saida.descricao,
                    valor: saida.valor,
                    data_vencimento: saida.data,
                    categoria: saida.categoria,
                    status: 'pendente',
                    observacao: '',
                    user_id: userId
                };

                const result = await supabase
                    .from('contas_pagar')
                    .insert([contaPagar]);

                if (result.error) {
                    throw result.error;
                }

                authSystem.showAlert('Conta cadastrada como pendente! Use o botão Pagar para marcar como paga.', 'success');
            }

            // Limpar edição
            this.editingId = null;

            // Recarregar dados
            await this.carregarSaidas();
            await this.renderizarTabela();

            // Atualizar dashboard
            if (typeof dashboardSystem !== 'undefined' && dashboardSystem.init) {
                await dashboardSystem.init();
            }

            // Atualizar contas a pagar
            if (typeof carregarContasPagar === 'function') {
                await carregarContasPagar();
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar saída:', error);
            authSystem.showAlert('Erro ao salvar saída: ' + error.message, 'danger');
            return false;
        }
    }

    // Excluir saída
    async excluirSaida(id) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return false;
            }

            if (!confirm('Tem certeza que deseja excluir esta saída?')) {
                return false;
            }

            const { error } = await supabase
                .from('saidas')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            authSystem.showAlert('Saída excluída com sucesso!', 'success');

            // Recarregar dados
            await this.carregarSaidas();
            await this.renderizarTabela();

            return true;
        } catch (error) {
            console.error('Erro ao excluir saída:', error);
            authSystem.showAlert('Erro ao excluir saída: ' + error.message, 'danger');
            return false;
        }
    }

    // Marcar conta como paga
    async marcarComoPago(id) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return false;
            }

            const conta = this.contasPagar.find(c => c.id === id);
            if (!conta) {
                authSystem.showAlert('Conta não encontrada!', 'danger');
                return false;
            }

            if (!confirm('Marcar esta conta como paga?')) {
                return false;
            }

            const userId = authSystem.getCurrentUserId();
            const hoje = new Date().toISOString().split('T')[0];

            // Atualizar status na tabela contas_pagar
            const { error: errorUpdate } = await supabase
                .from('contas_pagar')
                .update({ status: 'pago', data_pagamento: hoje })
                .eq('id', id);

            if (errorUpdate) {
                throw errorUpdate;
            }

            // Inserir na tabela saidas com prefixo [Conta Paga]
            const saida = {
                data: conta.data_vencimento,
                descricao: `[Conta Paga] ${conta.descricao}`,
                valor: conta.valor,
                categoria: conta.categoria,
                tipo: 'variavel',
                user_id: userId
            };

            const { error: errorInsert } = await supabase
                .from('saidas')
                .insert([saida]);

            if (errorInsert) {
                throw errorInsert;
            }

            authSystem.showAlert('Conta marcada como paga!', 'success');

            // Recarregar dados
            await this.carregarSaidas();
            await this.renderizarTabela();

            // Atualizar dashboard
            if (typeof dashboardSystem !== 'undefined' && dashboardSystem.init) {
                await dashboardSystem.init();
            }

            // Atualizar contas a pagar
            if (typeof carregarContasPagar === 'function') {
                await carregarContasPagar();
            }

            return true;
        } catch (error) {
            console.error('Erro ao marcar como pago:', error);
            authSystem.showAlert('Erro ao marcar como pago: ' + error.message, 'danger');
            return false;
        }
    }

    // Excluir conta (paga ou pendente)
    async excluirConta(id, tipoConta) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return false;
            }

            if (!confirm('Tem certeza que deseja excluir esta conta?')) {
                return false;
            }

            let error;
            if (tipoConta === 'paga') {
                const result = await supabase.from('saidas').delete().eq('id', id);
                error = result.error;
            } else {
                const result = await supabase.from('contas_pagar').delete().eq('id', id);
                error = result.error;
            }

            if (error) {
                throw error;
            }

            authSystem.showAlert('Conta excluída com sucesso!', 'success');

            // Recarregar dados
            await this.carregarSaidas();
            await this.renderizarTabela();

            // Atualizar dashboard
            if (typeof dashboardSystem !== 'undefined' && dashboardSystem.init) {
                await dashboardSystem.init();
            }

            // Atualizar contas a pagar
            if (typeof carregarContasPagar === 'function') {
                await carregarContasPagar();
            }

            return true;
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            authSystem.showAlert('Erro ao excluir conta: ' + error.message, 'danger');
            return false;
        }
    }

// Editar saída
    editarSaida(id) {
        const saida = this.saidas.find(s => s.id === id);
        if (!saida) return;

        this.editingId = id;

        // Preencher formulário
        document.getElementById('saidaId').value = saida.id;
        document.getElementById('saidaData').value = saida.data;
        document.getElementById('saidaDescricao').value = saida.descricao;
        document.getElementById('saidaCategoria').value = saida.categoria;
        document.getElementById('saidaTipo').value = saida.tipo;
        document.getElementById('saidaValor').value = saida.valor;

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalSaida'));
        modal.show();
    }

    // Renderizar tabela
    async renderizarTabela() {
        const tbody = document.getElementById('tabelaSaidas');
        if (!tbody) return;

        // Combinar saídas pagas e contas pendentes
        const todasAsContas = [
            ...this.saidas.map(s => ({ ...s, tipoConta: 'paga', data: s.data })),
            ...this.contasPagar.map(c => ({ ...c, tipoConta: 'pendente', data: c.data_vencimento }))
        ].sort((a, b) => new Date(b.data) - new Date(a.data));

        if (todasAsContas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>Nenhuma conta encontrada</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = todasAsContas.map(conta => {
            const isPaga = conta.tipoConta === 'paga';
            const descricaoLimpa = isPaga ? conta.descricao.replace('[Conta Paga] ', '') : conta.descricao;
            const dataFormatada = this.formatarData(conta.data);

            return `
            <tr>
                <td>${dataFormatada}</td>
                <td>${descricaoLimpa}</td>
                <td><span class="badge bg-secondary">${this.formatarCategoria(conta.categoria)}</span></td>
                <td>
                    ${isPaga 
                        ? '<span class="badge bg-success">Paga</span>'
                        : '<span class="badge bg-warning">Pendente</span>'
                    }
                </td>
                <td class="text-danger fw-bold">-${this.formatarDinheiro(conta.valor)}</td>
                <td>
                    ${!isPaga 
                        ? `<button class="btn btn-sm btn-success me-1" onclick="saidasSystem.marcarComoPago('${conta.id}')" title="Marcar como Pago">
                               <i class="fas fa-check"></i>
                           </button>`
                        : ''
                    }
                    <button class="btn btn-sm btn-action btn-edit" onclick="saidasSystem.editarSaida('${conta.id}')" ${!isPaga ? 'disabled' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-action btn-delete" onclick="saidasSystem.excluirConta('${conta.id}', '${conta.tipoConta}')" ${!isPaga ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    }

    // Obter categorias
    getCategorias() {
        return [
            { value: 'luz', label: 'Luz' },
            { value: 'agua', label: 'Água' },
            { value: 'aluguel', label: 'Aluguel' },
            { value: 'internet', label: 'Internet' },
            { value: 'funcionario', label: 'Funcionário' },
            { value: 'produtos', label: 'Produtos' },
            { value: 'vigilante', label: 'Vigilante' },
            { value: 'mei', label: 'MEI' },
            { value: 'prefeitura', label: 'Prefeitura' },
            { value: 'outros', label: 'Outros' }
        ];
    }

    // Obter categorias antigas (para compatibilidade)
    getCategoriasAntigas() {
        return [
            { value: 'funcionarios', label: 'Funcionários' },
            { value: 'fornecedores', label: 'Fornecedores' },
            { value: 'impostos', label: 'Impostos' },
            { value: 'marketing', label: 'Marketing' },
            { value: 'transporte', label: 'Transporte' },
            { value: 'outras', label: 'Outras' }
        ];
    }

    // Preencher select de categorias
    preencherCategorias() {
        const select = document.getElementById('saidaCategoria');
        if (!select) return;

        const categorias = this.getCategorias();
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            select.appendChild(option);
        });
    }

    // Preencher select de filtros
    preencherFiltros() {
        const select = document.getElementById('filtroCategoria');
        if (!select) return;

        // Se já foi preenchido pelas entradas, não preencher novamente
        if (select.children.length > 1) return;

        const categorias = this.getCategorias();
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            select.appendChild(option);
        });
    }

    // Calcular total
    calcularTotal() {
        return this.saidas.reduce((total, saida) => total + parseFloat(saida.valor), 0);
    }

    // Calcular total por tipo
    calcularTotalPorTipo() {
        const totais = {
            fixo: 0,
            variavel: 0
        };

        this.saidas.forEach(saida => {
            totais[saida.tipo] = (totais[saida.tipo] || 0) + parseFloat(saida.valor);
        });

        return totais;
    }

    // Formatar data (corrigido para evitar problema de timezone)
    formatarData(dataString) {
        if (!dataString) return '-';
        // Usar split para evitar problema de timezone
        const partes = dataString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataString;
    }

    // Formatar dinheiro
    formatarDinheiro(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(valor));
    }

    // Formatar categoria
    formatarCategoria(categoria) {
        const categorias = {
            'luz': 'Luz',
            'agua': 'Água',
            'aluguel': 'Aluguel',
            'internet': 'Internet',
            'funcionario': 'Funcionário',
            'produtos': 'Produtos',
            'vigilante': 'Vigilante',
            'mei': 'MEI',
            'prefeitura': 'Prefeitura',
            'outros': 'Outros',
            // Categorias antigas (compatibilidade)
            'funcionarios': 'Funcionários',
            'fornecedores': 'Fornecedores',
            'impostos': 'Impostos',
            'marketing': 'Marketing',
            'transporte': 'Transporte',
            'outras': 'Outras'
        };
        return categorias[categoria] || categoria;
    }
}

// Instância global
const saidasSystem = new SaidasSystem();

// Funções globais para acesso pelo HTML
function openModalSaida() {
    // Limpar formulário
    document.getElementById('formSaida').reset();
    document.getElementById('saidaId').value = '';
    
    // Definir data atual
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('saidaData').value = hoje;
    
    // Limpar edição
    saidasSystem.editingId = null;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalSaida'));
    modal.show();
}

function salvarSaida() {
    const saida = {
        data: document.getElementById('saidaData').value,
        descricao: document.getElementById('saidaDescricao').value,
        categoria: document.getElementById('saidaCategoria').value,
        tipo: document.getElementById('saidaTipo').value,
        valor: parseFloat(document.getElementById('saidaValor').value)
    };

    // Validação
    if (!saida.data || !saida.descricao || !saida.categoria || !saida.tipo || !saida.valor) {
        authSystem.showAlert('Preencha todos os campos!', 'warning');
        return;
    }

    if (saida.valor <= 0) {
        authSystem.showAlert('O valor deve ser maior que zero!', 'warning');
        return;
    }

    // Salvar
    saidasSystem.salvarSaida(saida).then(success => {
        if (success) {
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSaida'));
            modal.hide();
        }
    });
}

// Exportar para uso em outros módulos
window.saidasSystem = saidasSystem;
window.openModalSaida = openModalSaida;
window.salvarSaida = salvarSaida;
window.marcarComoPago = (id) => saidasSystem.marcarComoPago(id);
window.excluirConta = (id, tipo) => saidasSystem.excluirConta(id, tipo);
