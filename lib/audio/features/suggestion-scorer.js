// 🎯 SISTEMA DE SCORING E PRIORIZAÇÃO DE SUGESTÕES MELHORADO
// Implementa z-score normalizado, severidade por cores, prioridade ponderada e dependências

class SuggestionScorer {
    constructor() {
        // 🎨 Configuração de pesos por tipo de métrica
        this.weights = {
            // Métricas principais
            lufs: 1.0,          // LUFS - crítico para streaming
            true_peak: 0.9,     // True Peak - evita clipagem digital  
            dr: 0.8,           // Dynamic Range
            plr: 0.8,          // Peak-to-Loudness Ratio (alternativa ao DR)
            lra: 0.6,          // Loudness Range
            stereo: 0.5,       // Correlação estéreo
            
            // Bandas espectrais
            band: 0.7,         // Bandas gerais
            
            // Heurísticas específicas (alta prioridade quando detectadas)
            sibilance: 1.0,    // Sibilância
            masking: 1.0,      // Mascaramento
            harshness: 1.0,    // Aspereza/harshness
            mud: 0.8,          // Lama nos médios
            
            // Outros
            surgical: 0.9,     // EQ cirúrgico
            mastering: 0.6     // Sugestões de mastering gerais
        };

        // 🎨 Configuração de severidade por z-score
        this.severityConfig = {
            green: { threshold: 1.0, score: 0.0, color: '#52f7ad', label: 'OK' },
            yellow: { threshold: 2.0, score: 1.0, color: '#ffd93d', label: 'monitorar' },
            orange: { threshold: 3.0, score: 1.5, color: '#ff8c42', label: 'ajustar' },
            red: { threshold: Infinity, score: 2.0, color: '#ff4757', label: 'corrigir' }
        };

        // 🔗 Regras de dependência entre métricas
        this.dependencyRules = [
            {
                id: 'lufs_truepeak',
                condition: (metrics) => metrics.lufs_z > 1 && metrics.true_peak_z > 1,
                bonus: 0.2,
                note: 'Controlar ceiling/headroom antes de empurrar limiter'
            },
            {
                id: 'sub_dr', 
                condition: (metrics) => (metrics.sub_z > 1 || metrics.low_bass_z > 1) && metrics.dr_z < -1,
                bonus: 0.2,
                note: 'Corrigir graves antes de punir DR'
            },
            {
                id: 'stereo_width_mono',
                condition: (metrics) => metrics.stereo_z > 2,
                bonus: 0.1,
                note: 'Monoizar <100 Hz quando width alta'
            }
        ];

        // 📝 Templates de sugestão por categoria
        this.templates = {
            loudness: {
                high: {
                    message: 'LUFS acima do alvo para {genre}',
                    action: 'Reduzir ganho geral em ~{delta}dB ou ajustar limiter',
                    why: 'Evita distorção e atende padrões de streaming'
                },
                low: {
                    message: 'LUFS abaixo do alvo para {genre}', 
                    action: 'Aumentar ganho geral em ~{delta}dB',
                    why: 'Melhora competitividade e presença'
                }
            },
            true_peak: {
                high: {
                    message: 'True Peak muito alto',
                    action: 'Aplicar limiter com ceiling {target}dBTP',
                    why: 'Previne clipagem na conversão D/A'
                }
            },
            dr: {
                low: {
                    message: 'Dynamic Range muito comprimido',
                    action: 'Reduzir compressão ou usar compressão multibanda',
                    why: 'Preserva dinâmica e naturalidade'
                }
            },
            lra: {
                low: {
                    message: 'Loudness Range muito estreita',
                    action: 'Reduzir compressão agressiva e preservar dinâmica',
                    why: 'Evita fadiga auditiva'
                },
                high: {
                    message: 'Loudness Range muito ampla',
                    action: 'Aplicar compressão suave para controlar dinâmica',
                    why: 'Melhora consistência'
                }
            },
            stereo: {
                low: {
                    message: 'Correlação estéreo muito baixa',
                    action: 'Verificar problemas de fase ou excesso de width',
                    why: 'Evita cancelamento em mono'
                },
                high: {
                    message: 'Imagem estéreo muito estreita',
                    action: 'Expandir imagem estéreo com cuidado',
                    why: 'Melhora espacialidade'
                }
            },
            band: {
                high: {
                    message: 'Banda {band} acima do ideal para {genre}',
                    action: 'Reduzir {band} em ~{delta}dB ({range})',
                    why: 'Alinha com perfil tonal do gênero'
                },
                low: {
                    message: 'Banda {band} abaixo do ideal para {genre}',
                    action: 'Aumentar {band} em ~{delta}dB ({range})',
                    why: 'Alinha com perfil tonal do gênero'
                }
            },
            sibilance: {
                detected: {
                    message: 'Sibilância detectada em {freq}Hz',
                    action: 'Aplicar de-esser ou EQ com Q alto',
                    why: 'Reduz fadiga auditiva em vozes'
                }
            },
            harshness: {
                detected: {
                    message: 'Aspereza em {freq}Hz',
                    action: 'Suavizar {freq}Hz com EQ ou compressão multibanda',
                    why: 'Reduz agressive em médios-altos'
                }
            }
        };

        // 🎨 Mapeamento de cores de severidade
        this.severityColors = {
            green: '#52f7ad',
            yellow: '#ffd93d', 
            orange: '#ff8c42',
            red: '#ff4757'
        };

        // 📊 Ranges de frequência por banda
        this.bandRanges = {
            sub: '20-60 Hz',
            low_bass: '60-150 Hz', 
            upper_bass: '150-300 Hz',
            low_mid: '300-800 Hz',
            mid: '800-2000 Hz',
            high_mid: '2-6 kHz',
            brilho: '6-12 kHz',
            presenca: '3-6 kHz'
        };
    }

