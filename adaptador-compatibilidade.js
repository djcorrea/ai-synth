// 🔧 ADAPTADOR PARA COMPATIBILIDADE DO SISTEMA DE AUDITORIA
// Garante que todos os componentes funcionem juntos corretamente

/**
 * 🎯 Adaptador para dados de referência
 * Converte o formato do funk_mandela.json para o formato esperado pelo sistema
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
  
  // Construir formato compatível
  const adaptedData = {
    // Bandas detalhadas (se existirem)
    bands: sourceData.bands || {},
    
    // Targets das bandas principais
    targets: sourceData.targets || {},
    
    // Tolerâncias (se existirem)
    tolerances: sourceData.tolerances || {},
    
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
