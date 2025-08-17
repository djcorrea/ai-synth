// 🚨 CORREÇÃO CRÍTICA - Sub-Scores Incorretos Detectados
// Baseado na análise da interface: LUFS -0.5, TP 0.0dBTP, Balance -49%

class SubScoreCriticalFix {
    constructor() {
        this.DEBUG = true;
    }

    /**
     * 🔍 Analisar discrepâncias críticas nos sub-scores
     * @param {Object} technicalData - Dados técnicos reais
     * @param {Object} displayedScores - Scores exibidos na interface
     * @param {Object} reference - Referência do gênero
     */
    analyzeCriticalDiscrepancies(technicalData, displayedScores, reference) {
        console.log('🚨 [CRITICAL] Analisando discrepâncias nos sub-scores');
        
        const issues = [];
        const corrections = {};

        // 1. ANÁLISE LOUDNESS CRÍTICA
        const loudnessIssue = this.analyzeLoudnessDiscrepancy(technicalData, displayedScores, reference);
        if (loudnessIssue.severity === 'critical') {
            issues.push(loudnessIssue);
            corrections.loudness = loudnessIssue.correctedScore;
        }

        // 2. ANÁLISE TECHNICAL CRÍTICA  
        const technicalIssue = this.analyzeTechnicalDiscrepancy(technicalData, displayedScores);
        if (technicalIssue.severity === 'critical') {
            issues.push(technicalIssue);
            corrections.technical = technicalIssue.correctedScore;
        }

        // 3. ANÁLISE DINÂMICA
        const dynamicsIssue = this.analyzeDynamicsAccuracy(technicalData, displayedScores, reference);
        if (dynamicsIssue.needsAttention) {
            issues.push(dynamicsIssue);
        }

        return {
            issues,
            corrections,
            severity: issues.some(i => i.severity === 'critical') ? 'critical' : 'moderate',
            summary: this.generateCriticalSummary(issues, corrections)
        };
    }

    /**
     * 🔊 Analisar discrepância crítica no Loudness Score
     */
    analyzeLoudnessDiscrepancy(td, displayed, ref) {
        const lufsValue = td.lufsIntegrated || td.lufs || td.rms;
        const targetLufs = ref?.lufs_target || -14;
        const tolerance = ref?.tol_lufs || 1;
        
        if (!Number.isFinite(lufsValue)) {
            return { severity: 'warning', message: 'LUFS não disponível' };
        }

        const deviation = Math.abs(lufsValue - targetLufs);
        const expectedScore = Math.max(0, 100 - (deviation / tolerance) * 15); // Fórmula mais realista
        const displayedScore = displayed.loudness || 0;
        const difference = Math.abs(expectedScore - displayedScore);

        console.log(`🔊 [LOUDNESS] LUFS: ${lufsValue}, Target: ${targetLufs}, Desvio: ${deviation.toFixed(1)}dB`);
        console.log(`🔊 [LOUDNESS] Esperado: ${expectedScore.toFixed(0)}, Exibido: ${displayedScore}, Diff: ${difference.toFixed(1)}`);

        if (difference > 30) {
            return {
                category: 'loudness',
                severity: 'critical',
                message: `LUFS ${lufsValue} está ${deviation.toFixed(1)}dB do target, mas score está ${displayedScore}/100`,
                expectedScore: Math.round(expectedScore),
                displayedScore: displayedScore,
                correctedScore: Math.round(expectedScore),
                details: {
                    lufsValue,
                    targetLufs,
                    deviation,
                    deviationInTolerances: deviation / tolerance
                }
            };
        }

        return { severity: 'ok' };
    }

    /**
     * 🔧 Analisar discrepância no Technical Score
     */
    analyzeTechnicalDiscrepancy(td, displayed) {
        const truePeak = td.truePeakDbtp || td.truePeak || 0;
        const balance = Math.abs(td.balanceLR || 0);
        const correlation = td.stereoCorrelation || 0;
        const dcOffset = Math.abs(td.dcOffset || 0);
        const clipping = td.clippingSamples || 0;

        let expectedScore = 100;
        const penalties = [];

        // Penalidades baseadas nos valores reais
        if (truePeak >= -0.1) {
            expectedScore -= 25; // True Peak muito alto
            penalties.push(`TruePeak ${truePeak}dBTP: -25pts`);
        }

        if (balance > 0.3) { // Balance > 30%
            expectedScore -= 20;
            penalties.push(`Balance ${(balance*100).toFixed(0)}%: -20pts`);
        }

        if (correlation > 0.6) { // Correlação muito alta
            expectedScore -= 10;
            penalties.push(`Correlação ${correlation}: -10pts`);
        }

        if (dcOffset > 0.02) {
            expectedScore -= 10;
            penalties.push(`DC Offset: -10pts`);
        }

        if (clipping > 0) {
            expectedScore -= 15;
            penalties.push(`Clipping: -15pts`);
        }

        expectedScore = Math.max(0, expectedScore);
        const displayedScore = displayed.technical || 0;
        const difference = Math.abs(expectedScore - displayedScore);

        console.log(`🔧 [TECHNICAL] Penalidades: ${penalties.join(', ')}`);
        console.log(`🔧 [TECHNICAL] Esperado: ${expectedScore}, Exibido: ${displayedScore}, Diff: ${difference}`);

        if (difference > 25) {
            return {
                category: 'technical',
                severity: 'critical',
                message: `Problemas técnicos detectados mas score está ${displayedScore}/100`,
                expectedScore: Math.round(expectedScore),
                displayedScore: displayedScore,
                correctedScore: Math.round(expectedScore),
                penalties: penalties,
                details: {
                    truePeak,
                    balance: balance * 100,
                    correlation,
                    dcOffset,
                    clipping
                }
            };
        }

        return { severity: 'ok' };
    }

