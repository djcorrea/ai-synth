// 🎓 GERADOR DE TEXTO DIDÁTICO PARA SUGESTÕES
// Gera explicações educativas e identificação de criticidade
class SuggestionTextGenerator {
    constructor() {
        this.patterns = {
            // Padrões críticos (vermelho)
            critical: [
                {
                    match: /clipping|clip|áudio.*clipping|distorção/i,
                    title: "🚨 CLIPPING DETECTADO",
                    explanation: "Seu áudio está distorcendo porque o sinal ultrapassou o limite máximo permitido. Isso causa uma distorção digital muito desagradável que compromete completamente a qualidade.",
                    action: "Reduza imediatamente o volume/ganho geral ou use um limitador bem configurado",
                    rationale: "Clipping é irreversível e arruína a qualidade do áudio, sendo inaceitável em produções profissionais",
                    technical: "Amostras digitais ultrapassaram 0dBFS (full scale)"
                },
                {
                    match: /true.*peak.*>.*0|true.*peak.*crítico/i,
                    title: "🚨 TRUE PEAK CRÍTICO",
                    explanation: "O True Peak está acima de 0dBTP, o que pode causar distorção durante a conversão D/A e problemas de reprodução em sistemas reais.",
                    action: "Use um limitador com True Peak para manter abaixo de -0.1dBTP",
                    rationale: "True Peak > 0dBTP pode distorcer em conversores D/A e sistemas de reprodução",
                    technical: "Oversampling detectou intersample peaks acima do limite digital"
                },

                {
                    match: /samples.*clipad|amostras.*clipped|samples.*>.*0/i,
                    title: "🚨 SAMPLES CLIPPADOS DETECTADOS",
                    explanation: "O sistema detectou amostras digitais que atingiram o limite máximo, causando distorção hard clipping no áudio.",
                    action: "Reduza o ganho ou use processamento dinâmico para evitar que samples atinjam 0dBFS",
                    rationale: "Cada sample clippado representa distorção audível que degrada a qualidade",
                    technical: "Detecção de samples >= 0.99 em análise digital"
                }
            ],
            
            // Padrões suspeitos/inconsistentes (laranja)
            inconsistent: [
                {
                    match: /inconsist|suspeito|discrepância/i,
                    title: "⚠️ INCONSISTÊNCIA DETECTADA",
                    explanation: "Há valores conflitantes nas métricas do áudio, o que pode indicar problemas na análise ou características incomuns do material.",
                    action: "Verifique os dados técnicos e considere re-analisar com diferentes parâmetros",
                    rationale: "Inconsistências podem mascarar problemas reais ou indicar características especiais do áudio",
                    technical: "Métricas calculadas apresentam valores conflitantes"
                },
                {
                    match: /dr.*inconsist|dynamic.*range.*suspeito/i,
                    title: "⚠️ DINÂMICA SUSPEITA",
                    explanation: "O range dinâmico calculado não condiz com outras métricas. Pode haver processamento pesado ou características especiais do material.",
                    action: "Analise o espectrograma e considere ajustes na masterização",
                    rationale: "DR inconsistente pode indicar super-compressão ou problemas de medição",
                    technical: "Dynamic Range não correlaciona com Crest Factor esperado"
                }
            ],
            
            // Padrões normais (azul/verde)
            normal: [
                {
                    match: /eq|equaliz|frequên/i,
                    title: "🎛️ Ajuste de EQ Sugerido",
                    explanation: "Pequenos ajustes de equalização podem melhorar o equilíbrio tonal e a clareza do seu áudio.",
                    action: "Faça cortes/boosts suaves nas frequências indicadas",
                    rationale: "EQ corretivo melhora a tradução do áudio em diferentes sistemas",
                    technical: "Análise espectral detectou desequilíbrios tonais menores"
                },
                {
                    match: /compress|dinâm/i,
                    title: "🎚️ Ajuste de Dinâmica",
                    explanation: "A dinâmica do áudio pode ser otimizada para melhor impacto e consistência.",
                    action: "Use compressão suave ou ajuste os transientes",
                    rationale: "Dinâmica bem controlada melhora a percepção e o impacto musical",
                    technical: "Range dinâmico e crest factor sugerem otimização possível"
                },
                {
                    match: /stereo|width|correlação/i,
                    title: "🎧 Ajuste de Imagem Stereo",
                    explanation: "A imagem stereo pode ser otimizada para melhor espacialidade e compatibilidade mono.",
                    action: "Ajuste o posicionamento stereo ou correlação entre canais",
                    rationale: "Imagem stereo bem balanceada melhora a experiência auditiva",
                    technical: "Análise de correlação stereo detectou oportunidades de melhoria"
                }
            ]
        };
    }

    generateDidacticText(suggestion) {
        if (!suggestion || !suggestion.message) return null;

        const message = suggestion.message.toLowerCase();
        const action = suggestion.action || suggestion.solution || '';
        const details = suggestion.details || '';

        // Verificar padrões críticos primeiro
        for (const pattern of this.patterns.critical) {
            if (pattern.match.test(message)) {
                return {
                    ...pattern,
                    isCritical: true,
                    originalMessage: suggestion.message,
                    originalAction: action
                };
            }
        }

        // Verificar padrões inconsistentes
        for (const pattern of this.patterns.inconsistent) {
            if (pattern.match.test(message)) {
                return {
                    ...pattern,
                    isInconsistent: true,
                    originalMessage: suggestion.message,
                    originalAction: action
                };
            }
        }

        // Verificar padrões normais
        for (const pattern of this.patterns.normal) {
            if (pattern.match.test(message)) {
                return {
                    ...pattern,
                    isNormal: true,
                    originalMessage: suggestion.message,
                    originalAction: action
                };
            }
        }

        // Fallback para sugestões sem padrão específico
        return {
            title: suggestion.message || "Sugestão Detectada",
            explanation: "Uma otimização foi identificada para melhorar a qualidade do seu áudio.",
            action: action || "Aplique a correção sugerida conforme necessário",
            rationale: "Pequenos ajustes podem fazer grande diferença na qualidade final",
            technical: details || "Análise automática detectou oportunidade de melhoria",
            isNormal: true,
            originalMessage: suggestion.message,
            originalAction: action
        };
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.SuggestionTextGenerator = SuggestionTextGenerator;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuggestionTextGenerator;
}
