// 🔍 DIAGNÓSTICO PROFUNDO DO SISTEMA DE SCORING
// Analisa todas as camadas do sistema para identificar por que o score não muda

console.log('🔍 [DIAGNÓSTICO] Iniciando análise profunda do sistema de scoring...');

// 1. VERIFICAÇÃO DOS DADOS TÉCNICOS RECEBIDOS
function analisarDadosTecnicos(technicalData) {
    console.log('📊 [DADOS] Verificando dados técnicos recebidos...');
    console.log('📊 [DADOS] Keys disponíveis:', Object.keys(technicalData || {}));
    
    const metricas = {
        lufs: technicalData.lufsIntegrated || technicalData.lufs_integrated,
        truePeak: technicalData.truePeakDbtp || technicalData.true_peak_dbtp,
        dr: technicalData.dynamicRange || technicalData.dr || technicalData.dr_stat || technicalData.tt_dr,
        lra: technicalData.lra,
        crestFactor: technicalData.crestFactor || technicalData.crest_factor,
        stereoCorrelation: technicalData.stereoCorrelation || technicalData.stereo_correlation,
        stereoWidth: technicalData.stereoWidth || technicalData.stereo_width,
        centroid: technicalData.spectralCentroid || technicalData.spectral_centroid,
        bandas: technicalData.bandEnergies || technicalData.band_energies
    };
    
    console.log('📊 [DADOS] Métricas mapeadas:', metricas);
    
    // Verificar se bandas espectrais existem
    if (metricas.bandas && typeof metricas.bandas === 'object') {
        console.log('🌈 [BANDAS] Bandas espectrais detectadas:', Object.keys(metricas.bandas));
        Object.entries(metricas.bandas).forEach(([banda, dados]) => {
            console.log(`  ${banda}:`, dados);
        });
    } else {
        console.warn('⚠️ [BANDAS] Nenhuma banda espectral encontrada!');
    }
    
    return metricas;
}

// 2. VERIFICAÇÃO DAS REFERÊNCIAS
function analisarReferencias(reference) {
    console.log('📋 [REFS] Verificando dados de referência...');
    
    if (!reference) {
        console.warn('⚠️ [REFS] Nenhuma referência fornecida!');
        return null;
    }
    
    console.log('📋 [REFS] Keys da referência:', Object.keys(reference));
    
    const targets = {
        lufs: reference.lufs_target,
        truePeak: reference.true_peak_target,
        dr: reference.dr_target || reference.dr_stat_target || reference.tt_dr_target,
        lra: reference.lra_target,
        stereo: reference.stereo_target,
        bandas: reference.bands
    };
    
    console.log('📋 [REFS] Targets extraídos:', targets);
    
    if (targets.bandas && typeof targets.bandas === 'object') {
        console.log('🌈 [REFS-BANDAS] Bandas de referência:', Object.keys(targets.bandas));
        Object.entries(targets.bandas).forEach(([banda, config]) => {
            console.log(`  ${banda}:`, config);
        });
    } else {
        console.warn('⚠️ [REFS-BANDAS] Nenhuma banda de referência encontrada!');
    }
    
    return targets;
}

// 3. SIMULAÇÃO DO CÁLCULO DE SCORE
function simularCalculoScore(metricas, referencias) {
    console.log('🧮 [CALC] Simulando cálculo de score...');
    
    // Verificar se scoring.js está carregado
    let scoringFunction = null;
    if (typeof window !== 'undefined' && window.computeMixScore) {
        scoringFunction = window.computeMixScore;
        console.log('✅ [CALC] window.computeMixScore encontrado');
    } else {
        console.error('❌ [CALC] window.computeMixScore NÃO encontrado!');
        return null;
    }
    
    // Preparar dados para scoring
    const dadosParaScoring = {
        lufsIntegrated: metricas.lufs,
        truePeakDbtp: metricas.truePeak,
        dynamicRange: metricas.dr,
        dr: metricas.dr,
        lra: metricas.lra,
        crestFactor: metricas.crestFactor,
        stereoCorrelation: metricas.stereoCorrelation,
        stereoWidth: metricas.stereoWidth,
        spectralCentroid: metricas.centroid,
        bandEnergies: metricas.bandas
    };
    
    console.log('🧮 [CALC] Dados preparados para scoring:', dadosParaScoring);
    
    // Executar scoring
    try {
        const resultado = scoringFunction(dadosParaScoring, referencias);
        console.log('✅ [CALC] Resultado do scoring:', resultado);
        
        // Analisar o resultado
        console.log('📊 [RESULTADO] Score:', resultado.scorePct + '%');
        console.log('📊 [RESULTADO] Método usado:', resultado.method || resultado.scoringMethod);
        console.log('📊 [RESULTADO] Classificação:', resultado.classification);
        
        if (resultado.colorCounts) {
            console.log('🟢 [CORES] Verde:', resultado.colorCounts.green);
            console.log('🟡 [CORES] Amarelo:', resultado.colorCounts.yellow);
            console.log('🔴 [CORES] Vermelho:', resultado.colorCounts.red);
            console.log('📊 [CORES] Total:', resultado.colorCounts.total);
        }
        
        if (resultado.equalWeightDetails) {
            console.log('⚖️ [PESO] Total métricas:', resultado.equalWeightDetails.totalMetrics);
            console.log('⚖️ [PESO] Peso cada métrica:', resultado.equalWeightDetails.equalWeight + '%');
        }
        
        return resultado;
    } catch (error) {
        console.error('❌ [CALC] Erro no cálculo:', error);
        console.error('❌ [CALC] Stack:', error.stack);
        return null;
    }
}

