// 🔧 ADAPTADOR PARA COMPATIBILIDADE DO SISTEMA DE AUDITORIA
// Garante que todos os componentes funcionem juntos corretamente

/**
 * 🎯 Adaptador para dados de referência
 * Converte o formato do funk_mandela.json para o formato esperado pelo sistema de scoring
 */
function adaptReferenceData(rawData) {
  // Se já está no formato correto, retorna direto
  if (rawData.bands && rawData.targets && rawData.tolerances) {
    return rawData;
  }
  
  // Se está encapsulado no funk_mandela, extrai
  const sourceData = rawData.funk_mandela || rawData;
  
  if (!sourceData) {
    console.error('❌ Dados de referência não encontrados');
    return null;
  }
  
  // 🔧 CONVERSÃO PARA FORMATO SCORING
  // O scoring.js espera bands com { target_db, tol_db } ou { target_db, tol_min, tol_max }
  const bands = {};
  const sourceBands = sourceData.bands || sourceData.spectralBalance?.bands || {};
  const tolerances = sourceData.tolerances || sourceData.spectralBalance?.tolerances || {};
  
  // Converter cada banda para o formato esperado
  for (const [bandName, bandData] of Object.entries(sourceBands)) {
    if (typeof bandData === 'number') {
      // Se é só um número, assumir como target
      bands[bandName] = {
        target_db: bandData,
        tol_db: tolerances[bandName] || 2.0  // tolerância padrão
      };
    } else if (bandData && typeof bandData === 'object') {
      // Se já é objeto, adaptar campos
      bands[bandName] = {
        target_db: bandData.target_db || bandData.target || bandData.value,
        tol_db: bandData.tol_db || bandData.tolerance || tolerances[bandName] || 2.0,
        tol_min: bandData.tol_min,
        tol_max: bandData.tol_max
      };
    }
  }
  
  // Construir formato compatível
  const adaptedData = {
    // ✅ Bandas no formato que scoring.js espera
    bands: bands,
    
    // Targets das bandas principais
    targets: sourceData.targets || {},
    
    // Tolerâncias (se existirem)
    tolerances: tolerances,
    
    // Dados fixos (LUFS, True Peak, etc.)
    fixed: sourceData.fixed || {},
    
    // Estatísticas
    stats: sourceData.stats || {},
    
    // Metadados
    version: sourceData.version,
    num_tracks: sourceData.num_tracks,
    generated_at: sourceData.generated_at
  };
  
  console.log('✅ Dados de referência adaptados:', {
    bands: Object.keys(adaptedData.bands).length,
    targets: Object.keys(adaptedData.targets?.bands || {}).length,
    hasFixed: !!adaptedData.fixed,
    hasStats: !!adaptedData.stats
  });
  
  return adaptedData;
}

/**
 * 🎵 Adaptador para dados de áudio
 * Garante que os dados estão no formato correto para análise
 */
function adaptAudioData(audioData) {
  if (!audioData) return null;
  
  // Formato padrão esperado pelo sistema
  const adapted = {
    sampleRate: audioData.sampleRate || 44100,
    spectrum: audioData.spectrum || [],
    rms: audioData.rms || 0,
    peak: audioData.peak || 0,
    duration: audioData.duration || 0,
    
    // Campos opcionais que podem existir
    loudness: audioData.loudness,
    bandEnergies: audioData.bandEnergies,
    dynamicRange: audioData.dynamicRange,
    truePeak: audioData.truePeak
  };
  
  return adapted;
}

/**
 * 📊 Adaptador para resultado de scoring
 * Garante que o resultado tem todos os campos necessários
 */
function adaptScoringResult(result) {
  if (!result) return null;
  
  // Garantir que tem o campo principal de score
  const adapted = {
    ...result,
    advancedScorePct: result.advancedScorePct || result.scorePct || result.score || 0,
    scorePct: result.scorePct || result.advancedScorePct || result.score || 0,
    version: result.version || 'unknown'
  };
  
  return adapted;
}

/**
 * 🔄 Função principal de teste seguro
 * Executa um teste de scoring com todas as validações
 */
async function safeScoringTest(scoringModule, refDataRaw) {
  try {
    console.log('🔧 Iniciando teste seguro de scoring...');
    
    // 1. Adaptar dados de referência
    const refData = adaptReferenceData(refDataRaw);
    if (!refData) {
      throw new Error('Dados de referência inválidos');
    }
    
    // 2. Criar dados de teste
    const testAudioData = adaptAudioData({
      sampleRate: 44100,
      spectrum: new Array(512).fill(0).map(() => Math.random() * 0.5),
      rms: 0.3,
      peak: 0.7,
      duration: 120000
    });
    
    // 3. Executar scoring
    console.log('🎯 Executando computeMixScore...');
    const rawResult = scoringModule.computeMixScore(testAudioData, refData);
    
    // 4. Adaptar resultado
    const result = adaptScoringResult(rawResult);
    
    console.log('✅ Teste de scoring concluído:', {
      hasResult: !!result,
      score: result?.advancedScorePct,
      version: result?.version
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no teste seguro:', error.message);
    return null;
  }
}

/**
 * 🎯 Adaptador para dados de áudio
 * Converte spectralBalance.bands para bandEnergies que o scoring espera
 */
function adaptAudioData(audioData) {
  if (!audioData) return audioData;
  
  // Se já tem bandEnergies, retorna direto
  if (audioData.bandEnergies) {
    return audioData;
  }
  
  // Converte spectralBalance.bands para bandEnergies
  if (audioData.spectralBalance && audioData.spectralBalance.bands) {
    const bandEnergies = {};
    
    for (const [bandName, value] of Object.entries(audioData.spectralBalance.bands)) {
      if (typeof value === 'number') {
        // Converter valor direto para formato rms_db
        bandEnergies[bandName] = { 
          rms_db: value 
        };
      } else if (value && typeof value === 'object') {
        // Se já é objeto, preservar estrutura
        bandEnergies[bandName] = value;
      }
    }
    
    // Retornar dados adaptados
    return {
      ...audioData,
      bandEnergies: bandEnergies
    };
  }
  
  return audioData;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.adaptReferenceData = adaptReferenceData;
  window.adaptAudioData = adaptAudioData;
  window.adaptScoringResult = adaptScoringResult;
  window.safeScoringTest = safeScoringTest;
}

export {
  adaptReferenceData,
  adaptAudioData,
  adaptScoringResult,
  safeScoringTest
};