    /**
     * 🎯 Calcular z-score normalizado para uma métrica
     * @param {number} value - Valor medido
     * @param {number} target - Valor alvo 
     * @param {number} tolerance - Tolerância
     * @returns {number} Z-score
     */
    calculateZScore(value, target, tolerance) {
        if (!Number.isFinite(value) || !Number.isFinite(target) || !Number.isFinite(tolerance) || tolerance <= 0) {
            return 0;
        }
        return (value - target) / tolerance;
    }

    /**
     * 🎨 Determinar severidade baseada no z-score absoluto
     * @param {number} zScore - Z-score calculado
     * @returns {Object} Configuração de severidade
     */
    getSeverity(zScore) {
        const absZ = Math.abs(zScore);
        
        if (absZ <= this.severityConfig.green.threshold) {
            return { level: 'green', ...this.severityConfig.green };
        } else if (absZ <= this.severityConfig.yellow.threshold) {
            return { level: 'yellow', ...this.severityConfig.yellow };
        } else if (absZ <= this.severityConfig.orange.threshold) {
            return { level: 'orange', ...this.severityConfig.orange };
        } else {
            return { level: 'red', ...this.severityConfig.red };
        }
    }

    /**
     * 🎖️ Calcular fator de confiança baseado em qualidade da análise
     * @param {Object} analysisQuality - Métricas de qualidade
     * @returns {number} Confiança entre 0 e 1
     */
    calculateConfidence(analysisQuality = {}) {
        let confidence = 1.0;
        
        // Duração válida (penalizar áudios muito curtos)
        if (analysisQuality.duration && analysisQuality.duration < 10) {
            confidence *= 0.7; // 30% de penalidade para < 10s
        }
        
        // Oversampling para True Peak
        if (analysisQuality.truePeakOversampled === false) {
            confidence *= 0.9; // 10% de penalidade sem oversampling
        }
        
        // SNR (Signal-to-Noise Ratio)
        if (analysisQuality.snr && analysisQuality.snr < 40) {
            confidence *= 0.8; // 20% de penalidade para SNR baixo
        }
        
        // Estabilidade (variação entre janelas)
        if (analysisQuality.stability && analysisQuality.stability < 0.8) {
            confidence *= 0.9; // 10% de penalidade para baixa estabilidade
        }
        
        return Math.max(0.1, Math.min(1.0, confidence));
    }

