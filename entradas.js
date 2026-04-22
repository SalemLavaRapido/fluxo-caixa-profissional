// Sistema de Entradas (Receitas)
class EntradasSystem {
    constructor() {
        this.entradas = [];
        this.editingId = null;
    }

    // Carregar entradas do Supabase
    async carregarEntradas(filtros = {}) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return [];
            }

            let query = supabase
                .from('entradas')
                .select('*')
                .eq('user_id', authSystem.getCurrentUserId())
                .order('data', { ascending: false });

            // Aplicar filtros
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

            if (error) {
                throw error;
            }

            this.entradas = data || [];
            return this.entradas;
        } catch (error) {
            console.error('Erro ao carregar entradas:', error);
            authSystem.showAlert('Erro ao carregar entradas: ' + error.message, 'danger');
            return [];
        }
    }

    // Salvar entrada
    async salvarEntrada(entrada) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return false;
            }

            // Adicionar user_id
            entrada.user_id = authSystem.getCurrentUserId();
            
            // Ajustar data para evitar problema de timezone
            if (entrada.data) {
                // Garantir formato YYYY-MM-DD sem timezone
                const [ano, mes, dia] = entrada.data.split('-');
                entrada.data = `${ano}-${mes}-${dia}`;
            }

            let result;
            if (this.editingId) {
                // Atualizar
                result = await supabase
                    .from('entradas')
                    .update(entrada)
                    .eq('id', this.editingId);
            } else {
                // Inserir
                result = await supabase
                    .from('entradas')
                    .insert([entrada]);
            }

            if (result.error) {
                throw result.error;
            }

            authSystem.showAlert(
                this.editingId ? 'Entrada atualizada com sucesso!' : 'Entrada cadastrada com sucesso!',
                'success'
            );

            // Limpar edição
            this.editingId = null;

            // Recarregar dados
            await this.carregarEntradas();
            await this.renderizarTabela();

            return true;
        } catch (error) {
            console.error('Erro ao salvar entrada:', error);
            authSystem.showAlert('Erro ao salvar entrada: ' + error.message, 'danger');
            return false;
        }
    }

    // Excluir entrada
    async excluirEntrada(id) {
        try {
            if (!supabase || !authSystem.isLoggedIn()) {
                return false;
            }

            if (!confirm('Tem certeza que deseja excluir esta entrada?')) {
                return false;
            }

            const { error } = await supabase
                .from('entradas')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            authSystem.showAlert('Entrada excluída com sucesso!', 'success');

            // Recarregar dados
            await this.carregarEntradas();
            await this.renderizarTabela();

            return true;
        } catch (error) {
            console.error('Erro ao excluir entrada:', error);
            authSystem.showAlert('Erro ao excluir entrada: ' + error.message, 'danger');
            return false;
        }
    }

    // Editar entrada
    editarEntrada(id) {
        const entrada = this.entradas.find(e => e.id === id);
        if (!entrada) return;

        this.editingId = id;

        // Preencher formulário
        document.getElementById('entradaId').value = entrada.id;
        document.getElementById('entradaData').value = entrada.data;
        document.getElementById('entradaDescricao').value = entrada.descricao;
        document.getElementById('entradaCategoria').value = entrada.categoria;
        document.getElementById('entradaFormaPagamento').value = entrada.forma_pagamento;
        document.getElementById('entradaValor').value = entrada.valor;

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalEntrada'));
        modal.show();
    }

    // Renderizar tabela
    async renderizarTabela() {
        const tbody = document.getElementById('tabelaEntradas');
        if (!tbody) return;

        if (this.entradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>Nenhuma entrada encontrada</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.entradas.map(entrada => `
            <tr>
                <td>${this.formatarData(entrada.data)}</td>
                <td>${entrada.descricao}</td>
                <td><span class="badge bg-success">${this.formatarCategoria(entrada.categoria)}</span></td>
                <td><span class="badge bg-info">${this.formatarFormaPagamento(entrada.forma_pagamento)}</span></td>
                <td class="text-success fw-bold">+${this.formatarDinheiro(entrada.valor)}</td>
                <td>
                    <button class="btn btn-sm btn-action btn-edit" onclick="entradasSystem.editarEntrada('${entrada.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-action btn-delete" onclick="entradasSystem.excluirEntrada('${entrada.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Obter categorias
    getCategorias() {
        return [
            { value: 'lavagem_carro', label: 'Lavagem Carro' },
            { value: 'lavagem_moto', label: 'Lavagem Moto' },
            { value: 'lavagem_caminhonete', label: 'Lavagem Caminhonete' },
            { value: 'mensalista', label: 'Estacionamento Mensalista' },
            { value: 'avulso', label: 'Estacionamento Avulso' },
            { value: 'outros', label: 'Outros' }
        ];
    }

    
    // Preencher select de filtros
    preencherFiltros() {
        const select = document.getElementById('filtroCategoria');
        if (!select) return;

        select.innerHTML = '<option value="">Todas</option>';
        
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
        return this.entradas.reduce((total, entrada) => total + parseFloat(entrada.valor), 0);
    }

    // Formatar data
    formatarData(dataString) {
        // Tratar data como string local para evitar timezone issues
        const [ano, mes, dia] = dataString.split('-');
        return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }

    // Formatar dinheiro
    formatarDinheiro(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(valor));
    }

    // Formatar forma de pagamento
    formatarFormaPagamento(forma) {
        const formas = {
            'dinheiro': 'Dinheiro',
            'debito': 'Débito',
            'credito': 'Crédito',
            'pix': 'Pix'
        };
        return formas[forma] || forma;
    }

    // Formatar categoria
    formatarCategoria(categoria) {
        const categorias = {
            'lavagem_carro': 'Lavagem Carro',
            'lavagem_moto': 'Lavagem Moto',
            'lavagem_caminhonete': 'Lavagem Caminhonete',
            'mensalista': 'Estacionamento Mensalista',
            'avulso': 'Estacionamento Avulso',
            'outros': 'Outros'
        };
        return categorias[categoria] || categoria;
    }
}

// Instância global
const entradasSystem = new EntradasSystem();

// Funções globais para acesso pelo HTML
function openModalEntrada() {
    // Limpar formulário
    document.getElementById('formEntrada').reset();
    document.getElementById('entradaId').value = '';
    
    // Definir data atual (sem timezone)
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    document.getElementById('entradaData').value = hoje;
    
    // Limpar edição
    entradasSystem.editingId = null;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalEntrada'));
    modal.show();
}

function salvarEntrada() {
    alert('Função salvarEntrada foi chamada!');
    console.log('Iniciando salvamento...');
    
    const entrada = {
        data: document.getElementById('entradaData').value,
        descricao: document.getElementById('entradaDescricao').value,
        categoria: document.getElementById('entradaCategoria').value,
        forma_pagamento: document.getElementById('entradaFormaPagamento').value,
        valor: parseFloat(document.getElementById('entradaValor').value)
    };

    console.log('Dados da entrada:', entrada);

    // Validação
    if (!entrada.data || !entrada.descricao || !entrada.categoria || !entrada.forma_pagamento || !entrada.valor) {
        console.log('Validação falhou:', entrada);
        authSystem.showAlert('Preencha todos os campos!', 'warning');
        return;
    }

    if (entrada.valor <= 0) {
        authSystem.showAlert('O valor deve ser maior que zero!', 'warning');
        return;
    }

    // Salvar
    entradasSystem.salvarEntrada(entrada).then(success => {
        if (success) {
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEntrada'));
            modal.hide();
        }
    });
}

// Exportar para uso em outros módulos
window.entradasSystem = entradasSystem;
window.openModalEntrada = openModalEntrada;
window.salvarEntrada = salvarEntrada;
