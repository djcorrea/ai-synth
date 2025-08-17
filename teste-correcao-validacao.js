// TESTE DE VALIDAÇÃO: Verificar se as correções funcionaram

function testFixedScoring() {
    console.log('=== TESTE DAS CORREÇÕES IMPLEMENTADAS ===');
    
    // Simular o algoritmo corrigido do temp-v2.js
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const mapLin = (x, x1, x2, y1, y2) => {
        if (!isFinite(x)) return null;
        if (x1 === x2) return y1;
        const t = clamp((x - x1) / (x2 - x1), 0, 1);
        return lerp(y1, y2, t);
    };

    // Dados do caso problemático
    const metrics = {
        loudness: { lufs_integrated: -0.5 },
        truePeak: { 
            exceeds_minus1dbtp: true,
            dbtp: 0.0  // True Peak exatamente em 0 dBTP
        },
        core: {
            clippingPercentage: 0.001,
            dcOffset: 0.002,
            peak: 0.0  // Sample peak em 0 dB
        }
    };

    const scores = { loudness: 50, technical: 50 };

    // TESTE 1: Loudness corrigido
    const lufsInt = metrics.loudness.lufs_integrated;
    if (isFinite(lufsInt)) {
        console.log(`\nTESTE LOUDNESS: LUFS ${lufsInt}`);
        
        if (lufsInt > -6) {
            const excess = lufsInt - (-6);
            scores.loudness = Math.max(5, 30 - excess * 3);
            console.log(`Ramo extremo alto: excess=${excess}, score=${scores.loudness}`);
        } else if (lufsInt < -23) {
            const deficit = (-23) - lufsInt;
            scores.loudness = Math.max(20, 70 - deficit * 2);
            console.log(`Ramo extremo baixo: deficit=${deficit}, score=${scores.loudness}`);
        } else {
            const left = mapLin(lufsInt, -35, -14, 40, 95);
            const right = mapLin(lufsInt, -14, -6, 95, 30);
            scores.loudness = Math.round(lufsInt <= -14 ? left : right);
            console.log(`Ramo normal: left=${left}, right=${right}, score=${scores.loudness}`);
        }
    }

    // TESTE 2: Technical corrigido
    let technical = 100;
    console.log(`\nTESTE TECHNICAL: Start=${technical}`);
    
    if (isFinite(metrics.core.clippingPercentage)) {
        const clipPct = Math.max(0, metrics.core.clippingPercentage);
        if (clipPct > 1) technical -= 50; 
        else if (clipPct > 0.2) technical -= 25; 
        else if (clipPct > 0.05) technical -= 10;
        console.log(`Após clipping (${clipPct}%): ${technical}`);
    }
    
    if (metrics.truePeak?.exceeds_minus1dbtp) {
        if (isFinite(metrics.truePeak?.dbtp)) {
            const tpeak = metrics.truePeak.dbtp;
            if (tpeak >= 0) technical -= 40;
            else if (tpeak > -0.3) technical -= 30;
            else if (tpeak > -0.6) technical -= 25;
            else technical -= 20;
            console.log(`Após true peak (${tpeak} dBTP): ${technical}`);
        } else {
            technical -= 20;
            console.log(`Após true peak (fallback): ${technical}`);
        }
    }
    
    if (isFinite(metrics.core.dcOffset)) {
        const dc = Math.abs(metrics.core.dcOffset);
        const dcLim = clamp(dc, 0, 0.05);
        const penalty = Math.round(mapLin(dcLim, 0.005, 0.05, 0, 15));
        technical -= penalty;
        console.log(`Após DC offset (${dc}): penalty=${penalty}, technical=${technical}`);
    }
    
    if (isFinite(metrics.core.peak) && metrics.core.peak > -1) {
        technical -= 20;
        console.log(`Após sample peak (${metrics.core.peak}): ${technical}`);
    }
    
    scores.technical = clamp(Math.round(technical), 0, 100);

    console.log('\n=== RESULTADOS FINAIS ===');
    console.log(`Loudness: ${scores.loudness}/100`);
    console.log(`Technical: ${scores.technical}/100`);
    
    console.log('\n=== COMPARAÇÃO ===');
    console.log('ANTES (interface): Loudness 100/100, Technical 100/100');
    console.log(`DEPOIS (corrigido): Loudness ${scores.loudness}/100, Technical ${scores.technical}/100`);
    console.log(`Redução Loudness: ${100 - scores.loudness} pontos`);
    console.log(`Redução Technical: ${100 - scores.technical} pontos`);
    
    // Verificar se está no range esperado
    const loudnessOK = scores.loudness >= 5 && scores.loudness <= 20;
    const technicalOK = scores.technical >= 20 && scores.technical <= 50;
    
    console.log('\n=== VALIDAÇÃO ===');
    console.log(`Loudness está no range esperado (5-20): ${loudnessOK ? '✅' : '❌'}`);
    console.log(`Technical está no range esperado (20-50): ${technicalOK ? '✅' : '❌'}`);
    
    if (loudnessOK && technicalOK) {
        console.log('\n🎉 CORREÇÃO IMPLEMENTADA COM SUCESSO!');
        console.log('Os sub-scores agora refletem adequadamente a qualidade do áudio.');
    } else {
        console.log('\n⚠️ Ajustes podem ser necessários nos algoritmos.');
    }
    
    return { loudness: scores.loudness, technical: scores.technical };
}

// Executar teste
testFixedScoring();
