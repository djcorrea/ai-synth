// TESTE ESPECÍFICO: Dados da interface atual (Overall 30)

function testarCasoAtual() {
    console.log('=== TESTE COM DADOS EXATOS DA INTERFACE ===');
    
    // Dados exatos da imagem da interface
    const dadosInterface = {
        core: {
            // Métricas Principais
            peak: 4.2,                    // Peak: 4.2 dB
            rms: -4.2,                    // RMS: -4.2 dB  
            dynamicRange: 8.3,            // Dinâmica: 8.3 dB
            crestFactor: 2.6,             // Crest Factor: 2.6
            truePeak: 0.0,                // True Peak: 0.0 dBTP
            lufsIntegrated: -0.5,         // LUFS (Int.): -0.5 LUFS
            lra: 6.7,                     // LRA: 6.7 dB
            offsetLoudness: -22.5,        // Offset -23LUFS: -22.5 dB
            
            // Métricas Avançadas  
            lufsShortTerm: -0.1,          // LUFS (Short-Term): -0.1 LUFS
            lufsMomentary: 2.0,           // LUFS (Momentary): 2.0 LUFS
            headroom: -4.5,               // Headroom (Pk0): -4.5 dB
            samplePeakLeft: 4.2,          // Sample Peak (L): 4.2 dB
            samplePeakRight: 4.5,         // Sample Peak (R): 4.5 dB
            clippingPercentage: 28.68,    // Clipping (%): 28.68% !!!
            
            // Análise Estéreo & Espectral
            correlacao: 0.25,             // Correlação: 0.25
            largura: 0.46,                // Largura: 0.46
            balance: -49,                 // Balance: -49%
            monoCompatibilidade: 'poor',  // Mono Compat: poor
            centroide: 12000,             // Centróide: 12000 Hz
            rolloff85: 0,                 // Rolloff (85%): 0 Hz
            flux: 0.000,                  // Flux: 0.000
            flatness: 1.000,              // Flatness: 1.000
            
            // Outras
            dcOffset: 0.001,              // Estimado
            spectralCentroid: 12000,      // = centroide
        },
        loudness: { 
            lufs_integrated: -0.5         // Confirmar LUFS
        },
        truePeak: { 
            exceeds_minus1dbtp: true,
            dbtp: 0.0                     // True Peak em 0.0 dBTP = CLIPPING
        },
        stereo: { 
            monoCompatibility: 'poor',    // Compat pobre
            width: 0.46,                  // Largura baixa
            balance: -0.49                // Balance ruim (-49%)
        }
    };
    
    // Função de cálculo (igual ao sistema corrigido)
    function calculateQualityScoresAtual(metrics) {
        const core = metrics.core || {};
        const stereo = metrics.stereo;
        
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const lerp = (a, b, t) => a + (b - a) * t;
        const mapLin = (x, x1, x2, y1, y2) => {
            if (!isFinite(x)) return null;
            if (x1 === x2) return y1;
            const t = clamp((x - x1) / (x2 - x1), 0, 1);
            return lerp(y1, y2, t);
        };

        const scores = { dynamics: 50, frequency: 50, stereo: 50, loudness: 50, technical: 50 };

        // DINÂMICA: DR 8.3 dB
        if (isFinite(core.dynamicRange)) {
            const dr = clamp(core.dynamicRange, 2, 30);
            scores.dynamics = Math.round(mapLin(dr, 2, 30, 30, 95));
            console.log(`Dinâmica: DR=${dr} → Score=${scores.dynamics}`);
        }

        // LOUDNESS: LUFS -0.5 (EXTREMO!)
        const lufsInt = metrics.loudness?.lufs_integrated;
        if (isFinite(lufsInt)) {
            console.log(`Loudness: LUFS=${lufsInt}`);
            if (lufsInt > -6) {
                const excess = lufsInt - (-6);
                scores.loudness = Math.max(5, 30 - excess * 3);
                console.log(`Loudness (extremo alto): excess=${excess}, score=${scores.loudness}`);
            } else if (lufsInt < -23) {
                const deficit = (-23) - lufsInt;
                scores.loudness = Math.max(20, 70 - deficit * 2);
                console.log(`Loudness (extremo baixo): deficit=${deficit}, score=${scores.loudness}`);
            } else {
                const left = mapLin(lufsInt, -35, -14, 40, 95);
                const right = mapLin(lufsInt, -14, -6, 95, 30);
                scores.loudness = Math.round(lufsInt <= -14 ? left : right);
                console.log(`Loudness (normal): left=${left}, right=${right}, score=${scores.loudness}`);
            }
        }

        // TÉCNICO: Múltiplos problemas graves
        let technical = 100;
        console.log(`Technical start: ${technical}`);
        
        // Clipping 28.68% = DESASTRE
        if (isFinite(core.clippingPercentage)) {
            const clipPct = Math.max(0, core.clippingPercentage);
            console.log(`Clipping: ${clipPct}%`);
            if (clipPct > 1) technical -= 50;      // 28.68% >> 1%
            else if (clipPct > 0.2) technical -= 25; 
            else if (clipPct > 0.05) technical -= 10;
            console.log(`Após clipping: ${technical}`);
        }
        
        // True Peak 0.0 dBTP = CLIPPING DIGITAL
        if (metrics.truePeak?.exceeds_minus1dbtp) {
            if (isFinite(metrics.truePeak?.dbtp)) {
                const tpeak = metrics.truePeak.dbtp;
                console.log(`True Peak: ${tpeak} dBTP`);
                if (tpeak >= 0) technical -= 40;        // 0.0 >= 0 = -40
                else if (tpeak > -0.3) technical -= 30;
                else if (tpeak > -0.6) technical -= 25;
                else technical -= 20;
                console.log(`Após true peak: ${technical}`);
            }
        }
        
        // DC Offset
        if (isFinite(core.dcOffset)) {
            const dc = Math.abs(core.dcOffset);
            const dcLim = clamp(dc, 0, 0.05);
            const penalty = Math.round(mapLin(dcLim, 0.005, 0.05, 0, 15));
            technical -= penalty;
            console.log(`DC Offset: ${dc}, penalty: ${penalty}, technical: ${technical}`);
        }
        
        // Sample Peak 4.2 dB > -1 = MAIS PENALIZAÇÃO
        if (isFinite(core.peak) && core.peak > -1) {
            technical -= 20;
            console.log(`Sample Peak > -1dB: ${technical}`);
        }
        
        scores.technical = clamp(Math.round(technical), 0, 100);
        console.log(`Technical final: ${scores.technical}`);

        // FREQUÊNCIA: Centróide 12000 Hz = MUITO AGUDO
        if (isFinite(core.spectralCentroid)) {
            const c = clamp(core.spectralCentroid, 200, 8000);  // 12000 → 8000
            console.log(`Frequency: Centróide=${core.spectralCentroid} → Clamped=${c}`);
            const left = mapLin(c, 200, 1500, 45, 85);
            const mid = mapLin(c, 1500, 3000, 85, 90);
            const right = mapLin(c, 3000, 8000, 90, 60);       // 8000 → 60
            scores.frequency = Math.round(c <= 1500 ? left : (c <= 3000 ? mid : right));
            console.log(`Frequency final: ${scores.frequency}`);
        }

        // ESTÉREO: Problemas graves
        if (stereo) {
            console.log(`Stereo: monoCompatibility=${stereo.monoCompatibility}`);
            const base = stereo.monoCompatibility === 'excellent' ? 90
                : stereo.monoCompatibility === 'good' ? 75
                : stereo.monoCompatibility === 'fair' ? 60 
                : 40;  // 'poor' = 40
            
            let st = base;
            console.log(`Stereo base (${stereo.monoCompatibility}): ${st}`);
            
            if (isFinite(stereo.width)) {
                const w = stereo.width;  // 0.46
                console.log(`Stereo width: ${w}`);
                if (w > 1.8) st -= 10; 
                else st += Math.round(mapLin(clamp(w, 0.2, 1.5), 0.2, 1.5, -5, 8));
                console.log(`Após width: ${st}`);
            }
            
            if (isFinite(stereo.balance)) {
                const b = Math.abs(clamp(stereo.balance, -1, 1));  // |-0.49| = 0.49
                console.log(`Stereo balance abs: ${b}`);
                const penalty = Math.round(mapLin(clamp(b, 0.1, 0.6), 0.1, 0.6, 0, 15));
                st -= penalty;
                console.log(`Penalty balance: ${penalty}, stereo: ${st}`);
            }
            
            scores.stereo = clamp(Math.round(st), 0, 100);
            console.log(`Stereo final: ${scores.stereo}`);
        }

        // OVERALL - Pesos
        const weights = {
            dynamics: 0.25,     // 25%
            frequency: 0.20,    // 20%
            stereo: stereo ? 0.20 : 0,  // 20%
            loudness: 0.20,     // 20%
            technical: 0.15     // 15%
        };
        
        if (!stereo) {
            weights.dynamics = 0.30; 
            weights.frequency = 0.25; 
            weights.loudness = 0.25; 
            weights.technical = 0.20;
        }

        const overall = Math.round(
            scores.dynamics * weights.dynamics +      // Ex: 45 * 0.25
            scores.frequency * weights.frequency +    // Ex: 60 * 0.20  
            scores.stereo * weights.stereo +          // Ex: 26 * 0.20
            scores.loudness * weights.loudness +      // Ex: 13.5 * 0.20
            scores.technical * weights.technical      // Ex: 10 * 0.15
        );
        
        console.log(`\nCálculo Overall:`);
        console.log(`${scores.dynamics} * ${weights.dynamics} = ${scores.dynamics * weights.dynamics}`);
        console.log(`${scores.frequency} * ${weights.frequency} = ${scores.frequency * weights.frequency}`);
        console.log(`${scores.stereo} * ${weights.stereo} = ${scores.stereo * weights.stereo}`);
        console.log(`${scores.loudness} * ${weights.loudness} = ${scores.loudness * weights.loudness}`);
        console.log(`${scores.technical} * ${weights.technical} = ${scores.technical * weights.technical}`);
        console.log(`Total: ${overall}`);

        return { overall: Math.max(0, Math.min(100, overall)), breakdown: scores };
    }
    
    const result = calculateQualityScoresAtual(dadosInterface);
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log('Overall Score:', result.overall);
    console.log('Sub-scores:', result.breakdown);
    
    console.log('\n=== COMPARAÇÃO COM INTERFACE ===');
    console.log('Interface mostra Overall: 30');
    console.log('Calculado Overall:', result.overall);
    console.log('✅ Overall está correto?', Math.abs(30 - result.overall) <= 2);
    
    return result;
}

// Executar
testarCasoAtual();
