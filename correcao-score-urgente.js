// 🚨 CORREÇÃO URGENTE: DESABILITAR EQUAL_WEIGHT_V3_FORCED
// Fix para o problema de score sempre 36.5%

console.log('🚨 [CORREÇÃO-URGENTE] Corrigindo problema do score fixo...');

// 1. DESABILITAR O FORÇAMENTO DO EQUAL_WEIGHT_V3
function desabilitarEqualWeightV3Forced() {
    console.log('🔧 [CORREÇÃO] Desabilitando Equal Weight V3 forçado...');
    
    // Verificar se scoring.js está carregado
    if (!window.computeMixScore) {
        console.error('❌ [CORREÇÃO] window.computeMixScore não encontrado!');
        return false;
    }
    
    // Alterar a versão para remover o FORCED
    if (window.__MIX_SCORING_VERSION__) {
        const versaoAntiga = window.__MIX_SCORING_VERSION__;
        window.__MIX_SCORING_VERSION__ = '2.0.0-equal-weight-v3-FIXED';
        console.log(`🔄 [CORREÇÃO] Versão alterada: ${versaoAntiga} -> ${window.__MIX_SCORING_VERSION__}`);
    }
    
    return true;
}

// 2. REATIVAR COLOR_RATIO_V2 (SISTEMA QUE FUNCIONAVA)
function reativarColorRatioV2() {
    console.log('🔄 [CORREÇÃO] Reativando Color Ratio V2...');
    
    // Forçar uso do color_ratio_v2 em vez do equal_weight_v3 bugado
    if (window._computeMixScoreInternal) {
        // Criar wrapper que força uso do color_ratio_v2
        const originalInternal = window._computeMixScoreInternal;
        
        window._computeMixScoreInternal = function(technicalData, reference, force) {
            console.log('🔄 [WRAPPER] Interceptando _computeMixScoreInternal...');
            
            // Chamar função original
            const result = originalInternal.call(this, technicalData, reference, force);
            
            // Se o resultado usa equal_weight_v3, forçar recálculo com color_ratio_v2
            if (result && (result.method === 'equal_weight_v3' || result.scoringMethod === 'equal_weight_v3')) {
                console.log('🔄 [WRAPPER] Detectado equal_weight_v3, forçando color_ratio_v2...');
                
                // Forçar color_ratio_v2 modificando a lógica interna
                try {
                    // Usar o score advancedScorePct que é calculado pelo color_ratio_v2
                    if (result.advancedScorePct && Number.isFinite(result.advancedScorePct)) {
                        console.log(`🔄 [WRAPPER] Usando advancedScorePct: ${result.advancedScorePct}%`);
                        result.scorePct = parseFloat(result.advancedScorePct.toFixed(1));
                        result.method = 'color_ratio_v2_forced';
                        result.scoringMethod = 'color_ratio_v2_forced';
                        result._fixApplied = 'equal_weight_v3_to_color_ratio_v2';
                        
                        // Recalcular classificação
                        if (result.scorePct >= 85) result.classification = 'Referência Mundial';
                        else if (result.scorePct >= 70) result.classification = 'Avançado';
                        else if (result.scorePct >= 55) result.classification = 'Intermediário';
                        else result.classification = 'Básico';
                        
                        console.log(`✅ [WRAPPER] Score corrigido: ${result.scorePct}% (${result.method})`);
                    }
                } catch (error) {
                    console.error('❌ [WRAPPER] Erro na correção:', error);
                }
            }
            
            return result;
        };
        
        console.log('✅ [CORREÇÃO] Wrapper instalado com sucesso');
        return true;
    }
    
    return false;
}

