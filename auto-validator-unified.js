/**
 * 🎯 VALIDADOR AUTOMÁTICO DO SISTEMA UNIFICADO
 * 
 * Executa automaticamente validações completas ao carregar
 * Garante que o sistema está funcionando perfeitamente
 */

(function() {
    'use strict';
    
    // Aguardar carregamento completo
    function waitForUnifiedSystem() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo
            
            const checkSystem = () => {
                attempts++;
                
                if (window.calcularStatusSugestaoUnificado && 
                    window.STATUS_SUGGESTION_UNIFIED_V1 && 
                    window.applyUnifiedSystemPatches) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Sistema unificado não carregou em tempo hábil'));
                } else {
                    setTimeout(checkSystem, 100);
                }
            };
            
            checkSystem();
        });
    }
    
    // Validação automática completa
    async function executeFullValidation() {
        try {
            console.log('🎯 [AUTO-VALIDATOR] Iniciando validação completa...');
            
            // Aguardar sistema carregar
            await waitForUnifiedSystem();
            console.log('✅ [AUTO-VALIDATOR] Sistema unificado carregado');
            
            // Teste 1: Feature flag ativa
            if (!window.STATUS_SUGGESTION_UNIFIED_V1) {
                throw new Error('Feature flag não está ativa');
            }
            console.log('✅ [AUTO-VALIDATOR] Feature flag ativa');
            
            // Teste 2: Função principal disponível
            if (typeof window.calcularStatusSugestaoUnificado !== 'function') {
                throw new Error('Função principal não disponível');
            }
            console.log('✅ [AUTO-VALIDATOR] Função principal disponível');
            
            // Teste 3: Testes unitários automáticos
            const testResult = window.executarTestesUnificados();
            if (testResult.falhou > 0) {
                throw new Error(`${testResult.falhou} testes unitários falharam`);
            }
            console.log(`✅ [AUTO-VALIDATOR] Testes unitários: ${testResult.passou}/${testResult.total} passaram`);
            
            // Teste 4: Migração aplicada
            if (!window.createEnhancedDiffCellOriginal) {
                console.log('⚠️ [AUTO-VALIDATOR] Migração não detectada (normal se não havia função legacy)');
            } else {
                console.log('✅ [AUTO-VALIDATOR] Migração aplicada');
            }
            
            // Teste 5: Validação funcional específica
            const testCases = [
                { valor: -14.0, alvo: -14, tolerancia: 1, esperado: 'ideal' },
                { valor: -15.5, alvo: -14, tolerancia: 1, esperado: 'ajustar' },
                { valor: -17.0, alvo: -14, tolerancia: 1, esperado: 'corrigir' }
            ];
            
            for (const test of testCases) {
                const resultado = window.calcularStatusSugestaoUnificado(
                    test.valor, test.alvo, test.tolerancia, 'LUFS', 'Teste'
                );
                
                if (resultado.status !== test.esperado) {
                    throw new Error(`Teste funcional falhou: ${test.valor} → ${resultado.status}, esperado: ${test.esperado}`);
                }
                
                // Validar que ideal não gera sugestão
                if (test.esperado === 'ideal' && resultado.sugestao !== null) {
                    throw new Error('BUG: Status ideal gerou sugestão!');
                }
                
                // Validar que não-ideal gera sugestão
                if (test.esperado !== 'ideal' && resultado.sugestao === null) {
                    throw new Error('BUG: Status não-ideal não gerou sugestão!');
                }
            }
            console.log('✅ [AUTO-VALIDATOR] Validação funcional completa');
            
            // Teste 6: Performance básica
            const startTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                window.calcularStatusSugestaoUnificado(-14 + Math.random() * 10, -14, 1);
            }
            const endTime = performance.now();
            const avgTime = (endTime - startTime) / 1000;
            
            if (avgTime > 1) { // Mais de 1ms por chamada é suspeito
                console.warn(`⚠️ [AUTO-VALIDATOR] Performance suspeita: ${avgTime.toFixed(3)}ms/chamada`);
            } else {
                console.log(`✅ [AUTO-VALIDATOR] Performance OK: ${avgTime.toFixed(3)}ms/chamada`);
            }
            
            // Sucesso total
            console.log('🎉 [AUTO-VALIDATOR] SISTEMA UNIFICADO FUNCIONANDO PERFEITAMENTE!');
            
            // Disponibilizar status global
            window.UNIFIED_SYSTEM_STATUS = {
                active: true,
                validated: true,
                timestamp: new Date().toISOString(),
                version: 'V1',
                performance: `${avgTime.toFixed(3)}ms/call`
            };
            
            // Evento customizado para integração
            window.dispatchEvent(new CustomEvent('unifiedSystemReady', {
                detail: window.UNIFIED_SYSTEM_STATUS
            }));
            
        } catch (error) {
            console.error('❌ [AUTO-VALIDATOR] FALHA NA VALIDAÇÃO:', error);
            
            // Status de erro
            window.UNIFIED_SYSTEM_STATUS = {
                active: false,
                validated: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            // Tentar fallback para sistema legacy
            if (window.createEnhancedDiffCellOriginal) {
                window.createEnhancedDiffCell = window.createEnhancedDiffCellOriginal;
                console.log('🔄 [AUTO-VALIDATOR] Fallback para sistema legacy aplicado');
            }
            
            throw error;
        }
    }
    
    // Executar validação quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeFullValidation);
    } else {
        // DOM já carregado, executar imediatamente
        setTimeout(executeFullValidation, 500);
    }
    
    // Expor função para execução manual
    window.validateUnifiedSystem = executeFullValidation;
    
})();
