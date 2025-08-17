// CORREÇÃO DEFINITIVA: Fix dos sub-scores sem quebrar funcionalidade

// Esta correção resolve o problema crítico identificado:
// 1. temp-v2.js clamp inadequado para LUFS extremos
// 2. Manter compatibilidade com sistema existente
// 3. Garantir cálculos precisos para todos os casos

function fixSubScoreCalculation() {
    console.log('=== CORREÇÃO DEFINITIVA DOS SUB-SCORES ===');
    
    // PROBLEMA 1: LUFS Clamp inadequado no temp-v2.js
    // Linha 70: const l = clamp(lufsInt, -35, -8);
    // SOLUÇÃO: Estender range ou adicionar penalização extra para extremos
    
    const originalLufs = -0.5;
    const targetLufs = -14;
    const deviation = Math.abs(originalLufs - targetLufs); // 13.5 dB
    
    console.log(`LUFS Original: ${originalLufs}`);
    console.log(`LUFS Target: ${targetLufs}`);
    console.log(`Deviation: ${deviation} dB`);
    
    // ALGORITMO CORRETO para Loudness:
    function calculateLoudnessScoreFixed(lufsValue) {
        const target = -14;
        const minAcceptable = -23;  // Muito baixo
        const maxAcceptable = -6;   // Muito alto (perto de clipping)
        
        if (lufsValue > maxAcceptable) {
            // Penalização severa para valores extremamente altos
            const excess = lufsValue - maxAcceptable;
            const basePenalty = 30; // Score máximo para valores extremos
            const additionalPenalty = Math.min(25, excess * 3); // 3 pontos por dB de excesso
            return Math.max(5, basePenalty - additionalPenalty);
        }
        
        if (lufsValue < minAcceptable) {
            // Penalização para valores muito baixos
            const deficit = minAcceptable - lufsValue;
            return Math.max(20, 70 - deficit * 2);
        }
        
        // Range normal: calcular baseado na distância do target
        const distance = Math.abs(lufsValue - target);
        if (distance <= 1) return 95;     // ±1dB = excelente
        if (distance <= 2) return 85;     // ±2dB = muito bom  
        if (distance <= 3) return 75;     // ±3dB = bom
        if (distance <= 4) return 60;     // ±4dB = razoável
        if (distance <= 6) return 45;     // ±6dB = ruim
        return Math.max(20, 30 - (distance - 6) * 2); // Pior que 6dB
    }
    
    // ALGORITMO CORRETO para Technical:
    function calculateTechnicalScoreFixed(metrics) {
        let score = 100;
        
        // True Peak (mais severo)
        if (metrics.truePeakDbtp > -1) {
            if (metrics.truePeakDbtp >= 0) score -= 40;      // Clipping severo
            else if (metrics.truePeakDbtp > -0.3) score -= 30; // Muito próximo
            else if (metrics.truePeakDbtp > -0.6) score -= 20; // Próximo
            else score -= 10; // Levemente acima
        }
        
        // Sample Peak (adicional)
        if (metrics.samplePeak > -1) {
            score -= 15; // Penalização adicional para sample peak alto
        }
        
        // Clipping
        if (metrics.clippingPct > 0) {
            if (metrics.clippingPct > 1) score -= 40;       // >1% = severo
            else if (metrics.clippingPct > 0.5) score -= 25; // >0.5% = alto
            else if (metrics.clippingPct > 0.1) score -= 15; // >0.1% = médio
            else score -= 8; // Qualquer clipping é ruim
        }
        
        // DC Offset
        const dcAbs = Math.abs(metrics.dcOffset || 0);
        if (dcAbs > 0.05) score -= 20;
        else if (dcAbs > 0.02) score -= 10;
        else if (dcAbs > 0.01) score -= 5;
        
        // THD (se disponível)
        if (metrics.thdPercent > 1) score -= 15;
        else if (metrics.thdPercent > 0.5) score -= 8;
        
        return Math.max(0, Math.min(100, score));
    }
    
    // TESTE com dados reais do problema
    const testMetrics = {
        lufsIntegrated: -0.5,
        truePeakDbtp: 0.0,
        samplePeak: 0.0,
        clippingPct: 0.001,
        dcOffset: 0.002,
        thdPercent: 0.1
    };
    
    const fixedLoudness = calculateLoudnessScoreFixed(testMetrics.lufsIntegrated);
    const fixedTechnical = calculateTechnicalScoreFixed(testMetrics);
    
    console.log('\n=== RESULTADOS CORRIGIDOS ===');
    console.log(`Loudness Score: ${fixedLoudness}/100 (era 100, correto ~5-15)`);
    console.log(`Technical Score: ${fixedTechnical}/100 (era 100, correto ~20-40)`);
    
    // Comparação com interface mostrada pelo usuário
    console.log('\n=== COMPARAÇÃO COM INTERFACE ===');
    console.log('Interface mostrava: Loudness 100/100, Technical 100/100');
    console.log(`Valores corretos: Loudness ${fixedLoudness}/100, Technical ${fixedTechnical}/100`);
    console.log(`Diferença Loudness: ${100 - fixedLoudness} pontos de erro`);
    console.log(`Diferença Technical: ${100 - fixedTechnical} pontos de erro`);
    
    return {
        loudnessFixed: fixedLoudness,
        technicalFixed: fixedTechnical,
        originalValues: testMetrics
    };
}

// Executar correção
const results = fixSubScoreCalculation();

// Gerar patch para temp-v2.js
console.log('\n=== PATCH PARA temp-v2.js ===');
console.log(`
LINHA 70: 
ANTES: const l = clamp(lufsInt, -35, -8);
DEPOIS: const l = lufsInt; // Remover clamp para permitir penalização adequada

LINHAS 71-73: Substituir por algoritmo corrigido:
if (lufsInt > -6) {
    // Penalização severa para valores extremamente altos
    const excess = lufsInt - (-6);
    scores.loudness = Math.max(5, 30 - excess * 3);
} else if (lufsInt < -23) {
    // Penalização para valores muito baixos  
    const deficit = (-23) - lufsInt;
    scores.loudness = Math.max(20, 70 - deficit * 2);
} else {
    // Range normal: usar algoritmo existente mas com range estendido
    const left = mapLin(lufsInt, -35, -14, 40, 95);
    const right = mapLin(lufsInt, -14, -6, 95, 30);
    scores.loudness = Math.round(lufsInt <= -14 ? left : right);
}
`);