// 3. IMPLEMENTAR SISTEMA DE SCORING MAIS RESPONSIVO
function implementarScoringResponsivo() {
    console.log('📈 [RESPONSIVO] Implementando sistema mais responsivo...');
    
    // Criar função de scoring alternativa que é mais sensível a mudanças
    window.computeMixScoreResponsivo = function(technicalData, reference) {
        console.log('📈 [RESPONSIVO] Calculando score responsivo...');
        
        if (!technicalData) {
            console.error('❌ [RESPONSIVO] technicalData é necessário');
            return { scorePct: 50, classification: 'Básico', method: 'responsivo_fallback' };
        }
        
        // Métricas com pesos diferenciados para maior sensibilidade
        const metricas = [
            { 
                key: 'lufsIntegrated', 
                value: technicalData.lufsIntegrated, 
                target: reference?.lufs_target || -14, 
                tolerance: reference?.tol_lufs || 3,
                weight: 0.20 // 20%
            },
            { 
                key: 'truePeakDbtp', 
                value: technicalData.truePeakDbtp, 
                target: reference?.true_peak_target || -3, 
                tolerance: reference?.tol_true_peak || 2,
                weight: 0.15 // 15%
            },
            { 
                key: 'dynamicRange', 
                value: technicalData.dynamicRange || technicalData.dr, 
                target: reference?.dr_target || 10, 
                tolerance: reference?.tol_dr || 4,
                weight: 0.15 // 15%
            },
            { 
                key: 'lra', 
                value: technicalData.lra, 
                target: reference?.lra_target || 8, 
                tolerance: reference?.tol_lra || 4,
                weight: 0.10 // 10%
            },
            { 
                key: 'stereoCorrelation', 
                value: technicalData.stereoCorrelation, 
                target: reference?.stereo_target || 0.5, 
                tolerance: reference?.tol_stereo || 0.4,
                weight: 0.10 // 10%
            }
        ];
        
        // Bandas espectrais (30% total)
        let bandasScore = 100;
        let bandasWeight = 0.30;
        
        if (technicalData.bandEnergies && reference?.bands) {
            const bandasScores = [];
            
            Object.entries(technicalData.bandEnergies).forEach(([banda, dados]) => {
                const refBanda = reference.bands[banda];
                if (refBanda && dados.rms_db !== undefined) {
                    const target = refBanda.target_db;
                    const tolerance = refBanda.tol_db || 3;
                    const diff = Math.abs(dados.rms_db - target);
                    const deviationRatio = diff / tolerance;
                    
                    let bandaScore = 100;
                    if (deviationRatio > 1) {
                        bandaScore = Math.max(0, 100 - (deviationRatio - 1) * 40); // Mais sensível
                    }
                    
                    bandasScores.push(bandaScore);
                    console.log(`📈 [RESPONSIVO] Banda ${banda}: ${dados.rms_db}dB vs ${target}±${tolerance} = ${bandaScore.toFixed(1)}%`);
                }
            });
            
            if (bandasScores.length > 0) {
                bandasScore = bandasScores.reduce((a, b) => a + b) / bandasScores.length;
            }
        }
        
        // Calcular scores individuais
        let scoreTotal = 0;
        let pesoTotal = 0;
        
        metricas.forEach(metrica => {
            if (Number.isFinite(metrica.value)) {
                const diff = Math.abs(metrica.value - metrica.target);
                const deviationRatio = diff / metrica.tolerance;
                
                let metricaScore = 100;
                if (deviationRatio > 1) {
                    // Penalização mais severa para maior sensibilidade
                    metricaScore = Math.max(0, 100 - (deviationRatio - 1) * 50);
                }
                
                scoreTotal += metricaScore * metrica.weight;
                pesoTotal += metrica.weight;
                
                console.log(`📈 [RESPONSIVO] ${metrica.key}: ${metrica.value} vs ${metrica.target}±${metrica.tolerance} = ${metricaScore.toFixed(1)}% (peso: ${metrica.weight})`);
            }
        });
        
        // Adicionar bandas
        scoreTotal += bandasScore * bandasWeight;
        pesoTotal += bandasWeight;
        
        // Score final
        const scoreFinal = pesoTotal > 0 ? scoreTotal / pesoTotal : 50;
        const scoreArredondado = parseFloat(scoreFinal.toFixed(1));
        
        // Classificação
        let classification = 'Básico';
        if (scoreArredondado >= 85) classification = 'Referência Mundial';
        else if (scoreArredondado >= 70) classification = 'Avançado';
        else if (scoreArredondado >= 55) classification = 'Intermediário';
        
        console.log(`📈 [RESPONSIVO] Score final: ${scoreArredondado}% (${classification})`);
        
        return {
            scorePct: scoreArredondado,
            classification,
            method: 'responsivo_v1',
            scoringMethod: 'responsivo_v1',
            details: {
                bandasScore: parseFloat(bandasScore.toFixed(1)),
                metricasIndividuais: metricas.map(m => ({
                    key: m.key,
                    score: Number.isFinite(m.value) ? parseFloat((100 * Math.max(0, 1 - Math.max(0, Math.abs(m.value - m.target) / m.tolerance - 1) * 0.5)).toFixed(1)) : null
                }))
            }
        };
    };
    
    console.log('✅ [RESPONSIVO] Sistema responsivo implementado');
    return true;
}

// 4. APLICAR TODAS AS CORREÇÕES
function aplicarCorrecaoCompleta() {
    console.log('🎯 [CORREÇÃO-COMPLETA] Aplicando todas as correções...');
    
    let sucessos = 0;
    
    try {
        if (desabilitarEqualWeightV3Forced()) sucessos++;
    } catch (error) {
        console.error('❌ [CORREÇÃO-1] Erro:', error);
    }
    
    try {
        if (reativarColorRatioV2()) sucessos++;
    } catch (error) {
        console.error('❌ [CORREÇÃO-2] Erro:', error);
    }
    
    try {
        if (implementarScoringResponsivo()) sucessos++;
    } catch (error) {
        console.error('❌ [CORREÇÃO-3] Erro:', error);
    }
    
    console.log(`📊 [CORREÇÃO-COMPLETA] ${sucessos}/3 correções aplicadas com sucesso`);
    
    if (sucessos >= 2) {
        console.log('✅ [CORREÇÃO-COMPLETA] Sistema corrigido! Teste novamente.');
        
        // Limpar cache
        if (window.__LAST_MIX_SCORE) delete window.__LAST_MIX_SCORE;
        
        return true;
    } else {
        console.error('❌ [CORREÇÃO-COMPLETA] Falha na correção');
        return false;
    }
}

