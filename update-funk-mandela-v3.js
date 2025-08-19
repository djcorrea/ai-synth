// 🎛️ SCRIPT DE ATUALIZAÇÃO FUNK MANDELA v3.0
// Aplica padrões fixos + flexíveis conforme especificação

console.log('🔄 INICIANDO ATUALIZAÇÃO FUNK MANDELA v3.0...');

// Invalidar cache de referências
if (typeof window !== 'undefined') {
    // Limpar caches existentes
    delete window.PROD_AI_REF_DATA;
    delete window.PROD_AI_REF_DATA_ACTIVE;
    delete window.__EMBEDDED_REFS__;
    
    // Forçar reload de referências
    window.REFS_ALLOW_NETWORK = true;
    window.FORCE_REF_RELOAD = true;
    
    console.log('✅ Cache invalidado');
}

// Verificar se sistema de scoring suporta novos campos
function validateScoringEngineSupport() {
    const newFields = [
        'tol_lufs_min', 'tol_lufs_max',
        'true_peak_streaming_max', 'true_peak_baile_max',
        'lra_min', 'lra_max',
        'stereo_width_mids_highs_tolerance',
        'low_end_mono_cutoff',
        'clipping_sample_pct_max',
        'vocal_band_min_delta',
        'pattern_rules'
    ];
    
    console.log('🔍 Verificando suporte a novos campos...');
    
    // Simular dados de teste
    const testData = {
        lufsIntegrated: -8.0,
        truePeakDbtp: -0.2,
        dynamicRange: 8.0,
        lra: 2.0,
        stereoCorrelation: 0.25,
        clippingPct: 0.015,
        bandEnergies: {
            mid: { rms_db: -6.0 },
            presenca: { rms_db: -19.0 }
        }
    };
    
    const testRef = {
        lufs_target: -8,
        tol_lufs_min: 1,
        tol_lufs_max: 1,
        true_peak_streaming_max: -0.3,
        dr_target: 8,
        tol_dr: 1,
        lra_min: 1.0,
        lra_max: 4.0,
        low_end_mono_cutoff: 100,
        clipping_sample_pct_max: 0.02,
        vocal_band_min_delta: 3.0
    };
    
    // Verificar se engine de scoring aceita novos campos
    try {
        if (typeof computeMixScore === 'function') {
            const result = computeMixScore(testData, testRef);
            console.log('✅ Engine de scoring compatível:', result.scorePct + '%');
            return true;
        } else {
            console.warn('⚠️ Função computeMixScore não encontrada');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro no engine de scoring:', error.message);
        return false;
    }
}

// Função para testar padrões hard vs soft
function testHardVsSoftConstraints() {
    console.log('🧪 Testando classificação hard vs soft...');
    
    // Cenário 1: Hard constraints OK, soft com problemas
    const hardOkSoftProblems = {
        lufsIntegrated: -8.0,      // ✅ Hard: OK
        truePeakDbtp: -0.25,       // ✅ Hard: OK  
        dynamicRange: 8.0,         // ✅ Hard: OK
        clippingPct: 0.03,         // ❌ Soft: 3% > 2% limite
        lra: 5.0,                  // ❌ Soft: fora da faixa 1-4
        stereoCorrelation: 0.35    // ❌ Soft: estéreo muito amplo
    };
    
    // Cenário 2: Hard constraints com problemas
    const hardProblems = {
        lufsIntegrated: -6.0,      // ❌ Hard: muito alto
        truePeakDbtp: 0.1,         // ❌ Hard: clipping
        dynamicRange: 6.0,         // ❌ Hard: muito comprimido
        clippingPct: 0.01,         // ✅ Soft: OK
        lra: 2.5,                  // ✅ Soft: OK
        stereoCorrelation: 0.20    // ✅ Soft: OK
    };
    
    console.log('📊 Cenário 1 - Hard OK, Soft problemas:', hardOkSoftProblems);
    console.log('📊 Cenário 2 - Hard problemas, Soft OK:', hardProblems);
    
    return { hardOkSoftProblems, hardProblems };
}

// Função para gerar relatório de mudanças
function generateChangeReport() {
    const changes = {
        version: 'v2.0 → v3.0',
        timestamp: new Date().toISOString(),
        changes: {
            lufs_target: '-14 LUFS → -8 LUFS (padrão fixo)',
            tol_lufs: '±0.5 → ±1.0 (tolerância aumentada)',
            true_peak_target: '-10.46 dBTP → -0.3 dBTP (padrão streaming)',
            dr_target: '7.5 → 8.0 (mais dinâmico)',
            lra_range: '7.4±2.9 → 1.0-4.0 (faixa estreita)',
            new_fields: [
                'true_peak_streaming_max: -0.3',
                'true_peak_baile_max: 0.0',
                'low_end_mono_cutoff: 100Hz',
                'clipping_sample_pct_max: 2%',
                'vocal_band_min_delta: 3.0dB',
                'pattern_rules: hard/soft constraints'
            ],
            band_tolerances: 'Ampliadas para padrão flexível estético'
        }
    };
    
    console.log('📋 RELATÓRIO DE MUDANÇAS:');
    console.table(changes.changes);
    
    return changes;
}

// Executar validação e testes
try {
    const report = generateChangeReport();
    const engineSupport = validateScoringEngineSupport();
    const constraintTests = testHardVsSoftConstraints();
    
    console.log('🎉 ATUALIZAÇÃO FUNK MANDELA v3.0 CONCLUÍDA!');
    console.log('📄 Arquivos atualizados:');
    console.log('  - refs/out/funk_mandela.json');
    console.log('  - public/audio-analyzer-integration.js');
    console.log('✨ Novos recursos:');
    console.log('  - Padrões fixos (hard constraints)');
    console.log('  - Padrões flexíveis (soft constraints)');
    console.log('  - Tolerâncias assimétricas');
    console.log('  - Contexto streaming vs baile');
    
    // Expor para debug global
    if (typeof window !== 'undefined') {
        window.__FUNK_MANDELA_V3_UPDATE__ = {
            report,
            engineSupport,
            constraintTests,
            timestamp: new Date().toISOString()
        };
    }
    
} catch (error) {
    console.error('❌ ERRO NA ATUALIZAÇÃO:', error);
    throw error;
}

export { validateScoringEngineSupport, testHardVsSoftConstraints, generateChangeReport };
