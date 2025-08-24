/**
 * 🎯 ATUALIZAR REFERÊNCIAS - Adicionar porcentagens espectrais V2
 * Script para calcu    // Adicionar seção V2 específica
    const lowPercent = (percentages.sub || 0) + (percentages.low_bass || 0) + (percentages.upper_bass || 0);
    const midPercent = (percentages.low_mid || 0) + (percentages.mid || 0);
    const highPercent = (percentages.high_mid || 0) + (percentages.brilho || 0) + (percentages.presenca || 0);
    
    updatedData.funk_mandela.spectral_v2 = {
      version: "2025-08-spectral-v2",
      mode: "percent",
      generated_at: new Date().toISOString(),
      bands_percent: percentages,
      summary_3bands: {
        low_percent: Math.round(lowPercent * 100) / 100,
        mid_percent: Math.round(midPercent * 100) / 100,
        high_percent: Math.round(highPercent * 100) / 100
      },
      conversion_info: {
        source: "converted_from_db_targets",
        method: "linear_weight_normalization",
        note: "Conversão matemática de targets dB para distribuição percentual relativa"
      }
    };arget_percent às referências existentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 Caminhos dos arquivos
const REF_FILE = path.join(__dirname, 'refs', 'out', 'funk_mandela_backup_spectral.json');
const OUTPUT_FILE = path.join(__dirname, 'refs', 'out', 'funk_mandela_spectral_v2.json');

// 🎛️ Função para converter dB para porcentagem relativa
function convertDBToPercent(bands) {
  console.log('🔄 Convertendo targets dB para porcentagens...');
  
  // Calcular peso linear de cada banda
  const linearWeights = {};
  let totalWeight = 0;
  
  for (const [bandName, bandData] of Object.entries(bands)) {
    if (bandData.target_db && Number.isFinite(bandData.target_db)) {
      // Converter dB para peso linear (energia)
      const linear = Math.pow(10, bandData.target_db / 10);
      // Evitar valores muito pequenos/negativos
      const weight = Math.max(0.001, linear);
      linearWeights[bandName] = weight;
      totalWeight += weight;
    }
  }
  
  console.log('📊 Pesos lineares:', linearWeights);
  console.log('📈 Peso total:', totalWeight);
  
  // Converter pesos para porcentagens
  const percentages = {};
  for (const [bandName, weight] of Object.entries(linearWeights)) {
    const percent = (weight / totalWeight) * 100;
    percentages[bandName] = Math.round(percent * 100) / 100; // Arredondar 2 casas
  }
  
  console.log('🎯 Porcentagens calculadas:', percentages);
  
  // Verificar se soma 100%
  const totalPercent = Object.values(percentages).reduce((sum, pct) => sum + pct, 0);
  console.log('✅ Total das porcentagens:', totalPercent.toFixed(2) + '%');
  
  return percentages;
}

// 🎯 Função principal
function updateSpectralReferences() {
  try {
    console.log('🎵 Iniciando atualização das referências espectrais...');
    
    // Ler arquivo atual
    if (!fs.existsSync(REF_FILE)) {
      console.error('❌ Arquivo de referência não encontrado:', REF_FILE);
      return;
    }
    
    const rawData = fs.readFileSync(REF_FILE, 'utf-8');
    const refData = JSON.parse(rawData);
    
    console.log('📖 Arquivo carregado:', REF_FILE);
    
    // Navegar para as bandas do funk_mandela
    if (!refData.funk_mandela || !refData.funk_mandela.flex || !refData.funk_mandela.flex.tonalCurve || !refData.funk_mandela.flex.tonalCurve.bands) {
      console.error('❌ Estrutura de bandas não encontrada no JSON');
      return;
    }
    
    const bands = {};
    refData.funk_mandela.flex.tonalCurve.bands.forEach(band => {
      bands[band.name] = {
        target_db: band.target_db,
        toleranceDb: band.toleranceDb || band.tol_db
      };
    });
    
    console.log('🎪 Bandas encontradas:', Object.keys(bands));
    
    // Calcular porcentagens
    const percentages = convertDBToPercent(bands);
    
    // Atualizar estrutura com porcentagens
    const updatedData = JSON.parse(JSON.stringify(refData)); // Deep clone
    
    // Adicionar seção V2 específica
    updatedData.funk_mandela.spectral_v2 = {
      version: "2025-08-spectral-v2",
      mode: "percent",
      generated_at: new Date().toISOString(),
      bands_percent: percentages,
      summary_3bands: {
        low_percent: (percentages.sub || 0) + (percentages.bass || 0) + (percentages.low_bass || 0),
        mid_percent: (percentages.low_mid || 0) + (percentages.mid || 0),
        high_percent: (percentages.high_mid || 0) + (percentages.presence || 0) + (percentages.brilho || 0)
      },
      conversion_info: {
        source: "converted_from_db_targets",
        method: "linear_weight_normalization",
        note: "Conversão matemática de targets dB para distribuição percentual relativa"
      }
    };
    
    // Adicionar target_percent às bandas existentes
    updatedData.funk_mandela.flex.tonalCurve.bands.forEach(band => {
      const percent = percentages[band.name];
      if (percent !== undefined) {
        band.target_percent = percent;
        console.log(`➡️ ${band.name}: ${band.target_db}dB → ${percent}%`);
      }
    });
    
    // Atualizar timestamp geral
    updatedData.funk_mandela.last_updated = new Date().toISOString();
    updatedData.funk_mandela.version = updatedData.funk_mandela.version + "-spectral-v2";
    
    // Salvar arquivo atualizado
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedData, null, 2));
    console.log('✅ Arquivo atualizado salvo:', OUTPUT_FILE);
    
    // Relatório final
    console.log('\n📊 RELATÓRIO DE CONVERSÃO:');
    console.log('='.repeat(50));
    Object.entries(percentages).forEach(([band, percent]) => {
      const originalDB = bands[band]?.target_db;
      console.log(`${band.padEnd(12)} ${originalDB}dB → ${percent.toFixed(2)}%`);
    });
    console.log('='.repeat(50));
    console.log(`Total: ${Object.values(percentages).reduce((sum, pct) => sum + pct, 0).toFixed(2)}%`);
    
    // Validação das 3 bandas
    const summary = updatedData.funk_mandela.spectral_v2.summary_3bands;
    console.log('\n🎯 RESUMO 3 BANDAS:');
    console.log(`Graves: ${summary.low_percent.toFixed(1)}%`);
    console.log(`Médios: ${summary.mid_percent.toFixed(1)}%`);
    console.log(`Agudos: ${summary.high_percent.toFixed(1)}%`);
    console.log(`Total: ${(summary.low_percent + summary.mid_percent + summary.high_percent).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Erro durante atualização:', error);
  }
}

// 🎬 Executar automaticamente
updateSpectralReferences();

export { updateSpectralReferences, convertDBToPercent };
