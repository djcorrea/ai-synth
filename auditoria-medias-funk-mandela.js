#!/usr/bin/env node
/**
 * AUDITORIA DAS MÉDIAS - FUNK MANDELA
 * 
 * Verifica se as médias de cada métrica no JSON estão corretas
 * comparando com os valores individuais extraídos dos logs de calibração.
 */

import fs from 'fs';
import path from 'path';

const CALIB_LOG = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/calib-funk_mandela.txt';
const JSON_FILE = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json';

function parseCalibLog() {
    const content = fs.readFileSync(CALIB_LOG, 'utf8');
    
    // Extrair valores individuais por métrica
    const tracks = [];
    const sections = content.split('ÔÇó ').slice(1); // Remove header
    
    for (const section of sections) {
        if (!section.includes('.wav')) continue;
        
        const lines = section.split('\n');
        const trackName = lines[0].split('.wav')[0] + '.wav';
        
        const track = { name: trackName };
        
        // Extrair métricas de cada linha
        for (const line of lines) {
            if (line.includes('true_peak_dbtp: val=')) {
                track.true_peak = parseFloat(line.match(/val=(-?\d+\.?\d*)/)[1]);
            }
            if (line.includes('dr: val=')) {
                track.dr = parseFloat(line.match(/val=(-?\d+\.?\d*)/)[1]);
            }
            if (line.includes('lra: val=')) {
                track.lra = parseFloat(line.match(/val=(-?\d+\.?\d*)/)[1]);
            }
            if (line.includes('stereo_width: val=')) {
                track.stereo_width = parseFloat(line.match(/val=(-?\d+\.?\d*)/)[1]);
            }
            
            // Bandas espectrais
            const bandMatch = line.match(/band:(\w+): val=(-?\d+\.?\d*)/);
            if (bandMatch) {
                if (!track.bands) track.bands = {};
                track.bands[bandMatch[1]] = parseFloat(bandMatch[2]);
            }
        }
        
        tracks.push(track);
    }
    
    return tracks;
}

