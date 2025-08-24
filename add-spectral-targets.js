#!/usr/bin/env node
/**
 * 🎼 ADICIONAR ALVOS DE PORCENTAGEM ESPECTRAL
 * 
 * Script para calcular e adicionar alvos de porcentagem de energia espectral
 * baseados nos valores dB existentes, preparando para o novo sistema.
 */

import fs from 'fs';
import path from 'path';

console.log('🎼 ADICIONANDO ALVOS DE PORCENTAGEM ESPECTRAL');
console.log('=' .repeat(70));

// Caminhos dos arquivos
const PATHS = {
    dev: 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json',
    prod: 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json'
};

// Configuração das bandas espectrais
const SPECTRAL_BANDS = [
    { name: 'sub', freqRange: [20, 60], displayName: 'Sub Bass' },
    { name: 'bass', freqRange: [60, 120], displayName: 'Bass' },
    { name: 'low_mid', freqRange: [120, 250], displayName: 'Low-Mid' },
    { name: 'mid', freqRange: [250, 1000], displayName: 'Mid' },
    { name: 'high_mid', freqRange: [1000, 4000], displayName: 'High-Mid' },
    { name: 'presence', freqRange: [4000, 8000], displayName: 'Presence' },
    { name: 'air', freqRange: [8000, 16000], displayName: 'Air' }
];

/**
 * Converter dB para porcentagem de energia relativa
 */
function dbToEnergyPercent(dbValues) {
    console.log('\n📊 CONVERTENDO dB PARA PORCENTAGEM DE ENERGIA:');
    
    // Converter dB para potência linear
    const linearPowers = {};
    let totalPower = 0;
    
    Object.entries(dbValues).forEach(([bandName, dbValue]) => {
        // Converter dB para potência linear (10^(dB/10))
        const linearPower = Math.pow(10, dbValue / 10);
        linearPowers[bandName] = linearPower;
        totalPower += linearPower;
        
        console.log(`${bandName}: ${dbValue} dB → ${linearPower.toExponential(3)} (linear)`);
    });
    
    // Converter para porcentagens
    const percentages = {};
    Object.entries(linearPowers).forEach(([bandName, power]) => {
        const percent = (power / totalPower) * 100;
        percentages[bandName] = percent;
        console.log(`${bandName}: ${percent.toFixed(2)}% da energia total`);
    });
    
    // Verificação
    const totalPercent = Object.values(percentages).reduce((sum, pct) => sum + pct, 0);
    console.log(`\n✅ Total: ${totalPercent.toFixed(2)}% (deve ser ~100%)`);
    
    return percentages;
}

/**
 * Processar arquivo JSON
 */
