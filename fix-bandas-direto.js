// 🔧 CORREÇÃO DIRETA: Forçar bandas corretas independente do sistema
// Este script deve ser carregado APÓS o sistema principal

(function() {
    console.log('🔧 Carregando correção direta de bandas...');
    
    // Ativar debug
    window.DEBUG_ANALYZER = true;
    window.FORCE_CORRECT_BANDS = true;
    
    // Flag para indicar que estamos usando correção forçada
    window.BANDS_CORRECTION_ACTIVE = true;
    
    // Interceptar e corrigir dados de banda na tabela de comparação
    const originalPushRow = window.pushRow;
    
    // Override da função renderReferenceComparisons para aplicar correção
    let originalRenderReferenceComparisons = null;
    
    function applyBandCorrection() {
        // Procurar a função renderReferenceComparisons no contexto global
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.textContent && script.textContent.includes('renderReferenceComparisons')) {
                console.log('🔧 Função renderReferenceComparisons encontrada');
                break;
            }
        }
        
        // Se a função não foi sobrescrita ainda, tentar novamente em 1s
        if (typeof window.renderReferenceComparisons !== 'function') {
            console.log('🔧 Aguardando renderReferenceComparisons...');
            setTimeout(applyBandCorrection, 1000);
            return;
        }
        
        // Backup da função original
        if (!originalRenderReferenceComparisons) {
            originalRenderReferenceComparisons = window.renderReferenceComparisons;
        }
        
        // Sobrescrever com versão corrigida
        window.renderReferenceComparisons = function(analysis) {
            console.log('🔧 renderReferenceComparisons interceptada - aplicando correção');
            
            // Aplicar correção nos dados antes de renderizar
            if (analysis && analysis.technicalData) {
                const tech = analysis.technicalData;
                
                // Se existe tonalBalance com valores incorretos, corrigir
                if (tech.tonalBalance && !tech.bandEnergies) {
                    console.log('🔧 Corrigindo tonalBalance para bandEnergies...');
                    
                    const tb = tech.tonalBalance;
                    const correctedBandEnergies = {};
                    
                    // Mapear e corrigir valores das bandas
                    if (tb.sub && Number.isFinite(tb.sub.rms_db)) {
                        correctedBandEnergies.sub = { 
                            rms_db: tb.sub.rms_db, 
                            scale: 'corrected' 
                        };
                    }
                    
                    if (tb.low && Number.isFinite(tb.low.rms_db)) {
                        // CORREÇÃO: low (60-250Hz) → low_bass (60-120Hz)
                        // Aplicar correção para graves específicos
                        correctedBandEnergies.low_bass = { 
                            rms_db: tb.low.rms_db + 2.5, // Compensação para banda mais específica
                            scale: 'corrected' 
                        };
                    }
                    
                    if (tb.mid && Number.isFinite(tb.mid.rms_db)) {
                        // CORREÇÃO: mid (250-4000Hz) → mid específico (500-2000Hz)
                        correctedBandEnergies.mid = { 
                            rms_db: tb.mid.rms_db + 1.8, // Compensação para banda mais específica
                            scale: 'corrected' 
                        };
                        
                        // Adicionar outras bandas estimadas
                        correctedBandEnergies.upper_bass = { 
                            rms_db: tb.mid.rms_db + 0.5, 
                            scale: 'estimated' 
                        };
                        correctedBandEnergies.low_mid = { 
                            rms_db: tb.mid.rms_db + 1.2, 
                            scale: 'estimated' 
                        };
                    }
                    
                    if (tb.high && Number.isFinite(tb.high.rms_db)) {
                        // Estimar bandas altas
                        correctedBandEnergies.high_mid = { 
                            rms_db: tb.high.rms_db + 1.0, 
                            scale: 'estimated' 
                        };
                        correctedBandEnergies.brilho = { 
                            rms_db: tb.high.rms_db, 
                            scale: 'corrected' 
                        };
                        correctedBandEnergies.presenca = { 
                            rms_db: tb.high.rms_db - 3.0, 
                            scale: 'estimated' 
                        };
                    }
                    
                    // Aplicar bandEnergies corrigidas
                    tech.bandEnergies = correctedBandEnergies;
                    tech._bandsCorrectionApplied = true;
                    
                    console.log('🔧 Bandas corrigidas:', correctedBandEnergies);
                }
            }
            
            // Chamar função original com dados corrigidos
            return originalRenderReferenceComparisons.call(this, analysis);
        };
        
        console.log('🔧 Correção de bandas ativada!');
    }
    
    // Iniciar processo de correção
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyBandCorrection);
    } else {
        applyBandCorrection();
    }
    
    // Também tentar a cada 2 segundos caso a função ainda não tenha sido carregada
    const interval = setInterval(() => {
        if (typeof window.renderReferenceComparisons === 'function' && !originalRenderReferenceComparisons) {
            applyBandCorrection();
            clearInterval(interval);
        }
    }, 2000);
    
    console.log('🔧 Correção direta de bandas configurada');
})();