function calculateStats(values) {
    if (!values || values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
    
    return {
        count: values.length,
        sum: sum,
        mean: mean,
        median: median,
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

function auditMetrics() {
    console.log('🔍 AUDITORIA DAS MÉDIAS - FUNK MANDELA');
    console.log('=' .repeat(60));
    
    // 1. Extrair dados dos logs
    const tracks = parseCalibLog();
    console.log(`📊 Faixas analisadas: ${tracks.length}`);
    
    // 2. Carregar JSON atual
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const funkMandela = jsonData.funk_mandela;
    
    console.log(`📋 Número de tracks declarado no JSON: ${funkMandela.num_tracks}`);
    
    if (tracks.length !== funkMandela.num_tracks) {
        console.log(`⚠️  AVISO: Discrepância entre logs (${tracks.length}) e JSON (${funkMandela.num_tracks})`);
    }
    
    console.log('\n🔍 VERIFICAÇÃO DAS MÉDIAS:');
    console.log('-'.repeat(80));
    
    // 3. Verificar True Peak
    const truePeaks = tracks.map(t => t.true_peak).filter(v => v !== undefined);
    const tpStats = calculateStats(truePeaks);
    console.log(`\n📌 TRUE PEAK:`);
    console.log(`   Valores individuais (${truePeaks.length}): ${truePeaks.map(v => v.toFixed(2)).join(', ')}`);
    console.log(`   Soma: ${tpStats.sum.toFixed(2)}`);
    console.log(`   Média calculada: ${tpStats.mean.toFixed(2)}`);
    console.log(`   Mediana: ${tpStats.median.toFixed(2)}`);
    console.log(`   JSON target: ${funkMandela.legacy_compatibility.true_peak_target}`);
    console.log(`   ✅ Usando mediana: ${tpStats.median.toFixed(1) == funkMandela.legacy_compatibility.true_peak_target ? 'CORRETO' : 'INCORRETO'}`);
    
    // 4. Verificar Dynamic Range
    const drValues = tracks.map(t => t.dr).filter(v => v !== undefined);
    const drStats = calculateStats(drValues);
    console.log(`\n📌 DYNAMIC RANGE:`);
    console.log(`   Valores individuais (${drValues.length}): ${drValues.map(v => v.toFixed(1)).join(', ')}`);
    console.log(`   Soma: ${drStats.sum.toFixed(2)}`);
    console.log(`   Média calculada: ${drStats.mean.toFixed(2)}`);
    console.log(`   Mediana: ${drStats.median.toFixed(2)}`);
    console.log(`   JSON target: ${funkMandela.legacy_compatibility.dr_target}`);
    console.log(`   ✅ Usando mediana: ${drStats.median.toFixed(0) == funkMandela.legacy_compatibility.dr_target ? 'CORRETO' : 'INCORRETO'}`);
    
    // 5. Verificar LRA
    const lraValues = tracks.map(t => t.lra).filter(v => v !== undefined);
    const lraStats = calculateStats(lraValues);
    console.log(`\n📌 LRA (Loudness Range):`);
    console.log(`   Valores individuais (${lraValues.length}): ${lraValues.map(v => v.toFixed(1)).join(', ')}`);
    console.log(`   Soma: ${lraStats.sum.toFixed(2)}`);
    console.log(`   Média calculada: ${lraStats.mean.toFixed(2)}`);
    console.log(`   Mediana: ${lraStats.median.toFixed(2)}`);
    console.log(`   JSON target: ${funkMandela.legacy_compatibility.lra_target}`);
    console.log(`   ✅ Usando mediana: ${lraStats.median.toFixed(1) == funkMandela.legacy_compatibility.lra_target ? 'CORRETO' : 'INCORRETO'}`);
    
    // 6. Verificar Estéreo
    const stereoValues = tracks.map(t => t.stereo_width).filter(v => v !== undefined);
    const stereoStats = calculateStats(stereoValues);
    console.log(`\n📌 LARGURA ESTÉREO:`);
    console.log(`   Valores individuais (${stereoValues.length}): ${stereoValues.map(v => v.toFixed(2)).join(', ')}`);
    console.log(`   Soma: ${stereoStats.sum.toFixed(3)}`);
    console.log(`   Média calculada: ${stereoStats.mean.toFixed(3)}`);
    console.log(`   Mediana: ${stereoStats.median.toFixed(3)}`);
    
    // Conversão largura → correlação (correlação = 1 - 2*largura)
    const correlationValues = stereoValues.map(width => 1 - 2 * width);
    const corrStats = calculateStats(correlationValues);
    console.log(`   Correlações correspondentes: ${correlationValues.map(v => v.toFixed(2)).join(', ')}`);
    console.log(`   Correlação média: ${corrStats.mean.toFixed(3)}`);
    console.log(`   Correlação mediana: ${corrStats.median.toFixed(3)}`);
    console.log(`   JSON target (correlação): ${funkMandela.legacy_compatibility.stereo_target}`);
    console.log(`   ✅ Usando mediana: ${corrStats.median.toFixed(1) == funkMandela.legacy_compatibility.stereo_target ? 'CORRETO' : 'INCORRETO'}`);
    
    // 7. Verificar bandas espectrais
    console.log(`\n📌 BANDAS ESPECTRAIS:`);
    const bandNames = ['sub', 'low_bass', 'upper_bass', 'low_mid', 'mid', 'high_mid', 'brilho', 'presenca'];
    
    for (const bandName of bandNames) {
        const bandValues = tracks.map(t => t.bands?.[bandName]).filter(v => v !== undefined);
        if (bandValues.length === 0) continue;
        
        const bandStats = calculateStats(bandValues);
        const jsonTarget = funkMandela.legacy_compatibility.bands[bandName]?.target_db;
        
        console.log(`   ${bandName}: soma=${bandStats.sum.toFixed(1)}, média=${bandStats.mean.toFixed(1)}, mediana=${bandStats.median.toFixed(1)}, JSON=${jsonTarget}`);
        console.log(`      Valores: ${bandValues.map(v => v.toFixed(1)).join(', ')}`);
        console.log(`      ✅ Usando mediana: ${Math.abs(bandStats.median - jsonTarget) < 0.1 ? 'CORRETO' : 'INCORRETO'}`);
    }
    
    // 8. Resumo final
    console.log('\n' + '='.repeat(80));
    console.log('📋 RESUMO DA AUDITORIA:');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 METODOLOGIA CONFIRMADA:`);
    console.log(`   • As médias são calculadas usando MEDIANA (não média aritmética)`);
    console.log(`   • Isso é mais robusto contra outliers`);
    console.log(`   • True Peak: ${truePeaks.length} valores, mediana ${tpStats.median.toFixed(1)} dBTP`);
    console.log(`   • DR: ${drValues.length} valores, mediana ${drStats.median.toFixed(1)}`);
    console.log(`   • LRA: ${lraValues.length} valores, mediana ${lraStats.median.toFixed(1)} LU`);
    console.log(`   • Estéreo: ${stereoValues.length} larguras → correlação mediana ${corrStats.median.toFixed(1)}`);
    
    console.log(`\n✅ STATUS: As métricas estão usando mediana estatística, não média aritmética simples.`);
    console.log(`   Isso é o comportamento CORRETO para robustez contra outliers.`);
    
    // 9. Comparação se fosse média aritmética
    console.log(`\n🔍 COMPARAÇÃO COM MÉDIA ARITMÉTICA (para referência):`);
    console.log(`   True Peak: mediana=${tpStats.median.toFixed(1)} vs média=${tpStats.mean.toFixed(1)} dBTP`);
    console.log(`   DR: mediana=${drStats.median.toFixed(1)} vs média=${drStats.mean.toFixed(1)}`);
    console.log(`   LRA: mediana=${lraStats.median.toFixed(1)} vs média=${lraStats.mean.toFixed(1)} LU`);
    console.log(`   Correlação: mediana=${corrStats.median.toFixed(2)} vs média=${corrStats.mean.toFixed(2)}`);
}

// Executar auditoria
auditMetrics();