// 4. TESTE COM DADOS DIFERENTES
function testarComDadosDiferentes() {
    console.log('🧪 [TESTE] Testando com dados diferentes...');
    
    // Dados base (similares ao arquivo atual)
    const dadosBase = {
        lufsIntegrated: -6.2,
        truePeakDbtp: -1.9,
        dynamicRange: 6.6,
        lra: 4.96,
        stereoCorrelation: 0.20,
        stereoWidth: 0.23,
        spectralCentroid: 4615,
        bandEnergies: {
            'baixas_60_120': { rms_db: -6.90 },
            'medias_graves_200_500': { rms_db: -7.44 },
            'medias_500_2000': { rms_db: -7.31 },
            'medias_agudas_2_4khz': { rms_db: -12.34 },
            'agudos_4_8khz': { rms_db: -15.54 },
            'presenca_8_12khz': { rms_db: -22.82 }
        }
    };
    
    // Dados modificados (piores)
    const dadosModificados = {
        lufsIntegrated: -3.0, // Muito alto
        truePeakDbtp: 0.5,    // Clipping
        dynamicRange: 2.0,    // Muito baixo
        lra: 15.0,           // Muito alto
        stereoCorrelation: -0.5, // Muito baixo
        stereoWidth: 1.2,    // Muito alto
        spectralCentroid: 8000, // Muito alto
        bandEnergies: {
            'baixas_60_120': { rms_db: -20.0 }, // Muito baixo
            'medias_graves_200_500': { rms_db: -2.0 }, // Muito alto
            'medias_500_2000': { rms_db: -25.0 }, // Muito baixo
            'medias_agudas_2_4khz': { rms_db: -1.0 }, // Muito alto
            'agudos_4_8khz': { rms_db: -30.0 }, // Muito baixo
            'presenca_8_12khz': { rms_db: 0.0 } // Muito alto
        }
    };
    
    console.log('🧪 [TESTE] Dados base:', dadosBase);
    console.log('🧪 [TESTE] Dados modificados:', dadosModificados);
    
    // Simular referência
    const referencia = {
        lufs_target: -8.0,
        tol_lufs: 2.0,
        true_peak_target: -3.0,
        tol_true_peak: 2.0,
        dr_target: 8.0,
        tol_dr: 3.0,
        lra_target: 9.0,
        tol_lra: 4.0,
        stereo_target: 0.6,
        tol_stereo: 0.5,
        bands: {
            'baixas_60_120': { target_db: -8.0, tol_db: 2.0 },
            'medias_graves_200_500': { target_db: -9.0, tol_db: 2.0 },
            'medias_500_2000': { target_db: -6.0, tol_db: 2.0 },
            'medias_agudas_2_4khz': { target_db: -12.0, tol_db: 3.0 },
            'agudos_4_8khz': { target_db: -16.0, tol_db: 4.0 },
            'presenca_8_12khz': { target_db: -19.0, tol_db: 3.0 }
        }
    };
    
    if (typeof window !== 'undefined' && window.computeMixScore) {
        console.log('🧪 [TESTE] Testando dados base...');
        const resultadoBase = window.computeMixScore(dadosBase, referencia);
        console.log('📊 [TESTE-BASE] Resultado:', resultadoBase.scorePct + '%', resultadoBase.method);
        
        console.log('🧪 [TESTE] Testando dados modificados...');
        const resultadoModificado = window.computeMixScore(dadosModificados, referencia);
        console.log('📊 [TESTE-MOD] Resultado:', resultadoModificado.scorePct + '%', resultadoModificado.method);
        
        const diferenca = resultadoModificado.scorePct - resultadoBase.scorePct;
        console.log('📈 [TESTE] Diferença:', diferenca.toFixed(1) + ' pontos');
        
        if (Math.abs(diferenca) < 1) {
            console.error('❌ [TESTE] PROBLEMA: Score não mudou significativamente!');
            console.error('❌ [TESTE] Base:', resultadoBase.scorePct + '%');
            console.error('❌ [TESTE] Modificado:', resultadoModificado.scorePct + '%');
            console.error('❌ [TESTE] Diferença:', diferenca + ' pontos');
            return false;
        } else {
            console.log('✅ [TESTE] OK: Score mudou adequadamente');
            return true;
        }
    } else {
        console.error('❌ [TESTE] Função de scoring não disponível');
        return false;
    }
}

