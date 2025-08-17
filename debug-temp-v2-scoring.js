// Debug: Investigar cálculos do temp-v2.js para LUFS -0.5

function debugTempV2Scoring() {
    console.log('=== DEBUG TEMP-V2 SCORING ===');
    
    // Simular dados do caso problemático
    const metrics = {
        core: {
            dynamicRange: 12.5,
            rms: -2.1,
            clippingPercentage: 0.001,
            dcOffset: 0.002,
            peak: 0.0,
            spectralCentroid: 2200
        },
        loudness: {
            lufs_integrated: -0.5  // PROBLEMA: 5.1dB off target
        },
        truePeak: {
            exceeds_minus1dbtp: true  // PROBLEMA: True Peak issues
        },
        stereo: {
            monoCompatibility: 'good',
            width: 1.2,
            balance: 0.05
        }
    };

    // Replicar cálculo do temp-v2.js
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const mapLin = (x, x1, x2, y1, y2) => {
        if (!isFinite(x)) return null;
        if (x1 === x2) return y1;
        const t = clamp((x - x1) / (x2 - x1), 0, 1);
        return lerp(y1, y2, t);
    };

    const scores = { dynamics: 50, frequency: 50, stereo: 50, loudness: 50, technical: 50 };

    // 1. DYNAMICS SCORE
    const dr = clamp(metrics.core.dynamicRange, 2, 30);
    scores.dynamics = Math.round(mapLin(dr, 2, 30, 30, 95));
    console.log(`Dynamics: DR=${dr} → Score=${scores.dynamics}`);

    // 2. LOUDNESS SCORE (PROBLEMA AQUI!)
    const lufsInt = metrics.loudness.lufs_integrated;
    if (isFinite(lufsInt)) {
        const l = clamp(lufsInt, -35, -8);
        console.log(`Loudness: LUFS=${lufsInt} → Clamped=${l}`);
        
        const left = mapLin(l, -35, -14, 40, 95);
        const right = mapLin(l, -14, -8, 95, 60);
        
        console.log(`Left mapping (l <= -14): ${left}`);
        console.log(`Right mapping (l > -14): ${right}`);
        console.log(`Condition l <= -14: ${l <= -14}`);
        
        scores.loudness = Math.round(l <= -14 ? left : right);
        console.log(`Final Loudness Score: ${scores.loudness}`);
    }

    // 3. TECHNICAL SCORE (PROBLEMA AQUI!)
    let technical = 100;
    console.log(`Technical start: ${technical}`);
    
    if (isFinite(metrics.core.clippingPercentage)) {
        const clipPct = Math.max(0, metrics.core.clippingPercentage);
        console.log(`Clipping %: ${clipPct}`);
        if (clipPct > 1) technical -= 50; 
        else if (clipPct > 0.2) technical -= 25; 
        else if (clipPct > 0.05) technical -= 10;
        console.log(`After clipping penalty: ${technical}`);
    }
    
    if (metrics.truePeak?.exceeds_minus1dbtp) {
        technical -= 20;
        console.log(`After true peak penalty: ${technical}`);
    }
    
    if (isFinite(metrics.core.dcOffset)) {
        const dc = Math.abs(metrics.core.dcOffset);
        const dcLim = clamp(dc, 0, 0.05);
        const penalty = Math.round(mapLin(dcLim, 0.005, 0.05, 0, 15));
        technical -= penalty;
        console.log(`DC Offset: ${dc} → Penalty: ${penalty} → Technical: ${technical}`);
    }
    
    if (isFinite(metrics.core.peak) && metrics.core.peak > -1) {
        technical -= 20;
        console.log(`Peak > -1dB penalty: ${technical}`);
    }
    
    scores.technical = clamp(Math.round(technical), 0, 100);
    console.log(`Final Technical Score: ${scores.technical}`);

    // 4. FREQUENCY SCORE
    if (isFinite(metrics.core.spectralCentroid)) {
        const c = clamp(metrics.core.spectralCentroid, 200, 8000);
        const left = mapLin(c, 200, 1500, 45, 85);
        const mid = mapLin(c, 1500, 3000, 85, 90);
        const right = mapLin(c, 3000, 8000, 90, 60);
        scores.frequency = Math.round(c <= 1500 ? left : (c <= 3000 ? mid : right));
        console.log(`Frequency: Centroid=${c} → Score=${scores.frequency}`);
    }

    // 5. STEREO SCORE
    const base = metrics.stereo.monoCompatibility === 'excellent' ? 90
        : metrics.stereo.monoCompatibility === 'good' ? 75
        : metrics.stereo.monoCompatibility === 'fair' ? 60 : 40;
    let st = base;
    
    if (isFinite(metrics.stereo.width)) {
        const w = metrics.stereo.width;
        if (w > 1.8) st -= 10; 
        else st += Math.round(mapLin(clamp(w, 0.2, 1.5), 0.2, 1.5, -5, 8));
    }
    
    if (isFinite(metrics.stereo.balance)) {
        const b = Math.abs(clamp(metrics.stereo.balance, -1, 1));
        st -= Math.round(mapLin(clamp(b, 0.1, 0.6), 0.1, 0.6, 0, 15));
    }
    
    scores.stereo = clamp(Math.round(st), 0, 100);
    console.log(`Stereo: Base=${base} → Final=${scores.stereo}`);

    // OVERALL SCORE
    const weights = {
        dynamics: 0.25,
        frequency: 0.20,
        stereo: 0.20,
        loudness: 0.20,
        technical: 0.15
    };

    const overall = Math.round(
        scores.dynamics * weights.dynamics +
        scores.frequency * weights.frequency +
        scores.stereo * weights.stereo +
        scores.loudness * weights.loudness +
        scores.technical * weights.technical
    );

    console.log('\n=== FINAL RESULTS ===');
    console.log('Breakdown:', scores);
    console.log('Weights:', weights);
    console.log('Overall:', overall);
    
    console.log('\n=== EXPECTED vs ACTUAL ===');
    console.log('Expected Loudness: ~19 (based on 5.1dB deviation)');
    console.log('Actual Loudness:', scores.loudness);
    console.log('Expected Technical: ~40-60 (True Peak + potential Peak issues)');
    console.log('Actual Technical:', scores.technical);

    return { overall, breakdown: scores };
}

// Executar debug
debugTempV2Scoring();
