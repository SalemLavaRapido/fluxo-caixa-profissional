// Configuração do Supabase
const SUPABASE_CONFIG = {
    // Credenciais do projeto Supabase
    URL: 'https://emkiewosmlnyjnpujbui.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldW5vbmUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODkwMTIzNCwiZXhwIjoxOTk0MjY1MjM0fQ.sb_publishable_Bd982ryXG_esL01jPijc_A_2u3pY8vV'
};

// Inicialização do cliente Supabase
let supabaseClient = null;

// Função para inicializar o Supabase
function initSupabase() {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        // Definir globalmente para compatibilidade
        window.supabase = supabaseClient;
        return true;
    } catch (error) {
        console.error('Erro ao inicializar Supabase:', error);
        return false;
    }
}

// Função para verificar se o Supabase está configurado
function isSupabaseConfigured() {
    return SUPABASE_CONFIG.URL !== 'https://SEU_PROJETO.supabase.co' && 
           SUPABASE_CONFIG.ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
}

// Função para mostrar alerta de configuração
function showConfigAlert() {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-warning alert-custom">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Atenção!</strong> Configure as credenciais do Supabase no arquivo js/config.js para usar o sistema.
                <br>
                <small>Obtenha suas credenciais em <a href="https://supabase.com" target="_blank">supabase.com</a></small>
            </div>
        `;
    }
}

// Exportar configurações
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.initSupabase = initSupabase;
window.isSupabaseConfigured = isSupabaseConfigured;
window.showConfigAlert = showConfigAlert;
