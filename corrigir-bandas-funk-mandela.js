#!/usr/bin/env node
/**
 * CORREÇÃO DAS BANDAS ESPECTRAIS - FUNK MANDELA
 * 
 * Atualiza as bandas espectrais com as médias aritméticas calculadas
 */

import fs from 'fs';

console.log('🔧 CORREÇÃO DAS BANDAS ESPECTRAIS - FUNK MANDELA');
console.log('=' .repeat(60));

// Novos valores baseados nas médias aritméticas calculadas
const novasBandas = {
    sub: { target_db: -7.2, toleranceDb: 1.7 },
    low_bass: { target_db: -8.9, toleranceDb: 1.2 },
    upper_bass: { target_db: -12.8, toleranceDb: 1.5 },
    low_mid: { target_db: -9.2, toleranceDb: 1.2 },
    mid: { target_db: -6.8, toleranceDb: 0.9 },
    high_mid: { target_db: -12.3, toleranceDb: 1.5 },
    brilho: { target_db: -16.2, toleranceDb: 1.7 },
    presenca: { target_db: -19.1, toleranceDb: 2.5 }
};

// Também atualizar na seção legacy_compatibility
const bandasLegacy = {
    sub: { target_db: -7.2, tol_db: 1.7 },
    low_bass: { target_db: -8.9, tol_db: 1.2 },
    upper_bass: { target_db: -12.8, tol_db: 1.5 },
    low_mid: { target_db: -9.2, tol_db: 1.2 },
    mid: { target_db: -6.8, tol_db: 0.9 },
    high_mid: { target_db: -12.3, tol_db: 1.5 },
    brilho: { target_db: -16.2, tol_db: 1.7 },
    presenca: { target_db: -19.1, tol_db: 2.5 }
};

const arquivos = [
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json',
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json'
];

for (const arquivo of arquivos) {
    console.log(`\n📂 Processando: ${arquivo}`);
    
    try {
        // Ler arquivo atual
        const conteudo = fs.readFileSync(arquivo, 'utf8');
        const dados = JSON.parse(conteudo);
        
        // Atualizar bandas na seção tonalCurve
        if (dados.funk_mandela?.flex?.tonalCurve?.bands) {
            dados.funk_mandela.flex.tonalCurve.bands.forEach(banda => {
                if (novasBandas[banda.name]) {
                    const valorAntigo = banda.target_db;
                    banda.target_db = novasBandas[banda.name].target_db;
                    banda.toleranceDb = novasBandas[banda.name].toleranceDb;
                    
                    console.log(`   ${banda.name}: ${valorAntigo} → ${banda.target_db} dB`);
                }
            });
        }
        
        // Atualizar bandas na seção legacy_compatibility (se existir)
        if (dados.funk_mandela?.legacy_compatibility?.bands) {
            Object.keys(bandasLegacy).forEach(nomeBanda => {
                if (dados.funk_mandela.legacy_compatibility.bands[nomeBanda]) {
                    const valorAntigo = dados.funk_mandela.legacy_compatibility.bands[nomeBanda].target_db;
                    dados.funk_mandela.legacy_compatibility.bands[nomeBanda].target_db = bandasLegacy[nomeBanda].target_db;
                    dados.funk_mandela.legacy_compatibility.bands[nomeBanda].tol_db = bandasLegacy[nomeBanda].tol_db;
                    
                    console.log(`   legacy.${nomeBanda}: ${valorAntigo} → ${bandasLegacy[nomeBanda].target_db} dB`);
                }
            });
        }
        
        // Atualizar timestamp de modificação
        if (dados.funk_mandela) {
            dados.funk_mandela.last_updated = new Date().toISOString();
            dados.funk_mandela.version = "2025-08-mandela-targets.3";
        }
        
        // Salvar arquivo atualizado
        fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
        console.log(`   ✅ Arquivo atualizado com sucesso`);
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

console.log('\n📊 COMPARAÇÃO DOS VALORES:');
console.log('-'.repeat(50));

console.log('| Banda | Valor Antigo | Média Aritmética | Diferença |');
console.log('|-------|--------------|------------------|-----------|');

const valoresAntigos = {
    sub: -8.0,
    low_bass: -8.0,
    upper_bass: -12.0,
    low_mid: -8.4,
    mid: -6.3,
    high_mid: -11.2,
    brilho: -14.8,
    presenca: -19.2
};

Object.keys(novasBandas).forEach(banda => {
    const antigo = valoresAntigos[banda];
    const novo = novasBandas[banda].target_db;
    const diferenca = +(novo - antigo).toFixed(1);
    const sinal = diferenca > 0 ? '+' : '';
    
    console.log(`| ${banda.replace('_', ' ')} | ${antigo} dB | ${novo} dB | ${sinal}${diferenca} dB |`);
});

console.log('\n✅ Bandas espectrais atualizadas com médias aritméticas!');
console.log('🎯 As análises agora usarão os valores corretos calculados.');
