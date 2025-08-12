// 🎵 AUDIO ANALYZER V2 - VERSÃO FINAL COM REFERÊNCIAS SÍNCRONAS E SEM CONFLITOS
class AudioAnalyzerV2 {
    constructor() {
        this.__buildVersion = 'v2.5.0-FINAL-REFERENCIAS-SEM-CONFLITOS-2025';
        this.audioContext = null;
        this.isInitialized = false;
        
        console.log('🎯 AudioAnalyzerV2 construído - Build:', this.__buildVersion);
    }

    async initialize() {
        if (this.isInitialized) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = true;
        
        console.log('✅ V2 inicializado');
    }

    async analyzeAudioFile(file) {
        // Método compatível com V1 para integration.js
        const arrayBuffer = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsArrayBuffer(file);
        });
        
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return await this.performFullAnalysis(audioBuffer);
    }

    async performFullAnalysis(audioBuffer, options = {}) {
        console.log('🔥 V2 Análise COMPLETA iniciada');
        
        try {
            await this.initialize();
            
            // Extrair métricas básicas
            const leftChannel = audioBuffer.getChannelData(0);
            const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
            
            // Calcular LUFS básico
            let sumSquares = 0;
            for (let i = 0; i < leftChannel.length; i++) {
                const sample = (leftChannel[i] + (rightChannel[i] || 0)) / 2;
                sumSquares += sample * sample;
            }
            const rms = Math.sqrt(sumSquares / leftChannel.length);
            const lufs = 20 * Math.log10(rms) - 0.691;
            
            // Calcular peak
            let peak = 0;
            for (let i = 0; i < leftChannel.length; i++) {
                peak = Math.max(peak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i] || 0));
            }
            const peakDb = 20 * Math.log10(peak);
            
            // Dynamic range básico
            const dynamicRange = Math.abs(peakDb - lufs);
            
            const metrics = { lufs, peak: peakDb, dynamicRange };
            
            // Gerar diagnósticos com sistema de referência
            const diagnostics = this.generateDiagnostics(audioBuffer, metrics);
            
            const result = {
                buildVersion: this.__buildVersion,
                timestamp: new Date().toISOString(),
                metrics: {
                    lufs: parseFloat(lufs.toFixed(1)),
                    peakDb: parseFloat(peakDb.toFixed(1)),
                    dynamicRange: parseFloat(dynamicRange.toFixed(1))
                },
                diagnostics,
                qualityOverall: Math.max(0, Math.min(100, 85 - Math.abs(lufs + 14) * 3))
            };
            
            console.log('✅ V2 análise concluída:', {
                lufs: lufs.toFixed(1),
                peak: peakDb.toFixed(1),
                diagnostics: !!result.diagnostics,
                refEvidence: result.diagnostics?.__refEvidence
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro na análise V2:', error);
            throw error;
        }
    }

    // 🩺 Gerar diagnósticos com sistema de referência SÍNCRONO
    generateDiagnostics(audioBuffer, metrics) {
        console.log('🩺 Gerando diagnósticos V2...');
        console.log('🔍 window.PROD_AI_REF_GENRE:', window.PROD_AI_REF_GENRE);
        
        const problems = [];
        const suggestions = [];
        let __refEvidence = false;
        
        // ===== NOVO SISTEMA DE REFERÊNCIAS DINÂMICO =====
        if (typeof window !== 'undefined') {
            if (!window.PROD_AI_REF_GENRE) window.PROD_AI_REF_GENRE = 'trance';
            const genre = String(window.PROD_AI_REF_GENRE).trim().toLowerCase();
            const refData = window.PROD_AI_REF_DATA;
            if (refData && typeof refData === 'object') {
                __refEvidence = true;
                const targetLufs = refData.lufs_target;
                const tolLufs = refData.tol_lufs || 0; 
                const targetDR = refData.dr_target;
                const tolDR = refData.tol_dr || 0;
                const targetLRA = refData.lra_target;
                const tolLRA = refData.tol_lra || 0;
                const targetStereo = refData.stereo_target;
                const tolStereo = refData.tol_stereo || 0;

                // Comparações principais
                const check = (val, target, tol, type, label, unit='') => {
                    if (!Number.isFinite(val) || !Number.isFinite(target)) return;
                    const diff = val - target;
                    if (Math.abs(diff) > (tol || 0)) {
                        const direction = diff > 0 ? 'acima' : 'abaixo';
                        suggestions.push({
                            type,
                            message: `${label} ${direction} do alvo (${target}${unit})`,
                            action: `Ajustar ${label} ${direction==='acima'?'para baixo':'para cima'} ~${target}${unit}`,
                            details: `Diferença: ${diff.toFixed(2)}${unit} • tolerância ±${tol}${unit} • gênero: ${genre}`
                        });
                    }
                };
                check(metrics.lufs, targetLufs, tolLufs, 'reference_loudness', 'LUFS', '');
                check(metrics.dynamicRange, targetDR, tolDR, 'reference_dynamics', 'DR', ' dB');

                // LRA (quando disponível em métricas V1 não temos; será enriquecido em V2 adapter se presente)
                if (metrics.lra != null) check(metrics.lra, targetLRA, tolLRA, 'reference_lra', 'LRA', ' dB');

                // Stereo (placeholder, pois V1/V2 adaptam correlation/width; aqui usamos correlation se existir em metrics.stereo)
                if (metrics.stereoCorrelation != null) check(metrics.stereoCorrelation, targetStereo, tolStereo, 'reference_stereo', 'Stereo Corr', '');

                console.log('📊 Referências dinâmicas usadas:', {
                    genre,
                    lufs_target: targetLufs,
                    dr_target: targetDR
                });
            } else {
                console.log('ℹ️ Referências não carregadas ainda para gênero', genre);
            }
        }

        // Verificar problemas básicos
        if (metrics.lufs > -6) {
            problems.push({
                type: 'loudness_too_high',
                severity: 'high',
                message: 'Áudio muito alto - pode causar distorção'
            });
        }
        
        if (metrics.lufs < -30) {
            problems.push({
                type: 'loudness_too_low',
                severity: 'medium',
                message: 'Áudio muito baixo - pode ter ruído perceptível'
            });
        }

        // Retornar diagnósticos
        return {
            problems,
            suggestions,
            summary: `${problems.length} problema(s), ${suggestions.length} sugestão(ões)`,
            __refEvidence // Importante para verificar se o sistema funcionou
        };
    }

    // Método para compatibilidade com integration.js
    generateAIPrompt(analysis) {
        if (!analysis || !analysis.diagnostics) {
            return "Análise indisponível para prompt IA.";
        }
        
        const { diagnostics, metrics } = analysis;
        const suggestions = diagnostics.suggestions || [];
        const problems = diagnostics.problems || [];
        
        let prompt = `Análise de áudio profissional:\n`;
        prompt += `LUFS: ${metrics.lufs}dB | Peak: ${metrics.peakDb}dB | DR: ${metrics.dynamicRange}dB\n\n`;
        
        if (problems.length > 0) {
            prompt += `PROBLEMAS DETECTADOS:\n`;
            problems.forEach(p => prompt += `- ${p.message}\n`);
            prompt += `\n`;
        }
        
        if (suggestions.length > 0) {
            prompt += `SUGESTÕES DE MELHORIA:\n`;
            suggestions.forEach(s => prompt += `- ${s.message}: ${s.action}\n`);
        }
        
        return prompt;
    }

    async dispose() {
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
            this.isInitialized = false;
        }
    }
}

// Expor globalmente compatível com sistema antigo
window.AudioAnalyzerV2 = AudioAnalyzerV2;

// Criar instância global para compatibilidade com integration.js
if (!window.audioAnalyzer) {
    window.audioAnalyzer = new AudioAnalyzerV2();
    console.log('🎵 AudioAnalyzerV2 instanciado como window.audioAnalyzer');
}

console.log('🎵 AudioAnalyzerV2 carregado com sistema de referências síncrono e sem conflitos');
