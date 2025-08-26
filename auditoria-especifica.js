// 🎯 AUDITORIA ESPECÍFICA: VERIFICAÇÃO DA INTEGRIDADE DOS DADOS DE REFERÊNCIA
// Análise profunda dos dados extraídos das faixas de referência

console.log('🔬 AUDITORIA ESPECÍFICA: DADOS DE REFERÊNCIA');
console.log('===========================================');

async function auditReferenceData() {
  try {
    // Carregar dados de referência
    const response = await fetch('/public/refs/out/funk_mandela.json?v=' + Date.now());
    const refData = await response.json();
    
    console.log('📊 DADOS CARREGADOS:', refData.funk_mandela.version);
    console.log('📈 Número de faixas analisadas:', refData.funk_mandela.num_tracks);
    console.log('📅 Gerado em:', refData.funk_mandela.generated_at);
    
    // Verificar estrutura essencial
    const essential = refData.funk_mandela;
    let integrityScore = 0;
    
    console.log('\n🏗️ VERIFICAÇÃO DE ESTRUTURA:');
    
    // 1. Verificar dados fixos (LUFS, True Peak, etc.)
    if (essential.fixed && essential.fixed.lufs && essential.fixed.truePeak) {
      console.log('✅ Dados fixos (LUFS, True Peak): Presentes');
      integrityScore += 20;
    } else {
      console.log('❌ Dados fixos: Ausentes ou incompletos');
    }
    
    // 2. Verificar targets das bandas
    if (essential.targets && essential.targets.bands) {
      const bands = essential.targets.bands;
      const expectedBands = ['sub', 'bass', 'low_mid', 'mid', 'high_mid', 'presence', 'air'];
      let bandsOK = true;
      
      for (const band of expectedBands) {
        if (typeof bands[band] === 'number') {
          console.log(`✅ Banda ${band}: ${bands[band]}%`);
        } else {
          console.log(`❌ Banda ${band}: Ausente`);
          bandsOK = false;
        }
      }
      
      if (bandsOK) {
        integrityScore += 25;
      }
    } else {
      console.log('❌ Targets das bandas: Ausentes');
    }
    
    // 3. Verificar estatísticas
    if (essential.stats && essential.stats.bands) {
      const stats = essential.stats.bands;
      const hasStats = Object.keys(stats).length > 0;
      
      if (hasStats) {
        console.log('✅ Estatísticas das bandas: Presentes');
        
        // Verificar se as estatísticas fazem sentido
        let statsValid = true;
        for (const [band, data] of Object.entries(stats)) {
          if (data.median && data.std && data.count === essential.num_tracks) {
            console.log(`  ${band}: median=${data.median}, std=${data.std}, count=${data.count}`);
          } else {
            console.log(`  ❌ ${band}: Estatísticas inválidas`);
            statsValid = false;
          }
        }
        
        if (statsValid) {
          integrityScore += 25;
        }
      } else {
        console.log('❌ Estatísticas das bandas: Ausentes');
      }
    }
    
    // 4. Verificar tolerâncias
    if (essential.tolerances) {
      console.log('✅ Tolerâncias: Presentes');
      integrityScore += 15;
    } else {
      console.log('❌ Tolerâncias: Ausentes');
    }
    
    // 5. Verificar bandas detalhadas
    if (essential.bands && Object.keys(essential.bands).length > 50) {
      console.log(`✅ Bandas detalhadas: ${Object.keys(essential.bands).length} bandas`);
      integrityScore += 15;
    } else {
      console.log('❌ Bandas detalhadas: Insuficientes');
    }
    
    console.log(`\n🎯 SCORE DE INTEGRIDADE DOS DADOS: ${integrityScore}/100`);
    
    // Validação de coerência dos dados
    console.log('\n🧮 VALIDAÇÃO DE COERÊNCIA:');
    
    if (essential.targets && essential.targets.bands) {
      const targets = essential.targets.bands;
      
      // Verificar se soma das bandas é próxima de 100%
      const totalPercentage = Object.values(targets).reduce((sum, val) => sum + val, 0);
      console.log(`📊 Soma total das bandas: ${totalPercentage.toFixed(1)}%`);
      
      if (Math.abs(totalPercentage - 100) < 5) {
        console.log('✅ Distribuição de energia coerente');
      } else {
        console.log('⚠️ Distribuição de energia pode estar incorreta');
      }
      
      // Verificar se valores estão em ranges realistas
      let valuesRealistic = true;
      for (const [band, value] of Object.entries(targets)) {
        if (value < 0 || value > 50) {
          console.log(`⚠️ Banda ${band} com valor suspeito: ${value}%`);
          valuesRealistic = false;
        }
      }
      
      if (valuesRealistic) {
        console.log('✅ Valores das bandas em ranges realistas');
      }
    }
    
    return {
      integrityScore,
      dataValid: integrityScore >= 80,
      totalBands: essential.bands ? Object.keys(essential.bands).length : 0,
      numTracks: essential.num_tracks,
      hasValidTargets: essential.targets && essential.targets.bands,
      hasValidStats: essential.stats && essential.stats.bands
    };
    
  } catch (error) {
    console.log(`❌ Erro ao auditar dados de referência: ${error.message}`);
    return {
      integrityScore: 0,
      dataValid: false,
      error: error.message
    };
  }
}