function processJsonFile(filePath) {
    console.log(`\n📁 PROCESSANDO: ${path.basename(filePath)}`);
    
    try {
        // Ler arquivo atual
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(jsonContent);
        
        if (!data.funk_mandela) {
            throw new Error('Estrutura funk_mandela não encontrada');
        }
        
        // Extrair valores dB das bandas existentes
        const bandsDb = {};
        const legacyBands = data.funk_mandela.legacy_compatibility?.bands;
        
        if (!legacyBands) {
            throw new Error('Bandas legacy não encontradas');
        }
        
        // Mapear bandas para o novo sistema
        const bandMapping = {
            'sub': 'sub',
            'low_bass': 'bass',        // 60-120 Hz (bass no novo sistema)
            'upper_bass': 'low_mid',   // Parte do low_mid no novo sistema
            'low_mid': 'low_mid',      // Manter low_mid
            'mid': 'mid',              // Manter mid
            'high_mid': 'high_mid',    // Manter high_mid  
            'brilho': 'presence',      // Mapear para presence
            'presenca': 'air'          // Mapear para air
        };
        
        // Combinar bandas similares (média ponderada)
        const combinedBands = {};
        Object.entries(bandMapping).forEach(([legacyName, newName]) => {
            const legacyBand = legacyBands[legacyName];
            if (legacyBand && typeof legacyBand.target_db === 'number') {
                if (!combinedBands[newName]) {
                    combinedBands[newName] = [];
                }
                combinedBands[newName].push(legacyBand.target_db);
            }
        });
        
        // Calcular médias para bandas combinadas
        Object.entries(combinedBands).forEach(([bandName, dbValues]) => {
            const avgDb = dbValues.reduce((sum, db) => sum + db, 0) / dbValues.length;
            bandsDb[bandName] = avgDb;
            console.log(`Banda ${bandName}: ${dbValues.length} fonte(s), média ${avgDb.toFixed(2)} dB`);
        });
        
        // Converter para porcentagens
        const energyPercents = dbToEnergyPercent(bandsDb);
        
        // Criar nova seção spectralBalance
        const spectralBalance = {
            version: "v1.0-percent-energy",
            method: "energy_percentage",
            measurement_lufs_target: -14.0,
            generated_at: new Date().toISOString(),
            note: "Porcentagens de energia espectral calculadas a partir dos alvos dB existentes. Sistema de medição interno usa % energia, UI exibe desvios em dB.",
            
            // Configuração das bandas
            bands: {},
            
            // Resumo (3 categorias)
            summary: {
                grave: {
                    bands: ['sub', 'bass'],
                    display_name: "Grave",
                    freq_range: [20, 120]
                },
                medio: {
                    bands: ['low_mid', 'mid'],
                    display_name: "Médio", 
                    freq_range: [120, 1000]
                },
                agudo: {
                    bands: ['high_mid', 'presence', 'air'],
                    display_name: "Agudo",
                    freq_range: [1000, 16000]
                }
            },
            
            // Tolerâncias
            tolerances: {
                default_pp: 2.5,  // Pontos percentuais padrão
                bands: {
                    sub: { tolerance_pp: 2.5 },
                    bass: { tolerance_pp: 2.5 },
                    low_mid: { tolerance_pp: 2.0 },
                    mid: { tolerance_pp: 1.5 },
                    high_mid: { tolerance_pp: 1.5 },
                    presence: { tolerance_pp: 2.0 },
                    air: { tolerance_pp: 2.5 }
                }
            }
        };
        
        // Adicionar informações das bandas
        SPECTRAL_BANDS.forEach(bandInfo => {
            const percent = energyPercents[bandInfo.name];
            if (percent !== undefined) {
                spectralBalance.bands[bandInfo.name] = {
                    target_energy_percent: percent,
                    freq_range: bandInfo.freqRange,
                    display_name: bandInfo.displayName,
                    tolerance_pp: spectralBalance.tolerances.bands[bandInfo.name]?.tolerance_pp || spectralBalance.tolerances.default_pp
                };
            }
        });
        
        // Calcular resumos (agregação por categoria)
        Object.entries(spectralBalance.summary).forEach(([category, categoryInfo]) => {
            let totalPercent = 0;
            categoryInfo.bands.forEach(bandName => {
                const bandPercent = energyPercents[bandName];
                if (bandPercent !== undefined) {
                    totalPercent += bandPercent;
                }
            });
            
            categoryInfo.target_energy_percent = totalPercent;
            console.log(`Categoria ${category}: ${totalPercent.toFixed(2)}% (${categoryInfo.bands.join(' + ')})`);
        });
        
        // Adicionar ao JSON principal
        data.funk_mandela.spectralBalance = spectralBalance;
        data.funk_mandela.last_updated = new Date().toISOString();
        data.funk_mandela.version = "2025-08-mandela-targets.5-spectral-percent";
        
        // Backup do arquivo original
        const backupPath = filePath.replace('.json', '_backup_spectral.json');
        fs.writeFileSync(backupPath, jsonContent);
        console.log(`📦 Backup criado: ${path.basename(backupPath)}`);
        
        // Escrever arquivo atualizado
        const updatedContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, updatedContent);
        
        console.log(`✅ Arquivo atualizado: ${path.basename(filePath)}`);
        console.log(`📊 ${Object.keys(spectralBalance.bands).length} bandas espectrais adicionadas`);
        console.log(`📋 ${Object.keys(spectralBalance.summary).length} categorias de resumo configuradas`);
        
        return spectralBalance;
        
    } catch (error) {
        console.log(`❌ Erro ao processar ${path.basename(filePath)}: ${error.message}`);
        return null;
    }
}

/**
 * Executar processamento
 */
async function main() {
    console.log('\n📋 VERIFICANDO ARQUIVOS:');
    
    // Verificar se arquivos existem
    for (const [env, filePath] of Object.entries(PATHS)) {
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${env}: ${path.basename(filePath)}`);
        } else {
            console.log(`❌ ${env}: ${path.basename(filePath)} - não encontrado`);
        }
    }
    
    // Processar arquivos
    const results = {};
    for (const [env, filePath] of Object.entries(PATHS)) {
        if (fs.existsSync(filePath)) {
            results[env] = processJsonFile(filePath);
        }
    }
    
    console.log('\n🎯 RESULTADOS FINAIS:');
    console.log('-'.repeat(50));
    
    Object.entries(results).forEach(([env, result]) => {
        if (result) {
            console.log(`✅ ${env}: Spectral Balance adicionado`);
            
            // Exibir alvos finais
            console.log(`   Bandas: ${Object.keys(result.bands).length}`);
            Object.entries(result.bands).forEach(([name, config]) => {
                console.log(`   ${name}: ${config.target_energy_percent.toFixed(2)}% (±${config.tolerance_pp}pp)`);
            });
        } else {
            console.log(`❌ ${env}: Falha no processamento`);
        }
    });
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se os valores de porcentagem fazem sentido');
    console.log('2. Testar integração com o novo módulo spectralBalance.ts');
    console.log('3. Implementar feature flag SPECTRAL_INTERNAL_MODE=percent');
    console.log('4. Validar UI continua funcionando com dados em dB');
    
    console.log('\n✨ PROCESSAMENTO CONCLUÍDO!');
}

// Executar
main().catch(error => {
    console.error(`❌ Erro fatal: ${error.message}`);
    process.exit(1);
});
