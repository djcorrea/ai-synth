/**
 * 🎛️ TRADUTOR DE ENERGIA PARA DAW
 * 
 * Converte análises em % energia para sugestões práticas em dB
 * que o usuário pode aplicar diretamente na DAW
 */

// 🎯 Função para converter diferenças de energia em ajustes dB práticos
function convertEnergyDifferenceToDbSuggestion(energyPercentCurrent, energyPercentTarget, bandName) {
    // Calcular diferença em energia
    const energyRatio = energyPercentCurrent / energyPercentTarget;
    
    // Converter para dB (mais preciso que aproximações lineares)
    const dbDifference = 10 * Math.log10(energyRatio);
    
    // Sugestão prática para DAW
    let suggestion = {
        band: bandName,
        current_energy_percent: energyPercentCurrent.toFixed(1),
        target_energy_percent: energyPercentTarget.toFixed(1),
        energy_ratio: energyRatio.toFixed(2),
        db_difference: dbDifference.toFixed(1),
        daw_suggestion: generateDAWSuggestion(dbDifference, bandName),
        eq_setting: generateEQSetting(dbDifference, bandName)
    };
    
    return suggestion;
}

// 🎛️ Gerar sugestão prática para DAW
function generateDAWSuggestion(dbDiff, bandName) {
    const absDiff = Math.abs(dbDiff);
    const direction = dbDiff > 0 ? 'cortar' : 'realçar';
    const actionVerb = dbDiff > 0 ? 'Corte' : 'Boost';
    
    // Sugestões práticas baseadas na magnitude
    let practicalSuggestion = '';
    
    if (absDiff < 1) {
        practicalSuggestion = `Ajuste fino: ${actionVerb} de ${absDiff.toFixed(1)}dB`;
    } else if (absDiff < 3) {
        practicalSuggestion = `Ajuste leve: ${actionVerb} de ${absDiff.toFixed(1)}dB`;
    } else if (absDiff < 6) {
        practicalSuggestion = `Ajuste moderado: ${actionVerb} de ${absDiff.toFixed(1)}dB`;
    } else {
        practicalSuggestion = `Ajuste forte: ${actionVerb} de ${absDiff.toFixed(1)}dB (revisar mixagem)`;
    }
    
    return {
        action: direction,
        magnitude: absDiff.toFixed(1),
        description: practicalSuggestion,
        urgency: absDiff > 6 ? 'high' : absDiff > 3 ? 'medium' : 'low'
    };
}

// 🎚️ Gerar configuração específica de EQ
function generateEQSetting(dbDiff, bandName) {
    const freqRanges = {
        'sub': { center: 40, range: '20-60 Hz', q: 0.7 },
        'bass': { center: 80, range: '60-120 Hz', q: 1.0 },
        'low_mid': { center: 180, range: '120-250 Hz', q: 1.2 },
        'mid': { center: 500, range: '250-1000 Hz', q: 1.0 },
        'high_mid': { center: 2000, range: '1k-4k Hz', q: 1.2 },
        'presence': { center: 5000, range: '4k-8k Hz', q: 1.0 },
        'air': { center: 12000, range: '8k-16k Hz', q: 0.8 }
    };
    
    const bandInfo = freqRanges[bandName] || freqRanges['mid'];
    
    return {
        frequency: `${bandInfo.center} Hz`,
        frequency_range: bandInfo.range,
        gain: `${dbDiff > 0 ? '-' : '+'}${Math.abs(dbDiff).toFixed(1)} dB`,
        q_factor: bandInfo.q,
        filter_type: Math.abs(dbDiff) > 6 ? 'Bell (wide)' : 'Bell',
        daw_instructions: generateDAWInstructions(dbDiff, bandInfo)
    };
}