    /**
     * 🔗 Verificar dependências entre métricas e calcular bônus
     * @param {Object} zScores - Z-scores de todas as métricas
     * @returns {Object} Bônus de dependência por métrica
     */
    calculateDependencyBonus(zScores) {
        const bonuses = {};
        
        for (const rule of this.dependencyRules) {
            if (rule.condition(zScores)) {
                // Aplicar bônus às métricas relacionadas
                if (rule.id === 'lufs_truepeak') {
                    bonuses.lufs = (bonuses.lufs || 0) + rule.bonus;
                    bonuses.true_peak = (bonuses.true_peak || 0) + rule.bonus;
                } else if (rule.id === 'sub_dr') {
                    bonuses.sub = (bonuses.sub || 0) + rule.bonus;
                    bonuses.low_bass = (bonuses.low_bass || 0) + rule.bonus;
                    bonuses.dr = (bonuses.dr || 0) + rule.bonus;
                } else if (rule.id === 'stereo_width_mono') {
                    bonuses.stereo = (bonuses.stereo || 0) + rule.bonus;
                }
            }
        }
        
        return bonuses;
    }

    /**
     * 📊 Calcular prioridade final da sugestão
     * @param {Object} params - Parâmetros do cálculo
     * @returns {number} Prioridade calculada
     */
    calculatePriority({ metricType, severity, confidence, dependencyBonus = 0 }) {
        const baseWeight = this.weights[metricType] || 0.5;
        const severityScore = severity.score;
        
        return baseWeight * severityScore * confidence * (1 + dependencyBonus);
    }

    /**
     * 🏷️ Gerar sugestão formatada com template
     * @param {Object} params - Parâmetros da sugestão
     * @returns {Object} Sugestão completa
     */
    generateSuggestion(params) {
        const {
            type, subtype, value, target, tolerance, zScore, severity, 
            priority, confidence, genre, metricType, band, freq
        } = params;
        
        const delta = Math.abs(value - target);
        const direction = value > target ? 'high' : 'low';
        
        // Selecionar template
        let template = this.templates[metricType];
        if (template && template[direction || 'detected']) {
            template = template[direction || 'detected'];
        } else {
            // Template padrão
            template = {
                message: `${metricType} fora do alvo`,
                action: `Ajustar ${metricType}`,
                why: 'Alinha com referência do gênero'
            };
        }
        
        // Substituir variáveis no template
        const message = template.message
            .replace('{genre}', genre || 'gênero')
            .replace('{band}', band || '')
            .replace('{freq}', freq || '')
            .replace('{delta}', delta.toFixed(1));
            
        const action = template.action
            .replace('{delta}', delta.toFixed(1))
            .replace('{target}', target?.toFixed(1) || '')
            .replace('{range}', this.bandRanges[band] || '')
            .replace('{band}', band || '')
            .replace('{freq}', freq || '');
        
        return {
            type: type || 'reference_metric',
            subtype,
            message,
            action,
            why: template.why,
            
            // Dados técnicos para auditoria
            technical: {
                value: Number.isFinite(value) ? +value.toFixed(2) : null,
                target: Number.isFinite(target) ? +target.toFixed(2) : null,
                delta: Number.isFinite(delta) ? +delta.toFixed(2) : null,
                tolerance: Number.isFinite(tolerance) ? +tolerance.toFixed(2) : null,
                zScore: Number.isFinite(zScore) ? +zScore.toFixed(2) : null
            },
            
            // Scoring
            priority: Number.isFinite(priority) ? +priority.toFixed(3) : 0,
            confidence: Number.isFinite(confidence) ? +confidence.toFixed(2) : 1,
            severity: {
                level: severity.level,
                score: severity.score,
                color: severity.color,
                label: severity.label
            },
            
            // Metadata
            genre: genre || window.PROD_AI_REF_GENRE || 'unknown',
            timestamp: Date.now(),
            
            // Para compatibilidade com sistema existente
            details: `Δ=${delta.toFixed(2)} • z=${zScore.toFixed(2)} • ${severity.label} • conf=${confidence.toFixed(2)} • prior=${priority.toFixed(3)}`
        };
    }