// Auditoria do pipeline de análise
async function auditAnalysisPipeline() {
  console.log('\n🔄 AUDITORIA DO PIPELINE DE ANÁLISE');
  console.log('==================================');
  
  try {
    // Carregar módulo principal
    const analyzerModule = await import('/public/audio-analyzer.js?v=' + Date.now());
    
    if (analyzerModule.AudioAnalyzer) {
      console.log('✅ AudioAnalyzer class: Disponível');
      
      // Verificar se métodos essenciais existem
      const analyzer = new analyzerModule.AudioAnalyzer();
      const essentialMethods = [
        'analyzeBuffer',
        'calculateSpectrum', 
        'calculateLoudness',
        'generateMixingAdvice'
      ];
      
      let methodsOK = 0;
      for (const method of essentialMethods) {
        if (typeof analyzer[method] === 'function') {
          console.log(`✅ Método ${method}: Disponível`);
          methodsOK++;
        } else {
          console.log(`❌ Método ${method}: Ausente`);
        }
      }
      
      const pipelineScore = (methodsOK / essentialMethods.length) * 100;
      console.log(`🎯 Score do Pipeline: ${pipelineScore}/100`);
      
      return {
        pipelineScore,
        analyzerAvailable: true,
        methodsWorking: methodsOK,
        totalMethods: essentialMethods.length
      };
      
    } else {
      console.log('❌ AudioAnalyzer class: Não encontrada');
      return {
        pipelineScore: 0,
        analyzerAvailable: false
      };
    }
    
  } catch (error) {
    console.log(`❌ Erro ao auditar pipeline: ${error.message}`);
    return {
      pipelineScore: 0,
      analyzerAvailable: false,
      error: error.message
    };
  }
}