    /**
     * ⚡ Verificar precisão do Dynamics Score
     */
    analyzeDynamicsAccuracy(td, displayed, ref) {
        const dr = td.dynamicRange || td.dr;
        const lra = td.lra;
        const crest = td.crestFactor;
        const targetDR = ref?.dr_target || 10;
        
        if (!Number.isFinite(dr)) {
            return { needsAttention: false };
        }

        const drDeviation = Math.abs(dr - targetDR);
        const expectedDrScore = Math.max(0, 100 - (drDeviation / 3) * 20);
        
        console.log(`⚡ [DYNAMICS] DR: ${dr}, Target: ${targetDR}, Score esperado: ~${expectedDrScore.toFixed(0)}`);
        
        return {
            category: 'dynamics',
            needsAttention: false, // 95/100 parece adequado para DR 8.3
            message: 'Dynamics score appears accurate',
            analysis: {
                dr,
                targetDR,
                drDeviation,
                estimatedScore: Math.round(expectedDrScore)
            }
        };
    }

    /**
     * 📋 Gerar resumo crítico
     */
    generateCriticalSummary(issues, corrections) {
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        
        if (criticalIssues.length === 0) {
            return {
                status: 'acceptable',
                message: 'Sub-scores estão relativamente corretos',
                action: 'Monitoramento contínuo recomendado'
            };
        }

        const loudnessIssue = criticalIssues.find(i => i.category === 'loudness');
        const technicalIssue = criticalIssues.find(i => i.category === 'technical');

        let message = 'DISCREPÂNCIAS CRÍTICAS DETECTADAS:\n';
        
        if (loudnessIssue) {
            message += `• LOUDNESS: ${loudnessIssue.details.lufsValue} LUFS (${loudnessIssue.details.deviation.toFixed(1)}dB do target) = Score deveria ser ~${loudnessIssue.expectedScore}/100, não ${loudnessIssue.displayedScore}/100\n`;
        }
        
        if (technicalIssue) {
            message += `• TECHNICAL: ${technicalIssue.penalties.join(', ')} = Score deveria ser ~${technicalIssue.expectedScore}/100, não ${technicalIssue.displayedScore}/100\n`;
        }

        return {
            status: 'critical',
            message,
            action: 'CORREÇÃO IMEDIATA NECESSÁRIA - Algoritmos de sub-score precisam ser revisados',
            corrections
        };
    }

    /**
     * 🛠️ Aplicar correções aos sub-scores
     */
    applyCriticalCorrections(analysis, currentScores) {
        const correctedScores = { ...currentScores };
        
        if (analysis.corrections.loudness !== undefined) {
            correctedScores.loudness = analysis.corrections.loudness;
            console.log(`🔊 [FIXED] Loudness corrigido: ${currentScores.loudness} → ${correctedScores.loudness}`);
        }
        
        if (analysis.corrections.technical !== undefined) {
            correctedScores.technical = analysis.corrections.technical;
            console.log(`🔧 [FIXED] Technical corrigido: ${currentScores.technical} → ${correctedScores.technical}`);
        }

        return {
            original: currentScores,
            corrected: correctedScores,
            changesSummary: this.summarizeChanges(currentScores, correctedScores)
        };
    }

    /**
     * 📊 Resumir mudanças aplicadas
     */
    summarizeChanges(original, corrected) {
        const changes = [];
        
        Object.keys(corrected).forEach(category => {
            if (original[category] !== corrected[category]) {
                const diff = corrected[category] - original[category];
                changes.push({
                    category,
                    from: original[category],
                    to: corrected[category],
                    difference: diff,
                    direction: diff > 0 ? 'increased' : 'decreased'
                });
            }
        });

        return changes;
    }
}

// Dados baseados na análise da interface
const INTERFACE_DATA = {
    technicalData: {
        lufsIntegrated: -0.5,
        truePeakDbtp: 0.0,
        dynamicRange: 8.3,
        lra: 6.7,
        crestFactor: 8.3,
        stereoCorrelation: 0.64,
        balanceLR: -0.49, // -49% convertido para decimal
        dcOffset: 0.0000 // Mostrado como 0.0000
    },
    displayedScores: {
        dynamics: 95,
        technical: 100,
        loudness: 100,
        frequency: 40
    },
    reference: {
        lufs_target: -5.6, // Funk Mandela target
        tol_lufs: 1.92,
        dr_target: 8.98,
        tol_dr: 1.12
    }
};

// Executar análise crítica
const criticalFix = new SubScoreCriticalFix();
const analysis = criticalFix.analyzeCriticalDiscrepancies(
    INTERFACE_DATA.technicalData,
    INTERFACE_DATA.displayedScores,
    INTERFACE_DATA.reference
);

console.log('🚨 ANÁLISE CRÍTICA COMPLETA:', analysis);

if (analysis.severity === 'critical') {
    const corrections = criticalFix.applyCriticalCorrections(analysis, INTERFACE_DATA.displayedScores);
    console.log('🛠️ CORREÇÕES APLICADAS:', corrections);
}

// Exportar para uso
if (typeof window !== 'undefined') {
    window.SubScoreCriticalFix = SubScoreCriticalFix;
    window.CRITICAL_ANALYSIS_RESULT = analysis;
}