    /**
     * 🎯 Agrupar sugestões por tema
     * @param {Array} suggestions - Lista de sugestões
     * @returns {Object} Sugestões agrupadas
     */
    groupSuggestionsByTheme(suggestions) {
        const themes = {
            loudness: [],      // LUFS, TP
            dynamics: [],      // DR, PLR, LRA  
            lows: [],         // Sub, Low Bass, Upper Bass
            mids: [],         // Low Mid, Mid, High Mid
            highs: [],        // Presence, Brightness
            stereo: [],       // Correlação, Width, Phase
            artifacts: []     // Sibilância, Harshness, Clipping
        };
        
        for (const sug of suggestions) {
            const type = sug.type || '';
            const subtype = sug.subtype || '';
            
            if (type.includes('lufs') || type.includes('true_peak') || type.includes('loudness')) {
                themes.loudness.push(sug);
            } else if (type.includes('dr') || type.includes('plr') || type.includes('lra') || type.includes('dynamic')) {
                themes.dynamics.push(sug);
            } else if (type.includes('stereo') || type.includes('correlation') || type.includes('phase')) {
                themes.stereo.push(sug);
            } else if (type.includes('sibilance') || type.includes('harsh') || type.includes('clip')) {
                themes.artifacts.push(sug);
            } else if (subtype === 'sub' || subtype === 'low_bass' || subtype === 'upper_bass') {
                themes.lows.push(sug);
            } else if (subtype === 'low_mid' || subtype === 'mid' || subtype === 'high_mid') {
                themes.mids.push(sug);
            } else if (subtype === 'presenca' || subtype === 'brilho') {
                themes.highs.push(sug);
            } else {
                // Classificar por conteúdo da mensagem se tipo não for claro
                const msg = (sug.message || '').toLowerCase();
                if (msg.includes('grave') || msg.includes('sub') || msg.includes('bass')) {
                    themes.lows.push(sug);
                } else if (msg.includes('médio') || msg.includes('mid')) {
                    themes.mids.push(sug);
                } else if (msg.includes('agudo') || msg.includes('high') || msg.includes('brilho')) {
                    themes.highs.push(sug);
                } else {
                    themes.dynamics.push(sug); // fallback
                }
            }
        }
        
        return themes;
    }

    /**
     * 🧹 Deduplicar sugestões similares
     * @param {Array} suggestions - Lista de sugestões
     * @returns {Array} Sugestões deduplicadas
     */
    deduplicateSuggestions(suggestions) {
        const seen = new Map();
        const deduplicated = [];
        
        for (const sug of suggestions) {
            // Criar chave única baseada em tipo e parâmetros principais
            const key = [
                sug.type,
                sug.subtype, 
                sug.technical?.target,
                Math.round((sug.technical?.delta || 0) * 10) / 10 // arredondar delta para 0.1
            ].join('|');
            
            if (!seen.has(key)) {
                seen.set(key, true);
                deduplicated.push(sug);
            } else {
                // Se duplicata, manter a de maior prioridade
                const existing = deduplicated.find(s => 
                    s.type === sug.type && s.subtype === sug.subtype
                );
                if (existing && sug.priority > existing.priority) {
                    const index = deduplicated.indexOf(existing);
                    deduplicated[index] = sug;
                }
            }
        }
        
        return deduplicated;
    }
}

// Instância global do scorer
window.SuggestionScorer = SuggestionScorer;
window.suggestionScorer = new SuggestionScorer();

// Log de inicialização
console.log('🎯 Suggestion Scorer inicializado com pesos:', window.suggestionScorer.weights);