// 🎛️ Instruções específicas para DAW
function generateDAWInstructions(dbDiff, bandInfo) {
    const action = dbDiff > 0 ? 'cut' : 'boost';
    const gain = Math.abs(dbDiff).toFixed(1);
    
    return {
        protools: `EQ3: ${bandInfo.center}Hz, Q${bandInfo.q}, ${dbDiff > 0 ? '-' : '+'}${gain}dB`,
        logic: `Channel EQ: ${bandInfo.center}Hz, Gain ${dbDiff > 0 ? '-' : '+'}${gain}dB, Q ${bandInfo.q}`,
        ableton: `EQ Eight: Band ${action} ${gain}dB @ ${bandInfo.center}Hz`,
        studio_one: `Pro EQ: ${bandInfo.center}Hz, ${dbDiff > 0 ? '-' : '+'}${gain}dB, Q ${bandInfo.q}`,
        reaper: `ReaEQ: ${bandInfo.center}Hz, ${dbDiff > 0 ? 'Cut' : 'Boost'} ${gain}dB`,
        cubase: `StudioEQ: ${bandInfo.center}Hz, ${dbDiff > 0 ? '-' : '+'}${gain}dB`
    };
}

// 🎼 Função principal para gerar relatório completo para DAW
function generateDAWReport(spectralAnalysis, targetPercentages) {
    const dawReport = {
        timestamp: new Date().toISOString(),
        analysis_method: 'energy_percentage_internal',
        display_format: 'db_for_daw_compatibility',
        suggestions: [],
        summary: {
            total_adjustments: 0,
            critical_issues: 0,
            moderate_issues: 0,
            minor_issues: 0
        }
    };
    
    // Processar cada banda
    Object.entries(spectralAnalysis.bands).forEach(([bandName, analysis]) => {
        const targetPercent = targetPercentages[bandName] || 0;
        const currentPercent = analysis.energy_percent;
        
        if (Math.abs(currentPercent - targetPercent) > 0.5) { // Threshold: 0.5%
            const suggestion = convertEnergyDifferenceToDbSuggestion(
                currentPercent, 
                targetPercent, 
                bandName
            );
            
            dawReport.suggestions.push(suggestion);
            dawReport.summary.total_adjustments++;
            
            // Categorizar urgência
            const urgency = suggestion.daw_suggestion.urgency;
            if (urgency === 'high') dawReport.summary.critical_issues++;
            else if (urgency === 'medium') dawReport.summary.moderate_issues++;
            else dawReport.summary.minor_issues++;
        }
    });
    
    // Ordenar por urgência
    dawReport.suggestions.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.daw_suggestion.urgency] - urgencyOrder[a.daw_suggestion.urgency];
    });
    
    return dawReport;
}

// 🎯 Exemplo de uso
function demonstrateEnergyToDbConversion() {
    console.log('🎛️ DEMONSTRAÇÃO: Energia → Sugestões dB para DAW');
    console.log('=' .repeat(60));
    
    // Exemplo: Bass com 18% energia vs target 12%
    const suggestion = convertEnergyDifferenceToDbSuggestion(18.0, 12.0, 'bass');
    
    console.log('📊 ANÁLISE INTERNA (% energia):');
    console.log(`   Atual: ${suggestion.current_energy_percent}%`);
    console.log(`   Target: ${suggestion.target_energy_percent}%`);
    console.log(`   Razão: ${suggestion.energy_ratio}x`);
    
    console.log('\n🎛️ TRADUÇÃO PARA DAW (dB):');
    console.log(`   Diferença: ${suggestion.db_difference}dB`);
    console.log(`   Ação: ${suggestion.daw_suggestion.description}`);
    
    console.log('\n🎚️ CONFIGURAÇÃO DE EQ:');
    console.log(`   Frequência: ${suggestion.eq_setting.frequency}`);
    console.log(`   Ganho: ${suggestion.eq_setting.gain}`);
    console.log(`   Q Factor: ${suggestion.eq_setting.q_factor}`);
    
    console.log('\n🎛️ INSTRUÇÕES POR DAW:');
    Object.entries(suggestion.eq_setting.daw_instructions).forEach(([daw, instruction]) => {
        console.log(`   ${daw.toUpperCase()}: ${instruction}`);
    });
}

// Exportar funções
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        convertEnergyDifferenceToDbSuggestion,
        generateDAWReport,
        demonstrateEnergyToDbConversion
    };
}

// Disponibilizar globalmente no browser
if (typeof window !== 'undefined') {
    window.EnergyToDbConverter = {
        convertEnergyDifferenceToDbSuggestion,
        generateDAWReport,
        demonstrateEnergyToDbConversion
    };
}