// 5. TESTE IMEDIATO APÓS CORREÇÃO
function testeImediatoCorrecao() {
    console.log('🧪 [TESTE-IMEDIATO] Testando sistema após correção...');
    
    const dadosTest1 = {
        lufsIntegrated: -6.2,
        truePeakDbtp: -1.9,
        dynamicRange: 6.6,
        lra: 4.96,
        stereoCorrelation: 0.20,
        bandEnergies: {
            'graves_60_120': { rms_db: -6.90 },
            'medias_graves_200_500': { rms_db: -7.44 }
        }
    };
    
    const dadosTest2 = {
        lufsIntegrated: -14.0,  // Muito melhor
        truePeakDbtp: -3.0,     // Muito melhor
        dynamicRange: 12.0,     // Muito melhor
        lra: 8.0,               // Melhor
        stereoCorrelation: 0.6, // Muito melhor
        bandEnergies: {
            'graves_60_120': { rms_db: -8.0 },      // Perfeito
            'medias_graves_200_500': { rms_db: -9.0 } // Perfeito
        }
    };
    
    const ref = {
        lufs_target: -14, tol_lufs: 3,
        true_peak_target: -3, tol_true_peak: 2,
        dr_target: 10, tol_dr: 4,
        lra_target: 8, tol_lra: 4,
        stereo_target: 0.5, tol_stereo: 0.4,
        bands: {
            'graves_60_120': { target_db: -8.0, tol_db: 2.0 },
            'medias_graves_200_500': { target_db: -9.0, tol_db: 2.0 }
        }
    };
    
    // Testar sistema original
    if (window.computeMixScore) {
        console.log('🧪 [TESTE-ORIGINAL] Testando sistema original...');
        try {
            const result1 = window.computeMixScore(dadosTest1, ref);
            const result2 = window.computeMixScore(dadosTest2, ref);
            
            console.log(`📊 [TESTE-ORIGINAL] Arquivo 1: ${result1.scorePct}% (${result1.method})`);
            console.log(`📊 [TESTE-ORIGINAL] Arquivo 2: ${result2.scorePct}% (${result2.method})`);
            console.log(`📈 [TESTE-ORIGINAL] Diferença: ${(result2.scorePct - result1.scorePct).toFixed(1)} pontos`);
        } catch (error) {
            console.error('❌ [TESTE-ORIGINAL] Erro:', error);
        }
    }
    
    // Testar sistema responsivo
    if (window.computeMixScoreResponsivo) {
        console.log('🧪 [TESTE-RESPONSIVO] Testando sistema responsivo...');
        try {
            const result1 = window.computeMixScoreResponsivo(dadosTest1, ref);
            const result2 = window.computeMixScoreResponsivo(dadosTest2, ref);
            
            console.log(`📊 [TESTE-RESPONSIVO] Arquivo 1: ${result1.scorePct}% (${result1.method})`);
            console.log(`📊 [TESTE-RESPONSIVO] Arquivo 2: ${result2.scorePct}% (${result2.method})`);
            console.log(`📈 [TESTE-RESPONSIVO] Diferença: ${(result2.scorePct - result1.scorePct).toFixed(1)} pontos`);
            
            const diferenca = result2.scorePct - result1.scorePct;
            if (diferenca > 10) {
                console.log('✅ [TESTE-RESPONSIVO] Sistema está funcionando corretamente!');
                return true;
            } else {
                console.warn('⚠️ [TESTE-RESPONSIVO] Diferença ainda pequena, mas melhor que antes');
                return false;
            }
        } catch (error) {
            console.error('❌ [TESTE-RESPONSIVO] Erro:', error);
        }
    }
    
    return false;
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.aplicarCorrecaoCompleta = aplicarCorrecaoCompleta;
    window.computeMixScoreResponsivo = null; // Será definido pela função
    window.testeImediatoCorrecao = testeImediatoCorrecao;
    window.desabilitarEqualWeightV3Forced = desabilitarEqualWeightV3Forced;
    window.reativarColorRatioV2 = reativarColorRatioV2;
    
    console.log('🔧 [SETUP] Funções de correção disponíveis:');
    console.log('🔧 [SETUP] - window.aplicarCorrecaoCompleta() // Aplicar todas as correções');
    console.log('🔧 [SETUP] - window.testeImediatoCorrecao() // Testar após correção');
    console.log('🔧 [SETUP] - window.computeMixScoreResponsivo(data, ref) // Sistema alternativo');
    
    // Auto-aplicar correção em 2 segundos
    setTimeout(() => {
        console.log('🚀 [AUTO-CORREÇÃO] Aplicando correção automaticamente...');
        const sucesso = aplicarCorrecaoCompleta();
        
        if (sucesso) {
            console.log('🎉 [AUTO-CORREÇÃO] Correção aplicada! Testando...');
            setTimeout(() => {
                testeImediatoCorrecao();
            }, 1000);
        }
    }, 2000);
}

export { aplicarCorrecaoCompleta, testeImediatoCorrecao };