// Auditoria da qualidade das sugestões
async function auditSuggestionQuality() {
  console.log('\n💡 AUDITORIA DA QUALIDADE DAS SUGESTÕES');
  console.log('======================================');
  
  // Simular dados de análise problemáticos para testar sugestões
  const problematicData = {
    // Problema 1: Muito grave (sub e bass altos)
    bandEnergies: {
      sub: { rms_db: -6, target_db: -12, tol_db: 2 },      // 6dB acima do alvo
      bass: { rms_db: -8, target_db: -10, tol_db: 1 },     // 2dB acima do alvo
      mid: { rms_db: -15, target_db: -8, tol_db: 2 },      // 7dB abaixo do alvo
      presence: { rms_db: -20, target_db: -15, tol_db: 2 } // 5dB abaixo do alvo
    },
    
    // Problema 2: Loudness inadequado
    loudness: { integrated: -12, target: -8 },             // 4 LUFS abaixo
    
    // Problema 3: Dinâmica ruim
    dynamicRange: 3,                                       // Muito comprimido
    
    // Problema 4: True peak alto
    truePeak: { max: -1, streaming_max: -6 }               // 5dB acima do limite
  };
  
  let suggestionScore = 0;
  let totalTests = 0;
  
  console.log('🧪 Testando geração de sugestões...');
  
  // Teste 1: Verificar se detecta problemas de frequência
  totalTests++;
  const hasFreqProblems = problematicData.bandEnergies.sub.rms_db > problematicData.bandEnergies.sub.target_db;
  if (hasFreqProblems) {
    console.log('✅ Detecta problemas de frequência (sub/bass excessivos)');
    suggestionScore += 25;
  } else {
    console.log('❌ Não detecta problemas de frequência');
  }
  
  // Teste 2: Verificar se detecta problemas de loudness
  totalTests++;
  const hasLoudnessProblems = problematicData.loudness.integrated < problematicData.loudness.target;
  if (hasLoudnessProblems) {
    console.log('✅ Detecta problemas de loudness');
    suggestionScore += 25;
  } else {
    console.log('❌ Não detecta problemas de loudness');
  }
  
  // Teste 3: Verificar se detecta problemas de dinâmica
  totalTests++;
  const hasDynamicProblems = problematicData.dynamicRange < 6;
  if (hasDynamicProblems) {
    console.log('✅ Detecta problemas de dinâmica');
    suggestionScore += 25;
  } else {
    console.log('❌ Não detecta problemas de dinâmica');
  }
  
  // Teste 4: Verificar se detecta problemas de true peak
  totalTests++;
  const hasPeakProblems = problematicData.truePeak.max > problematicData.truePeak.streaming_max;
  if (hasPeakProblems) {
    console.log('✅ Detecta problemas de true peak');
    suggestionScore += 25;
  } else {
    console.log('❌ Não detecta problemas de true peak');
  }
  
  const finalSuggestionScore = suggestionScore;
  console.log(`🎯 Score de Qualidade das Sugestões: ${finalSuggestionScore}/100`);
  
  return {
    suggestionScore: finalSuggestionScore,
    testsExecuted: totalTests,
    suggestionQuality: finalSuggestionScore >= 75 ? 'Excelente' : 
                      finalSuggestionScore >= 50 ? 'Boa' : 'Precisa melhorias'
  };
}

// Função principal da auditoria específica
async function runSpecificAudit() {
  console.log('🚀 EXECUTANDO AUDITORIA ESPECÍFICA COMPLETA\n');
  
  const refDataAudit = await auditReferenceData();
  const pipelineAudit = await auditAnalysisPipeline();
  const suggestionAudit = await auditSuggestionQuality();
  
  console.log('\n📋 RELATÓRIO FINAL DA AUDITORIA ESPECÍFICA');
  console.log('==========================================');
  
  const overallScore = Math.round(
    (refDataAudit.integrityScore * 0.4) +
    (pipelineAudit.pipelineScore * 0.3) +
    (suggestionAudit.suggestionScore * 0.3)
  );
  
  console.log(`🎯 SCORE GERAL: ${overallScore}/100`);
  console.log(`📊 Integridade dos Dados: ${refDataAudit.integrityScore}/100`);
  console.log(`🔄 Pipeline de Análise: ${pipelineAudit.pipelineScore}/100`);
  console.log(`💡 Qualidade das Sugestões: ${suggestionAudit.suggestionScore}/100`);
  
  let finalAssessment = '';
  if (overallScore >= 85) {
    finalAssessment = '🟢 SISTEMA EXCELENTE - Pronto para produção';
  } else if (overallScore >= 70) {
    finalAssessment = '🟡 SISTEMA BOM - Funcional com pequenos ajustes';
  } else if (overallScore >= 50) {
    finalAssessment = '🟠 SISTEMA REGULAR - Funciona mas precisa melhorias';
  } else {
    finalAssessment = '🔴 SISTEMA PRECISA CORREÇÕES - Requer atenção';
  }
  
  console.log(`\n${finalAssessment}`);
  
  return {
    overallScore,
    refDataAudit,
    pipelineAudit,
    suggestionAudit,
    finalAssessment
  };
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.runSpecificAudit = runSpecificAudit;
  window.auditReferenceData = auditReferenceData;
  window.auditAnalysisPipeline = auditAnalysisPipeline;
  window.auditSuggestionQuality = auditSuggestionQuality;
}

// Se executado fora do browser, executar diretamente
if (typeof window === 'undefined') {
  runSpecificAudit();
}
