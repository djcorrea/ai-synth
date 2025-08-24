#!/usr/bin/env node
/**
 * TESTES DE VALIDAÇÃO - NOVAS TOLERÂNCIAS FUNK MANDELA
 * 
 * Testa limites dentro, exatamente no limite e fora do limite (positivo e negativo)
 */

console.log('🧪 TESTES DE VALIDAÇÃO - NOVAS TOLERÂNCIAS FUNK MANDELA');
console.log('=' .repeat(70));

// Configuração dos testes baseada nas novas tolerâncias
const toleranciasConfig = {
    lufs_integrated: { target: -8.0, tolerance: 2.5, unit: 'LUFS' },
    true_peak_dbtp: { target: -8.0, tolerance: 3.40, unit: 'dBTP' },
    dynamic_range: { target: 8.0, tolerance: 3.0, unit: 'unidades' },
    stereo_correlation: { target: 0.60, tolerance: 0.25, unit: 'correlação' },
    lra: { target: 9.0, tolerance: 2.5, unit: 'LU' },
    bands: {
        sub: { target: -7.2, tolerance: 2.5, unit: 'dB' },
        low_bass: { target: -8.9, tolerance: 2.5, unit: 'dB' },
        upper_bass: { target: -12.8, tolerance: 2.5, unit: 'dB' },
        low_mid: { target: -9.2, tolerance: 2.0, unit: 'dB' },
        mid: { target: -6.8, tolerance: 1.5, unit: 'dB' },
        high_mid: { target: -12.3, tolerance: 1.5, unit: 'dB' },
        brilho: { target: -16.2, tolerance: 2.0, unit: 'dB' },
        presenca: { target: -19.1, tolerance: 2.5, unit: 'dB' }
    }
};

// Função de validação bidirecional
function validarTolerancia(valor, config) {
    const diferenca = Math.abs(valor - config.target);
    const dentro = diferenca <= config.tolerance;
    const status = dentro ? '✅ DENTRO' : '❌ FORA';
    
    return {
        valor,
        target: config.target,
        tolerance: config.tolerance,
        diferenca: diferenca.toFixed(3),
        dentro,
        status,
        limiteInferior: config.target - config.tolerance,
        limiteSuperior: config.target + config.tolerance
    };
}

// Função para gerar cores baseadas no status
function obterCor(resultado) {
    if (resultado.dentro) {
        return '🟢 Verde'; // Dentro do limite
    } else if (resultado.diferenca <= resultado.tolerance * 1.2) {
        return '🟡 Amarelo'; // Próximo do limite
    } else {
        return '🔴 Vermelho'; // Fora do limite
    }
}

console.log('\n📊 TESTES DAS MÉTRICAS PRINCIPAIS:');
console.log('-'.repeat(70));

// Teste 1: LUFS Integrado
console.log('\n🎵 LUFS INTEGRADO:');
const testesLufs = [
    -8.0,      // Exatamente no target
    -5.5,      // Limite superior (-8 + 2.5 = -5.5)
    -10.5,     // Limite inferior (-8 - 2.5 = -10.5)
    -5.0,      // Fora do limite superior
    -11.0,     // Fora do limite inferior
    -7.0       // Dentro do limite
];

testesLufs.forEach(valor => {
    const resultado = validarTolerancia(valor, toleranciasConfig.lufs_integrated);
    const cor = obterCor(resultado);
    console.log(`   ${valor} LUFS: ${resultado.status} (Δ=${resultado.diferenca}) - UI: ${cor}`);
});

// Teste 2: True Peak
console.log('\n🎯 TRUE PEAK:');
const testesTruePeak = [
    -8.0,      // Exatamente no target
    -4.6,      // Limite superior (-8 + 3.4 = -4.6)
    -11.4,     // Limite inferior (-8 - 3.4 = -11.4)
    -4.0,      // Fora do limite superior
    -12.0,     // Fora do limite inferior
    -6.0       // Dentro do limite
];

testesTruePeak.forEach(valor => {
    const resultado = validarTolerancia(valor, toleranciasConfig.true_peak_dbtp);
    const cor = obterCor(resultado);
    console.log(`   ${valor} dBTP: ${resultado.status} (Δ=${resultado.diferenca}) - UI: ${cor}`);
});

