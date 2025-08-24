// 🧪 TESTE RÁPIDO DO NOVO SISTEMA
console.log('🔍 Testando se o novo sistema está ativo...');

// Simular dados de teste
const testData = {
    lufs_integrated: -12.5,
    true_peak_dbtp: -0.5,
    dr_stat: 8.0,
    lra: 5.0,
    crest_factor: 8.0,
    stereo_correlation: 0.1,
    stereo_width: 0.4,
    balance_lr: 0.05
};

const testRef = {
    lufs_target: -14,
    tol_lufs: 3.0,
    dr_target: 10,
    tol_dr: 5.0,
    lra_target: 7,
    tol_lra: 5.0,
    true_peak_target: -1,
    tol_true_peak: 2.5,
    stereo_target: 0.3,
    tol_stereo: 0.7
};

// Verificar se o arquivo scoring.js está carregado
if (typeof window !== 'undefined') {
    // Tentar importar o scoring
    const script = document.createElement('script');
    script.src = 'lib/audio/features/scoring.js';
    script.onload = () => {
        console.log('📊 Scoring.js carregado, testando...');
        
        // Verificar se as funções existem
        if (typeof computeMixScore !== 'undefined') {
            console.log('🎯 Função computeMixScore encontrada');
            
            const result = computeMixScore(testData, testRef);
            console.log('📈 RESULTADO TESTE:', result);
            console.log('🔍 Método usado:', result.method);
            console.log('📊 Score:', result.scorePct + '%');
            console.log('🏆 Classificação:', result.classification);
            
            if (result.method === 'equal_weight_v3') {
                console.log('✅ SUCESSO! Novo sistema equal_weight_v3 ativo!');
            } else {
                console.log('❌ PROBLEMA! Ainda usando:', result.method);
            }
        } else {
            console.log('❌ Função computeMixScore não encontrada');
        }
    };
    script.onerror = () => {
        console.log('❌ Erro ao carregar scoring.js');
    };
    document.head.appendChild(script);
} else {
    console.log('❌ Window não disponível (Node.js)');
}

// Para Node.js
if (typeof require !== 'undefined') {
    try {
        console.log('🔍 Testando em Node.js...');
        // Simular teste em Node.js se necessário
    } catch (error) {
        console.log('❌ Erro no teste Node.js:', error.message);
    }
}