// 5. VERIFICAÇÃO DE INCONSISTÊNCIAS
function verificarInconsistencias() {
    console.log('🔍 [INCONSIST] Verificando inconsistências no sistema...');
    
    // Verificar se há múltiplas implementações de scoring
    const funcoes = [];
    if (typeof window !== 'undefined') {
        if (window.computeMixScore) funcoes.push('window.computeMixScore');
        if (window._computeMixScoreInternal) funcoes.push('window._computeMixScoreInternal');
        if (window._computeEqualWeightV3) funcoes.push('window._computeEqualWeightV3');
        if (window.controlarCorrecaoOrdem) funcoes.push('window.controlarCorrecaoOrdem');
    }
    
    console.log('🔍 [INCONSIST] Funções de scoring encontradas:', funcoes);
    
    // Verificar flags globais
    const flags = {};
    if (typeof window !== 'undefined') {
        flags.AUDIT_MODE = window.AUDIT_MODE;
        flags.SCORING_V2 = window.SCORING_V2;
        flags.USE_TT_DR = window.USE_TT_DR;
        flags.AUTO_SCORING_V2 = window.AUTO_SCORING_V2;
        flags.PROD_AI_REF_GENRE = window.PROD_AI_REF_GENRE;
        flags.PROD_AI_REF_DATA_ACTIVE = window.PROD_AI_REF_DATA_ACTIVE;
    }
    
    console.log('🔍 [INCONSIST] Flags globais:', flags);
    
    // Verificar se há cache ou valores fixos
    if (typeof window !== 'undefined') {
        if (window.__LAST_MIX_SCORE) {
            console.log('🔍 [INCONSIST] Último score em cache:', window.__LAST_MIX_SCORE);
        }
        if (window.__LAST_FULL_ANALYSIS) {
            console.log('🔍 [INCONSIST] Última análise em cache:', window.__LAST_FULL_ANALYSIS);
        }
    }
}

// 6. FUNÇÃO PRINCIPAL DE DIAGNÓSTICO
function diagnosticoCompleto(technicalData, reference) {
    console.log('🎯 [DIAGNÓSTICO] Iniciando diagnóstico completo...');
    console.log('🎯 [DIAGNÓSTICO] Input technicalData:', technicalData);
    console.log('🎯 [DIAGNÓSTICO] Input reference:', reference);
    
    // Etapa 1: Analisar dados
    const metricas = analisarDadosTecnicos(technicalData);
    const referencias = analisarReferencias(reference);
    
    // Etapa 2: Verificar inconsistências
    verificarInconsistencias();
    
    // Etapa 3: Simular cálculo
    const resultado = simularCalculoScore(metricas, referencias);
    
    // Etapa 4: Testar com dados diferentes
    const testeOK = testarComDadosDiferentes();
    
    // Relatório final
    console.log('📋 [RELATÓRIO] ===================');
    console.log('📋 [RELATÓRIO] DIAGNÓSTICO COMPLETO');
    console.log('📋 [RELATÓRIO] ===================');
    
    if (!resultado) {
        console.error('❌ [RELATÓRIO] PROBLEMA CRÍTICO: Não foi possível calcular score');
        return false;
    }
    
    if (!testeOK) {
        console.error('❌ [RELATÓRIO] PROBLEMA: Score não está respondendo a mudanças');
        return false;
    }
    
    console.log('✅ [RELATÓRIO] Sistema de scoring funcionando');
    console.log('📊 [RELATÓRIO] Score atual:', resultado.scorePct + '%');
    console.log('⚙️ [RELATÓRIO] Método:', resultado.method);
    
    return true;
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.diagnosticoScoreProfundo = diagnosticoCompleto;
    window.analisarDadosTecnicos = analisarDadosTecnicos;
    window.analisarReferencias = analisarReferencias;
    window.simularCalculoScore = simularCalculoScore;
    window.testarComDadosDiferentes = testarComDadosDiferentes;
    window.verificarInconsistencias = verificarInconsistencias;
    
    console.log('🔧 [SETUP] Funções de diagnóstico disponíveis:');
    console.log('🔧 [SETUP] - window.diagnosticoScoreProfundo(technicalData, reference)');
    console.log('🔧 [SETUP] - window.testarComDadosDiferentes()');
    console.log('🔧 [SETUP] - window.verificarInconsistencias()');
}

export { diagnosticoCompleto, testarComDadosDiferentes, verificarInconsistencias };
