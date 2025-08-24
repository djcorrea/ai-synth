/**
 * 🧪 TESTE DO CONVERSOR ENERGIA → dB
 */

// Função para converter diferenças de energia em ajustes dB práticos
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

// Gerar sugestão prática para DAW
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

// Gerar configuração específica de EQ
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

// Instruções específicas para DAW
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

// 🎯 DEMONSTRAÇÃO
console.log('🎛️ DEMONSTRAÇÃO: Energia → Sugestões dB para DAW');
console.log('=' .repeat(60));

// Exemplo 1: Bass com excesso de energia
console.log('\n📊 EXEMPLO 1 - BASS COM EXCESSO:');
const excessBass = convertEnergyDifferenceToDbSuggestion(18.0, 12.0, 'bass');

console.log('📊 ANÁLISE INTERNA (% energia):');
console.log(`   Atual: ${excessBass.current_energy_percent}%`);
console.log(`   Target: ${excessBass.target_energy_percent}%`);
console.log(`   Razão: ${excessBass.energy_ratio}x mais energia`);

console.log('\n🎛️ TRADUÇÃO PARA DAW (dB):');
console.log(`   Diferença: ${excessBass.db_difference}dB`);
console.log(`   Ação: ${excessBass.daw_suggestion.description}`);

console.log('\n🎚️ CONFIGURAÇÃO DE EQ:');
console.log(`   Frequência: ${excessBass.eq_setting.frequency}`);
console.log(`   Ganho: ${excessBass.eq_setting.gain}`);
console.log(`   Q Factor: ${excessBass.eq_setting.q_factor}`);

console.log('\n🎛️ INSTRUÇÕES POR DAW:');
console.log(`   LOGIC: ${excessBass.eq_setting.daw_instructions.logic}`);
console.log(`   ABLETON: ${excessBass.eq_setting.daw_instructions.ableton}`);
console.log(`   PROTOOLS: ${excessBass.eq_setting.daw_instructions.protools}`);

// Exemplo 2: Air com deficiência
console.log('\n\n📊 EXEMPLO 2 - AIR COM DEFICIÊNCIA:');
const lackingAir = convertEnergyDifferenceToDbSuggestion(1.5, 3.2, 'air');

console.log('📊 ANÁLISE INTERNA (% energia):');
console.log(`   Atual: ${lackingAir.current_energy_percent}%`);
console.log(`   Target: ${lackingAir.target_energy_percent}%`);
console.log(`   Razão: ${lackingAir.energy_ratio}x (deficiência)`);

console.log('\n🎛️ TRADUÇÃO PARA DAW (dB):');
console.log(`   Diferença: ${lackingAir.db_difference}dB`);
console.log(`   Ação: ${lackingAir.daw_suggestion.description}`);

console.log('\n🎚️ CONFIGURAÇÃO DE EQ:');
console.log(`   Frequência: ${lackingAir.eq_setting.frequency}`);
console.log(`   Ganho: ${lackingAir.eq_setting.gain}`);
console.log(`   Q Factor: ${lackingAir.eq_setting.q_factor}`);

console.log('\n🎛️ INSTRUÇÕES POR DAW:');
console.log(`   LOGIC: ${lackingAir.eq_setting.daw_instructions.logic}`);
console.log(`   ABLETON: ${lackingAir.eq_setting.daw_instructions.ableton}`);
console.log(`   PROTOOLS: ${lackingAir.eq_setting.daw_instructions.protools}`);

console.log('\n\n🎯 RESULTADO:');
console.log('✅ Análise precisa em % energia internamente');
console.log('✅ Sugestões práticas em dB para DAW');
console.log('✅ Instruções específicas por software');
console.log('✅ Melhor de ambos os mundos!');