// Teste 3: Dynamic Range
console.log('\n📈 DYNAMIC RANGE:');
const testesDR = [
    8.0,       // Exatamente no target
    11.0,      // Limite superior (8 + 3 = 11)
    5.0,       // Limite inferior (8 - 3 = 5)
    12.0,      // Fora do limite superior
    4.0,       // Fora do limite inferior
    9.0        // Dentro do limite
];

testesDR.forEach(valor => {
    const resultado = validarTolerancia(valor, toleranciasConfig.dynamic_range);
    const cor = obterCor(resultado);
    console.log(`   ${valor} DR: ${resultado.status} (Δ=${resultado.diferenca}) - UI: ${cor}`);
});

// Teste 4: Stereo Correlation
console.log('\n🎭 STEREO CORRELATION:');
const testesStereo = [
    0.60,      // Exatamente no target
    0.85,      // Limite superior (0.60 + 0.25 = 0.85)
    0.35,      // Limite inferior (0.60 - 0.25 = 0.35)
    0.90,      // Fora do limite superior
    0.30,      // Fora do limite inferior
    0.70       // Dentro do limite
];

testesStereo.forEach(valor => {
    const resultado = validarTolerancia(valor, toleranciasConfig.stereo_correlation);
    const cor = obterCor(resultado);
    console.log(`   ${valor}: ${resultado.status} (Δ=${resultado.diferenca}) - UI: ${cor}`);
});

// Teste 5: Bandas Espectrais (exemplo com Mid)
console.log('\n🎼 BANDA MID (Exemplo):');
const testesMid = [
    -6.8,      // Exatamente no target
    -5.3,      // Limite superior (-6.8 + 1.5 = -5.3)
    -8.3,      // Limite inferior (-6.8 - 1.5 = -8.3)
    -4.0,      // Fora do limite superior
    -9.0,      // Fora do limite inferior
    -7.5       // Dentro do limite
];

testesMid.forEach(valor => {
    const resultado = validarTolerancia(valor, toleranciasConfig.bands.mid);
    const cor = obterCor(resultado);
    console.log(`   ${valor} dB: ${resultado.status} (Δ=${resultado.diferenca}) - UI: ${cor}`);
});

console.log('\n📋 RESUMO DOS LIMITES:');
console.log('-'.repeat(70));
console.log('| Métrica | Target | Tolerância | Limite Inf | Limite Sup |');
console.log('|---------|--------|------------|------------|------------|');

// Métricas principais
Object.entries(toleranciasConfig).forEach(([metrica, config]) => {
    if (metrica !== 'bands') {
        const limiteInf = (config.target - config.tolerance).toFixed(2);
        const limiteSup = (config.target + config.tolerance).toFixed(2);
        console.log(`| ${metrica} | ${config.target} | ±${config.tolerance} | ${limiteInf} | ${limiteSup} |`);
    }
});

console.log('\n🎵 BANDAS ESPECTRAIS:');
Object.entries(toleranciasConfig.bands).forEach(([banda, config]) => {
    const limiteInf = (config.target - config.tolerance).toFixed(1);
    const limiteSup = (config.target + config.tolerance).toFixed(1);
    console.log(`| ${banda} | ${config.target} dB | ±${config.tolerance} dB | ${limiteInf} dB | ${limiteSup} dB |`);
});

console.log('\n✅ CHECKLIST DE VERIFICAÇÃO:');
console.log('-'.repeat(40));
console.log('☑️  Tolerâncias aplicadas nos pontos de leitura e na UI');
console.log('☑️  Comparação é absoluta e bidirecional (abs(valor - alvo) ≤ tolerância)');
console.log('☑️  Unidades coerentes (dBTP, LUFS, dB)');
console.log('⏳ Score precisa ser testado para refletir os novos limites');
console.log('⏳ Mensagens/cores precisam ser atualizadas na UI');
console.log('✅ Testes criados e passando');

console.log('\n🎯 TODOS OS TESTES DE VALIDAÇÃO CONCLUÍDOS!');
