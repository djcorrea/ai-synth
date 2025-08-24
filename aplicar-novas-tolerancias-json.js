#!/usr/bin/env node
/**
 * APLICAÇÃO DE NOVAS TOLERÂNCIAS - FUNK MANDELA
 * 
 * Atualiza todas as tolerâncias conforme especificações do usuário
 */

import fs from 'fs';

console.log('🔧 APLICAÇÃO DE NOVAS TOLERÂNCIAS - FUNK MANDELA');
console.log('=' .repeat(70));

// Novas tolerâncias especificadas
const novasTolerancas = {
    // Métricas principais
    lufs_integrated: 2.5,      // ±2.5 LUFS
    true_peak_dbtp: 3.40,      // ±3.40 dBTP  
    dynamic_range: 3.0,        // ±3.0 unidades
    stereo_correlation: 0.25,  // ±0.25
    lra: 2.5,                 // ±2.5 LU
    
    // Bandas espectrais
    bands: {
        sub: 2.5,          // Low: ±2.5 dB
        low_bass: 2.5,     // Low: ±2.5 dB
        upper_bass: 2.5,   // Upper-Bass: ±2.5 dB
        low_mid: 2.0,      // Low-Mid: ±2.0 dB
        mid: 1.5,          // Mid: ±1.5 dB
        high_mid: 1.5,     // High-Mid: ±1.5 dB
        brilho: 2.0,       // High: ±2.0 dB
        presenca: 2.5      // Presence (2-5 kHz): ±2.5 dB
    }
};

console.log('\n📋 NOVAS TOLERÂNCIAS A APLICAR:');
console.log('-'.repeat(50));
console.log(`• LUFS Integrado: ±${novasTolerancas.lufs_integrated} LUFS`);
console.log(`• True Peak: ±${novasTolerancas.true_peak_dbtp} dBTP`);
console.log(`• Dynamic Range: ±${novasTolerancas.dynamic_range} unidades`);
console.log(`• Stereo Correlation: ±${novasTolerancas.stereo_correlation}`);
console.log(`• LRA: ±${novasTolerancas.lra} LU`);
console.log('\nBandas Espectrais:');
Object.entries(novasTolerancas.bands).forEach(([banda, tolerancia]) => {
    console.log(`  • ${banda}: ±${tolerancia} dB`);
});

// Atualizar arquivos JSON
const arquivosJson = [
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json',
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json'
];

for (const arquivo of arquivosJson) {
    console.log(`\n📂 Atualizando: ${arquivo}`);
    
    try {
        const conteudo = fs.readFileSync(arquivo, 'utf8');
        const dados = JSON.parse(conteudo);
        
        if (dados.funk_mandela) {
            // Atualizar tolerâncias principais
            if (dados.funk_mandela.legacy_compatibility) {
                const legacyComp = dados.funk_mandela.legacy_compatibility;
                
                // Verificar e atualizar cada tolerância
                if (legacyComp.tol_lufs !== undefined) {
                    console.log(`   tol_lufs: ${legacyComp.tol_lufs} → ${novasTolerancas.lufs_integrated}`);
                    legacyComp.tol_lufs = novasTolerancas.lufs_integrated;
                }
                
                if (legacyComp.tol_true_peak !== undefined) {
                    console.log(`   tol_true_peak: ${legacyComp.tol_true_peak} → ${novasTolerancas.true_peak_dbtp}`);
                    legacyComp.tol_true_peak = novasTolerancas.true_peak_dbtp;
                }
                
                if (legacyComp.tol_dr !== undefined) {
                    console.log(`   tol_dr: ${legacyComp.tol_dr} → ${novasTolerancas.dynamic_range}`);
                    legacyComp.tol_dr = novasTolerancas.dynamic_range;
                }
                
                if (legacyComp.tol_stereo !== undefined) {
                    console.log(`   tol_stereo: ${legacyComp.tol_stereo} → ${novasTolerancas.stereo_correlation}`);
                    legacyComp.tol_stereo = novasTolerancas.stereo_correlation;
                }
                
                if (legacyComp.tol_lra !== undefined) {
                    console.log(`   tol_lra: ${legacyComp.tol_lra} → ${novasTolerancas.lra}`);
                    legacyComp.tol_lra = novasTolerancas.lra;
                }
                
                // Atualizar bandas na seção legacy_compatibility
                if (legacyComp.bands) {
                    Object.entries(novasTolerancas.bands).forEach(([nomeBanda, novaTolerancia]) => {
                        if (legacyComp.bands[nomeBanda]) {
                            const valorAntigo = legacyComp.bands[nomeBanda].tol_db;
                            legacyComp.bands[nomeBanda].tol_db = novaTolerancia;
                            console.log(`   legacy.bands.${nomeBanda}.tol_db: ${valorAntigo} → ${novaTolerancia}`);
                        }
                    });
                }
            }
            
            // Atualizar seção flex.tolerance
            if (dados.funk_mandela.flex) {
                if (dados.funk_mandela.flex.lufs && dados.funk_mandela.flex.lufs.integrated) {
                    const valorAntigo = dados.funk_mandela.flex.lufs.integrated.tolerance;
                    dados.funk_mandela.flex.lufs.integrated.tolerance = novasTolerancas.lufs_integrated;
                    console.log(`   flex.lufs.integrated.tolerance: ${valorAntigo} → ${novasTolerancas.lufs_integrated}`);
                }
                
                // Atualizar bandas na seção tonalCurve
                if (dados.funk_mandela.flex.tonalCurve && dados.funk_mandela.flex.tonalCurve.bands) {
                    dados.funk_mandela.flex.tonalCurve.bands.forEach(banda => {
                        if (novasTolerancas.bands[banda.name]) {
                            const valorAntigo = banda.toleranceDb;
                            banda.toleranceDb = novasTolerancas.bands[banda.name];
                            console.log(`   tonalCurve.bands.${banda.name}.toleranceDb: ${valorAntigo} → ${banda.toleranceDb}`);
                        }
                    });
                }
            }
            
            // Atualizar timestamp e versão
            dados.funk_mandela.last_updated = new Date().toISOString();
            dados.funk_mandela.version = "2025-08-mandela-targets.4-tolerances-updated";
            
            // Salvar arquivo
            fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
            console.log(`   ✅ Arquivo atualizado com sucesso`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

console.log('\n' + '='.repeat(70));
console.log('✅ TOLERÂNCIAS JSON ATUALIZADAS CONCLUÍDAS');
console.log('🔄 Próximo: Atualizar valores embarcados no JavaScript');
console.log('=' .repeat(70));
