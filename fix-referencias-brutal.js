// 🚨 VERSÃO DIRETA E BRUTAL - SUBSTITUI TUDO
function renderReferenceComparisons(analysis) {
    const container = document.getElementById('referenceComparisons');
    if (!container) return;
    
    console.log('🚨 FORÇA BRUTA: Iniciando renderização');
    
    // FORÇAR as variáveis se não existirem
    if (!window.PROD_AI_REF_GENRE) window.PROD_AI_REF_GENRE = 'funk_mandela';
    
    // BUSCAR referência DIRETAMENTE
    if (!window.PROD_AI_REF_DATA) {
        container.innerHTML = '<div style="color:red;">❌ PROD_AI_REF_DATA não existe</div>';
        return;
    }
    
    const refData = window.PROD_AI_REF_DATA[window.PROD_AI_REF_GENRE];
    if (!refData || !refData.legacy_compatibility) {
        container.innerHTML = '<div style="color:red;">❌ Dados de ' + window.PROD_AI_REF_GENRE + ' não encontrados</div>';
        return;
    }
    
    const ref = refData.legacy_compatibility;
    const tech = analysis?.technicalData || {};
    
    console.log('🚨 FORÇA BRUTA: Ref encontrada:', ref);
    console.log('🚨 FORÇA BRUTA: Tech data:', tech);
    
    // CRIAR tabela DIRETO no HTML
    let html = `
        <div style="margin-top:20px;">
            <h4 style="color:#9cdcfe;margin-bottom:10px;">🎯 COMPARAÇÃO DE REFERÊNCIA (${window.PROD_AI_REF_GENRE.toUpperCase()})</h4>
            <table style="width:100%;border-collapse:collapse;font-size:12px;color:#fff;">
                <thead>
                    <tr style="background:#1e1e2e;">
                        <th style="padding:6px;border:1px solid #333;">Métrica</th>
                        <th style="padding:6px;border:1px solid #333;">Valor</th>
                        <th style="padding:6px;border:1px solid #333;">Alvo</th>
                        <th style="padding:6px;border:1px solid #333;">Δ</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // LUFS - DIRETO
    if (tech.lufsIntegrated && ref.lufs_target) {
        const diff = tech.lufsIntegrated - ref.lufs_target;
        html += `
            <tr>
                <td style="padding:4px;border:1px solid #333;">Volume Integrado (LUFS)</td>
                <td style="padding:4px;border:1px solid #333;">${tech.lufsIntegrated.toFixed(1)} LUFS</td>
                <td style="padding:4px;border:1px solid #333;">${ref.lufs_target} LUFS</td>
                <td style="padding:4px;border:1px solid #333;color:#7ee787;">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</td>
            </tr>
        `;
    }
    
    // TRUE PEAK - DIRETO
    if (tech.truePeakDbtp && ref.true_peak_target) {
        const diff = tech.truePeakDbtp - ref.true_peak_target;
        html += `
            <tr>
                <td style="padding:4px;border:1px solid #333;">Pico Real (dBTP)</td>
                <td style="padding:4px;border:1px solid #333;">${tech.truePeakDbtp.toFixed(1)} dBTP</td>
                <td style="padding:4px;border:1px solid #333;">${ref.true_peak_target} dBTP</td>
                <td style="padding:4px;border:1px solid #333;color:#7ee787;">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</td>
            </tr>
        `;
    }
    
    // DYNAMIC RANGE - DIRETO
    if (tech.dynamicRange && ref.dr_target) {
        const diff = tech.dynamicRange - ref.dr_target;
        html += `
            <tr>
                <td style="padding:4px;border:1px solid #333;">Dinâmica (DR)</td>
                <td style="padding:4px;border:1px solid #333;">${tech.dynamicRange.toFixed(1)}</td>
                <td style="padding:4px;border:1px solid #333;">${ref.dr_target}</td>
                <td style="padding:4px;border:1px solid #333;color:#7ee787;">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</td>
            </tr>
        `;
    }
    
    // STEREO - DIRETO
    if (tech.stereoCorrelation && ref.stereo_target) {
        const diff = tech.stereoCorrelation - ref.stereo_target;
        html += `
            <tr>
                <td style="padding:4px;border:1px solid #333;">Correlação Estéreo</td>
                <td style="padding:4px;border:1px solid #333;">${tech.stereoCorrelation.toFixed(2)}</td>
                <td style="padding:4px;border:1px solid #333;">${ref.stereo_target.toFixed(2)}</td>
                <td style="padding:4px;border:1px solid #333;color:#7ee787;">${diff > 0 ? '+' : ''}${diff.toFixed(2)}</td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    console.log('🚨 FORÇA BRUTA: Tabela inserida no DOM');
}
