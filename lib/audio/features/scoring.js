// 🧮 MIX SCORING ENGINE V4 - BALANCED PENALTIES SYSTEM
// Calcula porcentagem de conformidade e classificação qualitativa baseada nas métricas técnicas e referências por gênero
// Design principles:
// - Sistema de penalidades balanceadas: clipping=15pts, loudness=10pts, correlation=8pts, dynamics=5pts
// - Não falha se métricas ausentes; ignora e ajusta pesos dinamicamente
// - Usa tolerâncias da referência sempre que disponível; senão aplica fallbacks seguros

console.log('[SCORING_V4] 🔥 NOVO SISTEMA DE PENALIDADES BALANCEADAS ATIVO!');

/**
 * 🎯 V4 SISTEMA DE PENALIDADES BALANCEADAS
 * Calcula penalidade específica por categoria com limites máximos
 */
function calculateSpecificPenalty(category, severity, maxPenalty) {
    if (severity === 'green' || severity === 'ok') return 0;
    
    const basePenalty = {
        'yellow': maxPenalty * 0.3,   // 30% da penalidade máxima
        'orange': maxPenalty * 0.6,   // 60% da penalidade máxima  
        'red': maxPenalty * 1.0       // 100% da penalidade máxima
    };
    
    return basePenalty[severity] || 0;
}

/**
 * 🎯 V4 PESOS REFORMULADOS COM PENALIDADES ESPECÍFICAS
 * Sistema de penalidades balanceadas por categoria
 */
const V4_PENALTY_CAPS = {
    clipping: 15,      // Máximo 15 pontos de penalidade para clipping
    loudness: 10,      // Máximo 10 pontos para loudness
    correlation: 8,    // Máximo 8 pontos para correlação estéreo
    dynamics: 5        // Máximo 5 pontos para dinâmica
};

/**
 * 🎯 FUNÇÃO PRINCIPAL V4 - BALANCED PENALTY SYSTEM
 * Sistema de scoring com penalidades balanceadas por categoria
 */
function computeMixScore(technicalData, genreRef = null) {
    console.log('[SCORING_V4] 🔥 NOVO SISTEMA DE PENALIDADES BALANCEADAS ATIVO!');
    
    if (!technicalData || typeof technicalData !== 'object') {
        console.warn('[SCORING_V4] ⚠️ technicalData inválido:', technicalData);
        return { scorePct: 30, classification: 'Básico', breakdown: {}, note: 'Dados técnicos ausentes' };
    }

    // 🎯 PONTUAÇÃO BASE DO SISTEMA V4
    let baseScore = 100;
    const penalties = {};
    
    // Extrair métricas principais
    const metrics = {
        clipping: technicalData['clipping'] || 0,
        truePeak: technicalData['truePeak'] || technicalData['pico real (dbtp)'] || 0,
        lufs: technicalData['lufs'] || technicalData['Volume Integrado (padrão streaming)'] || -14,
        dynamicRange: technicalData['dynamicRange'] || technicalData['Dinâmica (diferença entre alto/baixo)'] || 6,
        stereoCorrelation: technicalData['stereoCorrelation'] || technicalData['Correlação Estéreo (largura)'] || 0.3,
        stereoWidth: technicalData['stereoWidth'] || technicalData['Largura Estéreo'] || 0.6,
        crestFactor: technicalData['crestFactor'] || technicalData['fator de crista'] || 10
    };

    console.log('[SCORING_V4] 📊 Métricas extraídas:', metrics);

    // 🎯 CÁLCULO DE PENALIDADES POR CATEGORIA V4
    
    // CLIPPING (máximo 15 pontos)
    if (metrics.clipping > 0.1) {
        const clippingSeverity = metrics.clipping > 3 ? 'red' : (metrics.clipping > 1 ? 'orange' : 'yellow');
        penalties.clipping = calculateSpecificPenalty('clipping', clippingSeverity, V4_PENALTY_CAPS.clipping);
    }
    
    // TRUE PEAK (parte do clipping)
    if (metrics.truePeak > -1) {
        const peakSeverity = metrics.truePeak > 0 ? 'red' : (metrics.truePeak > -0.5 ? 'orange' : 'yellow');
        const peakPenalty = calculateSpecificPenalty('clipping', peakSeverity, V4_PENALTY_CAPS.clipping * 0.6);
        penalties.clipping = (penalties.clipping || 0) + peakPenalty;
    }

    // LOUDNESS (máximo 10 pontos)
    const lufsTarget = genreRef?.lufs || -14;
    const lufsDiff = Math.abs(metrics.lufs - lufsTarget);
    if (lufsDiff > 2) {
        const loudnessSeverity = lufsDiff > 6 ? 'red' : (lufsDiff > 4 ? 'orange' : 'yellow');
        penalties.loudness = calculateSpecificPenalty('loudness', loudnessSeverity, V4_PENALTY_CAPS.loudness);
    }

    // CORRELAÇÃO ESTÉREO (máximo 8 pontos)
    if (metrics.stereoCorrelation < 0.1 || metrics.stereoCorrelation > 0.8) {
        const corrSeverity = metrics.stereoCorrelation < 0.05 || metrics.stereoCorrelation > 0.9 ? 'red' : 
                           (metrics.stereoCorrelation < 0.1 || metrics.stereoCorrelation > 0.8 ? 'orange' : 'yellow');
        penalties.correlation = calculateSpecificPenalty('correlation', corrSeverity, V4_PENALTY_CAPS.correlation);
    }

    // DINÂMICA (máximo 5 pontos)
    if (metrics.dynamicRange < 4) {
        const dynSeverity = metrics.dynamicRange < 2 ? 'red' : (metrics.dynamicRange < 3 ? 'orange' : 'yellow');
        penalties.dynamics = calculateSpecificPenalty('dynamics', dynSeverity, V4_PENALTY_CAPS.dynamics);
    }

    // 🎯 APLICAR PENALIDADES COM LIMITES
    Object.keys(penalties).forEach(category => {
        const penalty = Math.min(penalties[category], V4_PENALTY_CAPS[category]);
        baseScore -= penalty;
        console.log(`[SCORING_V4] 📉 ${category}: -${penalty.toFixed(1)} pontos`);
    });

    // 🎯 GARANTIR PONTUAÇÃO MÍNIMA
    const finalScore = Math.max(baseScore, 30); // Piso de 30%
    
    const result = {
        scorePct: Math.round(finalScore * 10) / 10, // Uma casa decimal
        classification: classify(finalScore),
        breakdown: {
            baseScore: 100,
            penalties: penalties,
            totalPenalty: Object.values(penalties).reduce((sum, p) => sum + p, 0),
            finalScore: finalScore
        },
        version: 'V4_BALANCED_PENALTIES',
        note: 'Sistema V4 com penalidades balanceadas por categoria'
    };

    console.log('[SCORING_V4] 🎯 Score final:', result.scorePct);
    console.log('[SCORING_V4] 📊 Breakdown:', result.breakdown);
    
    return result;
}

// 🎯 CLASSIFICAÇÃO REBALANCEADA PARA NOVO SISTEMA DE SCORING  
function classify(scorePct) {
  if (scorePct >= 85) return 'Referência Mundial';
  if (scorePct >= 70) return 'Avançado';
  if (scorePct >= 55) return 'Intermediário';
  return 'Básico';
}

// Export para uso como módulo
export { computeMixScore };
