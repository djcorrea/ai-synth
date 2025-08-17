// TESTE: Verificar consistência entre Overall Score e Sub-Scores

function testarConsistenciaScores() {
    console.log('=== TESTE DE CONSISTÊNCIA OVERALL vs SUB-SCORES ===');
    
    // Simular algoritmo corrigido
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const mapLin = (x, x1, x2, y1, y2) => {
        if (!isFinite(x)) return null;
        if (x1 === x2) return y1;
        const t = clamp((x - x1) / (x2 - x1), 0, 1);
        return lerp(y1, y2, t);
    };

    function calculateQualityScores(metrics) {
        const core = metrics.core || {};
        const stereo = metrics.stereo;
        const scores = { dynamics: 50, frequency: 50, stereo: 50, loudness: 50, technical: 50 };

        // DINÂMICA
        if (isFinite(core.dynamicRange)) {
            const dr = clamp(core.dynamicRange, 2, 30);
            scores.dynamics = Math.round(mapLin(dr, 2, 30, 30, 95));
        }

        // LOUDNESS
        const lufsInt = metrics.loudness?.lufs_integrated;
        if (isFinite(lufsInt)) {
            if (lufsInt > -6) {
                const excess = lufsInt - (-6);
                scores.loudness = Math.max(5, 30 - excess * 3);
            } else if (lufsInt < -23) {
                const deficit = (-23) - lufsInt;
                scores.loudness = Math.max(20, 70 - deficit * 2);
            } else {
                const left = mapLin(lufsInt, -35, -14, 40, 95);
                const right = mapLin(lufsInt, -14, -6, 95, 30);
                scores.loudness = Math.round(lufsInt <= -14 ? left : right);
            }
        }

        // TÉCNICO
        let technical = 100;
        if (isFinite(core.clippingPercentage)) {
            const clipPct = Math.max(0, core.clippingPercentage);
            if (clipPct > 1) technical -= 50; 
            else if (clipPct > 0.2) technical -= 25; 
            else if (clipPct > 0.05) technical -= 10;
        }
        if (metrics.truePeak?.exceeds_minus1dbtp) {
            if (isFinite(metrics.truePeak?.dbtp)) {
                const tpeak = metrics.truePeak.dbtp;
                if (tpeak >= 0) technical -= 40;
                else if (tpeak > -0.3) technical -= 30;
                else if (tpeak > -0.6) technical -= 25;
                else technical -= 20;
            } else {
                technical -= 20;
            }
        }
        if (isFinite(core.dcOffset)) {
            const dc = Math.abs(core.dcOffset);
            const dcLim = clamp(dc, 0, 0.05);
            technical -= Math.round(mapLin(dcLim, 0.005, 0.05, 0, 15));
        }
        if (isFinite(core.peak) && core.peak > -1) technical -= 20;
        scores.technical = clamp(Math.round(technical), 0, 100);

        // FREQUÊNCIA
        if (isFinite(core.spectralCentroid)) {
            const c = clamp(core.spectralCentroid, 200, 8000);
            const left = mapLin(c, 200, 1500, 45, 85);
            const mid = mapLin(c, 1500, 3000, 85, 90);
            const right = mapLin(c, 3000, 8000, 90, 60);
            scores.frequency = Math.round(c <= 1500 ? left : (c <= 3000 ? mid : right));
        }

        // ESTÉREO
        if (stereo) {
            const base = stereo.monoCompatibility === 'excellent' ? 90
                : stereo.monoCompatibility === 'good' ? 75
                : stereo.monoCompatibility === 'fair' ? 60 : 40;
            let st = base;
            if (isFinite(stereo.width)) {
                const w = stereo.width;
                if (w > 1.8) st -= 10; 
                else st += Math.round(mapLin(clamp(w, 0.2, 1.5), 0.2, 1.5, -5, 8));
            }
            if (isFinite(stereo.balance)) {
                const b = Math.abs(clamp(stereo.balance, -1, 1));
                st -= Math.round(mapLin(clamp(b, 0.1, 0.6), 0.1, 0.6, 0, 15));
            }
            scores.stereo = clamp(Math.round(st), 0, 100);
        }

        // OVERALL SCORE - AQUI ESTÁ O PROBLEMA!
        const weights = {
            dynamics: 0.25,
            frequency: 0.20,
            stereo: stereo ? 0.20 : 0,
            loudness: 0.20,
            technical: 0.15
        };
        
        if (!stereo) {
            weights.dynamics = 0.30; 
            weights.frequency = 0.25; 
            weights.loudness = 0.25; 
            weights.technical = 0.20;
        }

        const overall = Math.round(
            scores.dynamics * weights.dynamics +
            scores.frequency * weights.frequency +
            scores.stereo * weights.stereo +
            scores.loudness * weights.loudness +
            scores.technical * weights.technical
        );

        return { overall: Math.max(0, Math.min(100, overall)), breakdown: scores };
    }

    // TESTE 1: Áudio excelente (deveria dar ~100 overall e sub-scores altos)
    console.log('\n=== TESTE 1: Áudio Excelente ===');
    const audioExcelente = {
        core: { 
            dynamicRange: 20,      // Excelente DR
            spectralCentroid: 2000, // Centróide ideal
            clippingPercentage: 0,  // Sem clipping
            dcOffset: 0.001,       // DC muito baixo
            peak: -3               // Peak seguro
        },
        loudness: { lufs_integrated: -14 }, // LUFS ideal
        truePeak: { 
            exceeds_minus1dbtp: false,
            dbtp: -2.1 
        },
        stereo: { 
            monoCompatibility: 'excellent', 
            width: 1.0, 
            balance: 0.01 
        }
    };

    const resultExcelente = calculateQualityScores(audioExcelente);
    console.log('Overall:', resultExcelente.overall);
    console.log('Sub-scores:', resultExcelente.breakdown);
    console.log('Consistent?', resultExcelente.overall >= 85 && Object.values(resultExcelente.breakdown).every(s => s >= 80));

    // TESTE 2: Áudio mediano (deveria dar ~60-70 overall e sub-scores médios)
    console.log('\n=== TESTE 2: Áudio Mediano ===');
    const audioMediano = {
        core: { 
            dynamicRange: 10,       // DR médio
            spectralCentroid: 1200, // Um pouco baixo
            clippingPercentage: 0.1, // Pouco clipping
            dcOffset: 0.01,        // DC baixo
            peak: -1.5             // Peak ok
        },
        loudness: { lufs_integrated: -16 }, // LUFS ligeiramente off
        truePeak: { 
            exceeds_minus1dbtp: true,
            dbtp: -0.8 
        },
        stereo: { 
            monoCompatibility: 'good', 
            width: 1.3, 
            balance: 0.1 
        }
    };

    const resultMediano = calculateQualityScores(audioMediano);
    console.log('Overall:', resultMediano.overall);
    console.log('Sub-scores:', resultMediano.breakdown);
    console.log('Consistent?', resultMediano.overall >= 60 && resultMediano.overall <= 80);

    // TESTE 3: Áudio ruim (como o caso atual)
    console.log('\n=== TESTE 3: Áudio Ruim (Caso Atual) ===');
    const audioRuim = {
        core: { 
            dynamicRange: 8.3,      // DR baixo
            spectralCentroid: 12000, // Muito agudo
            clippingPercentage: 28.68, // MUITO clipping
            dcOffset: 0.002,       
            peak: 4.2              // Peak altíssimo
        },
        loudness: { lufs_integrated: -0.5 }, // LUFS extremo
        truePeak: { 
            exceeds_minus1dbtp: true,
            dbtp: 0.0 
        },
        stereo: { 
            monoCompatibility: 'poor', 
            width: 0.46, 
            balance: -0.49 
        }
    };

    const resultRuim = calculateQualityScores(audioRuim);
    console.log('Overall:', resultRuim.overall);
    console.log('Sub-scores:', resultRuim.breakdown);
    console.log('Consistent?', resultRuim.overall <= 40 && Object.values(resultRuim.breakdown).every(s => s <= 70));

    // ANÁLISE FINAL
    console.log('\n=== ANÁLISE DE CONSISTÊNCIA ===');
    const casos = [
        { nome: 'Excelente', result: resultExcelente },
        { nome: 'Mediano', result: resultMediano },
        { nome: 'Ruim', result: resultRuim }
    ];

    casos.forEach(caso => {
        const overall = caso.result.overall;
        const subScores = Object.values(caso.result.breakdown);
        const avgSubScore = subScores.reduce((a, b) => a + b, 0) / subScores.length;
        const diff = Math.abs(overall - avgSubScore);
        
        console.log(`${caso.nome}: Overall=${overall}, Avg Sub-scores=${avgSubScore.toFixed(1)}, Diff=${diff.toFixed(1)}`);
        
        if (diff > 15) {
            console.log(`⚠️ INCONSISTÊNCIA DETECTADA em ${caso.nome}!`);
        } else {
            console.log(`✅ ${caso.nome} está consistente`);
        }
    });
}

// Executar teste
testarConsistenciaScores();
