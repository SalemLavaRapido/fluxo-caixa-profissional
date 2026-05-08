// Sistema de Saídas (Despesas) - com status pendente/paga
class SaidasSystem {
    constructor() {
        this.saidas = [];          // TODAS as saídas (pendentes + pagas)
        this.editingId = null;
        this.filtros = {};
    }

    // Carregar saídas do Supabase (ambas pendentes e pagas)
    async carregarSaidas(filtros = {}) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return [];
            }

            this.filtros = filtros || {};
            const userId = authSystem.getCurrentUserId();

            let query = supabase
                .from('saidas')
                .select('*')
                .eq('user_id', userId)
                .order('data', { ascending: false });

            if (filtros.dataInicio) {
                query = query.gte('data', filtros.dataInicio);
            }
            if (filtros.dataFim) {
                query = query.lte('data', filtros.dataFim);
            }
            if (filtros.categoria) {
                query = query.eq('categoria', filtros.categoria);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Normalizar: se vier sem status, considerar 'paga' (registros antigos)
            this.saidas = (data || []).map(s => ({
                ...s,
                status: s.status || 'paga'
            }));

            return this.saidas;
        } catch (error) {
            console.error('Erro ao carregar saídas:', error);
            if (authSystem && authSystem.showAlert) {
                authSystem.showAlert('Erro ao carregar saídas: ' + error.message, 'danger');
            }
            return [];
        }
    }

    // Salvar saída (nova vai como pendente; edição preserva status)
    async salvarSaida(saida) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) return false;
            const userId = authSystem.getCurrentUserId();

            if (this.editingId) {
                saida.user_id = userId;
                const { error } = await supabase
                    .from('saidas')
                    .update(saida)
                    .eq('id', this.editingId)
                    .eq('user_id', userId);
                if (error) throw error;
                authSystem.showAlert('Saída atualizada com sucesso!', 'success');
            } else {
                const novaSaida = {
                    ...saida,
                    user_id: userId,
                    status: 'pendente',
                    data_pagamento: null
                };
                const { error } = await supabase
                    .from('saidas')
                    .insert([novaSaida]);
                if (error) throw error;
                authSystem.showAlert('Saída cadastrada como pendente! Use o botão verde para marcar como paga.', 'success');
            }

            this.editingId = null;
            await this.carregarSaidas(this.filtros);
            await this.renderizarTabela();

            if (typeof dashboardSystem !== 'undefined' && dashboardSystem.atualizarResumo) {
                await dashboardSystem.atualizarResumo(this.filtros);
            }
            return true;
        } catch (error) {
            console.error('Erro ao salvar saída:', error);
            authSystem.showAlert('Erro ao salvar saída: ' + error.message, 'danger');
            return false;
        }
    }

    // Marcar saída como paga (data automática = hoje)
    async marcarComoPaga(id) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) return false;
            if (!confirm('Marcar esta saída como paga?')) return false;

            const userId = authSystem.getCurrentUserId();
            const hoje = new Date().toISOString().split('T')[0];

            const { error } = await supabase
                .from('saidas')
                .update({ status: 'paga', data_pagamento: hoje })
                .eq('id', id)
                .eq('user_id', userId);
            if (error) throw error;

            authSystem.showAlert('Saída marcada como paga!', 'success');
            await this.carregarSaidas(this.filtros);
            await this.renderizarTabela();

            if (typeof dashboardSystem !== 'undefined' && dashboardSystem.atualizarResumo) {
                await dashboardSystem.atualizarResumo(this.filtros);
            }
            return true;
        } catch (error) {
            console.error('Erro ao marcar como paga:', error);
            authSystem.showAlert('Erro ao marcar como paga: ' + error.message, 'danger');
            return false;
        }
    }

    // Excluir saída
    async excluirSaida(id) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) return false;
            if (!confirm('Tem certeza que deseja excluir esta saída?')) return false;

            const { error } = await supabase
                .from('saidas')
                .delete()
                .eq('id', id);
            if (error) throw error;

            authSystem.showAlert('Saída excluída com sucesso!', 'success');
            await this.carregarSaidas(this.filtros);
            await this.renderizarTabela();

            if (typeof dashboardSystem !== 'undefined' && dashboardSystem.atualizarResumo) {
                await dashboardSystem.atualizarResumo(this.filtros);
            }
            return true;
        } catch (error) {
            console.error('Erro ao excluir saída:', error);
            authSystem.showAlert('Erro ao excluir saída: ' + error.message, 'danger');
            return false;
        }
    }

    // Editar saída (abre modal preenchido)
    editarSaida(id) {
        const saida = this.saidas.find(s => s.id === id);
        if (!saida) return;
        this.editingId = id;

        const set = (el, val) => { const e = document.getElementById(el); if (e) e.value = val; };
        set('saidaId', saida.id);
        set('saidaData', saida.data);
        set('saidaDescricao', saida.descricao);
        set('saidaCategoria', saida.categoria);
        set('saidaTipo', saida.tipo);
        set('saidaValor', saida.valor);

        const modal = new bootstrap.Modal(document.getElementById('modalSaida'));
        modal.show();
    }

    // Renderizar tabela única (todas as saídas) com botão "Paga" só nos pendentes
    async renderizarTabela() {
        const tbody = document.getElementById('tabelaSaidas');
        if (!tbody) return;

        if (this.saidas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>Nenhuma saída encontrada</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = this.saidas.map(s => {
            const isPendente = s.status === 'pendente';
            const statusBadge = isPendente
                ? '<span class="badge bg-warning text-dark"><i class="fas fa-clock me-1"></i>Pendente</span>'
                : '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Paga</span>';
            const btnPagar = isPendente
                ? `<button class="btn btn-sm btn-success me-1" title="Marcar como paga" onclick="saidasSystem.marcarComoPaga('${s.id}')">
                       <i class="fas fa-check"></i> Paga
                   </button>`
                : '';
            return `
                <tr>
                    <td>${this.formatarData(s.data)}</td>
                    <td>${s.descricao}</td>
                    <td><span class="badge bg-info">${this.formatarCategoria(s.categoria)}</span></td>
                    <td>${this.badgeTipo(s.tipo)}</td>
                    <td>${statusBadge}</td>
                    <td class="text-danger fw-bold">-${this.formatarDinheiro(s.valor)}</td>
                    <td class="text-nowrap">
                        ${btnPagar}
                        <button class="btn btn-sm btn-action btn-edit" title="Editar" onclick="saidasSystem.editarSaida('${s.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-action btn-delete" title="Excluir" onclick="saidasSystem.excluirSaida('${s.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');
    }

    // Preencher select de filtros (compatibilidade com app.js)
    preencherFiltros() {
        const select = document.getElementById('filtroCategoria');
        if (!select) return;
        if (select.children.length > 1) return;

        this.getCategorias().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            select.appendChild(option);
        });
    }

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

    // TOTAL = só o que foi pago (dashboard)
    calcularTotal() {
        return this.saidas
            .filter(s => s.status === 'paga')
            .reduce((total, s) => total + parseFloat(s.valor || 0), 0);
    }

    // Total de pendentes
    calcularTotalPendente() {
        return this.saidas
            .filter(s => s.status === 'pendente')
            .reduce((total, s) => total + parseFloat(s.valor || 0), 0);
    }

    calcularTotalPorTipo() {
        const totais = { fixo: 0, variavel: 0 };
        this.saidas.filter(s => s.status === 'paga').forEach(s => {
            totais[s.tipo] = (totais[s.tipo] || 0) + parseFloat(s.valor || 0);
        });
        return totais;
    }

    formatarData(dataString) {
        if (!dataString) return '-';
        const partes = String(dataString).split('T')[0].split('-');
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return dataString;
    }

    formatarDinheiro(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(valor || 0));
    }

    formatarCategoria(categoria) {
        const map = {
            'luz': 'Luz', 'agua': 'Água', 'aluguel': 'Aluguel', 'internet': 'Internet',
            'funcionario': 'Funcionário', 'produtos': 'Produtos', 'vigilante': 'Vigilante',
            'mei': 'MEI', 'prefeitura': 'Prefeitura', 'outros': 'Outros',
            'funcionarios': 'Funcionários', 'fornecedores': 'Fornecedores', 'impostos': 'Impostos',
            'marketing': 'Marketing', 'transporte': 'Transporte', 'outras': 'Outras'
        };
        return map[categoria] || categoria;
    }

    badgeTipo(tipo) {
        if (tipo === 'fixo') return '<span class="badge bg-warning text-dark">Fixo</span>';
        if (tipo === 'variavel') return '<span class="badge bg-info">Variável</span>';
        return '<span class="badge bg-secondary">-</span>';
    }
}

// Instância global
const saidasSystem = new SaidasSystem();

// Abrir modal nova saída
function openModalSaida() {
    document.getElementById('formSaida').reset();
    const saidaIdEl = document.getElementById('saidaId');
    if (saidaIdEl) saidaIdEl.value = '';
    const hoje = new Date().toISOString().split('T')[0];
    const dataEl = document.getElementById('saidaData');
    if (dataEl) dataEl.value = hoje;
    saidasSystem.editingId = null;
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
    if (!saida.data || !saida.descricao || !saida.categoria || !saida.tipo || !saida.valor) {
        authSystem.showAlert('Preencha todos os campos!', 'warning');
        return;
    }
    if (saida.valor <= 0) {
        authSystem.showAlert('O valor deve ser maior que zero!', 'warning');
        return;
    }
    saidasSystem.salvarSaida(saida).then(success => {
        if (success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSaida'));
            if (modal) modal.hide();
        }
    });
}

window.saidasSystem = saidasSystem;
window.openModalSaida = openModalSaida;
window.salvarSaida = salvarSaida;
window.marcarComoPaga = (id) => saidasSystem.marcarComoPaga(id);
window.excluirSaida = (id) => saidasSystem.excluirSaida(id);
