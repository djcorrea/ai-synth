// 🎵 AUDIO ANALYZER INTEGRATION
// Conecta o sistema de análise de áudio com o chat existente

// Debug flag (silencia logs em produção; defina window.DEBUG_ANALYZER = true para habilitar)
const __DEBUG_ANALYZER__ = (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true);
const __dbg = (...a) => { if (__DEBUG_ANALYZER__) console.log(...a); };
const __dwrn = (...a) => { if (__DEBUG_ANALYZER__) console.warn(...a); };

let currentModalAnalysis = null;
let __audioIntegrationInitialized = false; // evita listeners duplicados
let __refDataCache = {}; // cache por gênero
let __activeRefData = null; // dados do gênero atual
let __genreManifest = null; // manifesto de gêneros (opcional)

// 📚 Carregar manifesto de gêneros (opcional). Se ausente, manter fallback.
async function loadGenreManifest() {
    try {
        const res = await fetch(`../refs/out/genres.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        // Esperado: { genres: [{ key: 'trance', label: 'Trance' }, ...] }
        if (json && Array.isArray(json.genres)) {
            __genreManifest = json.genres;
            return __genreManifest;
        }
    } catch (e) {
        __dwrn('Manifesto de gêneros não disponível (usando fallback):', e.message || e);
    }
    return null;
}

// 🏷️ Popular o <select> com base no manifesto, mantendo fallback e preservando seleção
function populateGenreSelect(manifestGenres) {
    const sel = document.getElementById('audioRefGenreSelect');
    if (!sel) return;
    if (!Array.isArray(manifestGenres) || manifestGenres.length === 0) {
        // Nada a fazer (fallback já em HTML)
        // Ainda assim, garantir que o gênero ativo esteja presente como opção
        ensureActiveGenreOption(sel, window.PROD_AI_REF_GENRE);
        return;
    }
    // Salvar valor atual (se houver)
    const current = sel.value;
    // Limpar opções atuais e reconstruir
    while (sel.options.length) sel.remove(0);
    for (const g of manifestGenres) {
        if (!g || !g.key) continue;
        const opt = document.createElement('option');
        opt.value = String(g.key);
        opt.textContent = String(g.label || labelizeKey(g.key));
        sel.appendChild(opt);
    }
    // Garantir que gênero ativo via URL/localStorage esteja presente
    ensureActiveGenreOption(sel, window.PROD_AI_REF_GENRE);
    // Restaurar seleção (priorizar PROD_AI_REF_GENRE > current > primeira opção)
    const target = window.PROD_AI_REF_GENRE || current || (sel.options[0] && sel.options[0].value);
    if (target) sel.value = target;
}

// 🔤 Converter chave em rótulo amigável (ex.: "funk_mandela" → "Funk Mandela")
function labelizeKey(key) {
    if (!key) return '';
    return String(key)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ✅ Garantir que a opção do gênero ativo exista no select (para casos via URL)
function ensureActiveGenreOption(selectEl, genreKey) {
    if (!selectEl || !genreKey) return;
    const exists = Array.from(selectEl.options).some(o => o.value === genreKey);
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = String(genreKey);
        opt.textContent = labelizeKey(genreKey);
        selectEl.appendChild(opt);
    }
}

async function loadReferenceData(genre) {
    try {
        if (__refDataCache[genre]) {
            __activeRefData = __refDataCache[genre];
            updateRefStatus('✔ referências carregadas', '#0d6efd');
            return __activeRefData;
        }
        updateRefStatus('⏳ carregando...', '#996600');
        const res = await fetch(`../refs/out/${genre}.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        // Estrutura: { genre: { ... }}
        const rootKey = Object.keys(json)[0];
        const data = json[rootKey];
        __refDataCache[genre] = data;
        __activeRefData = data;
        window.PROD_AI_REF_DATA = data;
        updateRefStatus('✔ referências aplicadas', '#0d6efd');
        return data;
    } catch (e) {
        console.warn('Falha ao carregar referências', genre, e);
        updateRefStatus('⚠ falha refs', '#992222');
        return null;
    }
}

function updateRefStatus(text, color) {
    const el = document.getElementById('audioRefStatus');
    if (el) { el.textContent = text; el.style.background = color || '#1f2b40'; }
}

function applyGenreSelection(genre) {
    if (!genre) return;
    window.PROD_AI_REF_GENRE = genre;
    localStorage.setItem('prodai_ref_genre', genre);
    loadReferenceData(genre);
}
// Expor global
if (typeof window !== 'undefined') {
    window.applyGenreSelection = applyGenreSelection;
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeAudioAnalyzerIntegration();
});


function initializeAudioAnalyzerIntegration() {
    if (__audioIntegrationInitialized) {
        __dbg('ℹ️ Integração do Audio Analyzer já inicializada. Ignorando chamada duplicada.');
        return;
    }
    __audioIntegrationInitialized = true;
    __dbg('🎵 Inicializando integração do Audio Analyzer...');
    // Habilitar flag de referência por gênero via parâmetro de URL (ex.: ?refgenre=trance)
    try {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const rg = params.get('refgenre');
            if (rg && !window.PROD_AI_REF_GENRE) {
                window.PROD_AI_REF_GENRE = String(rg).trim().toLowerCase();
                __dbg(`[REF-GÊNERO] Ativado via URL: ${window.PROD_AI_REF_GENRE}`);
            }
            // Flags de controle por URL (não alteram CSS)
            if (params.has('surgical')) {
                const v = params.get('surgical');
                window.USE_SURGICAL_EQ = !(v === '0' || v === 'false');
                __dbg(`[FLAG] USE_SURGICAL_EQ = ${window.USE_SURGICAL_EQ}`);
            }
            if (params.has('useLog')) {
                const v = params.get('useLog');
                window.USE_LOG_BAND_ENERGIES = (v === '1' || v === 'true');
                __dbg(`[FLAG] USE_LOG_BAND_ENERGIES = ${window.USE_LOG_BAND_ENERGIES}`);
            }
            if (params.has('adv')) {
                const v = params.get('adv');
                const on = !(v === '0' || v === 'false');
                window.USE_ADVANCED_METRICS = on;
                window.USE_ADVANCED_LOUDNESS = on;
                window.USE_ADVANCED_TRUEPEAK = on;
                window.USE_ADVANCED_SPECTRUM = on;
                __dbg(`[FLAG] ADVANCED = ${on}`);
            }
            if (params.has('debug')) {
                const v = params.get('debug');
                window.DEBUG_ANALYZER = (v === '1' || v === 'true');
                __dbg(`[FLAG] DEBUG_ANALYZER = ${window.DEBUG_ANALYZER}`);
            }
        }
    } catch (_) { /* noop */ }
    
    // Restaurar gênero salvo
    try {
        const saved = localStorage.getItem('prodai_ref_genre');
        if (!window.PROD_AI_REF_GENRE && saved) window.PROD_AI_REF_GENRE = saved;
    } catch {}

    const genreSelect = document.getElementById('audioRefGenreSelect');
    if (genreSelect) {
        // Popular dinamicamente a partir do manifesto, mantendo fallback
        loadGenreManifest().then(() => {
            populateGenreSelect(__genreManifest);
            // Listener de mudança (garantir apenas um)
            genreSelect.onchange = () => applyGenreSelection(genreSelect.value);
            // Aplicar seleção atual
            const selected = genreSelect.value || window.PROD_AI_REF_GENRE;
            applyGenreSelection(selected);
        });
    }

    // Botão de análise de música (novo design)
    const musicAnalysisBtn = document.getElementById('musicAnalysisBtn');
    if (musicAnalysisBtn) {
        musicAnalysisBtn.addEventListener('click', openAudioModal);
        __dbg('✅ Botão de Análise de Música configurado');
    }
    
    // Modal de áudio
    setupAudioModal();
    
    __dbg('🎵 Audio Analyzer Integration carregada com sucesso!');

    // Aplicar estilos aprimorados ao seletor de gênero
    try { injectRefGenreStyles(); } catch(e) { /* silencioso */ }
}

// 🎵 Abrir modal de análise de áudio
function openAudioModal() {
    __dbg('🎵 Abrindo modal de análise de áudio...');
    
    const modal = document.getElementById('audioAnalysisModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Reset modal state
        resetModalState();
        
        // Focus no modal
        modal.setAttribute('tabindex', '-1');
        modal.focus();
    }
}

// ❌ Fechar modal de análise de áudio
function closeAudioModal() {
    __dbg('❌ Fechando modal de análise de áudio...');
    
    const modal = document.getElementById('audioAnalysisModal');
    if (modal) {
        modal.style.display = 'none';
        currentModalAnalysis = null;
        resetModalState();
    }
}

// 🔄 Reset estado do modal
function resetModalState() {
    // Mostrar área de upload
    const uploadArea = document.getElementById('audioUploadArea');
    const loading = document.getElementById('audioAnalysisLoading');
    const results = document.getElementById('audioAnalysisResults');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (loading) loading.style.display = 'none';
    if (results) results.style.display = 'none';
    
    // Reset progress
    const progressFill = document.getElementById('audioProgressFill');
    if (progressFill) progressFill.style.width = '0%';
}

// ⚙️ Configurar modal de áudio
function setupAudioModal() {
    const modal = document.getElementById('audioAnalysisModal');
    const fileInput = document.getElementById('modalAudioFileInput');
    const uploadArea = document.getElementById('audioUploadArea');
    
    if (!modal || !fileInput || !uploadArea) {
        __dwrn('⚠️ Elementos do modal não encontrados');
        return;
    }
    
    // Fechar modal clicando fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAudioModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeAudioModal();
        }
    });
    
    // Detectar se é dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
        // Drag and Drop (apenas para desktop)
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.querySelector('.upload-content').classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.querySelector('.upload-content').classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.querySelector('.upload-content').classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleModalFileSelection(files[0]);
            }
        });
    }
    
    // File input change event
    fileInput.addEventListener('change', (e) => {
        __dbg('📁 File input change triggered');
        if (e.target.files.length > 0) {
            __dbg('📁 File selected:', e.target.files[0].name);
            handleModalFileSelection(e.target.files[0]);
        }
    });
    
    // Não adicionar nenhum listener JS ao botão/label de upload!
    uploadArea.onclick = null;
    
    __dbg('✅ Modal de áudio configurado com sucesso');
}

// 📁 Processar arquivo selecionado no modal
async function handleModalFileSelection(file) {
    __dbg('📁 Arquivo selecionado no modal:', file.name);
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('audio/')) {
        showModalError('Por favor, selecione um arquivo de áudio válido.');
        return;
    }
    
    // Validar tamanho (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        showModalError('Arquivo muito grande. Tamanho máximo: 20MB');
        return;
    }
    
    try {
        // Mostrar loading com progresso detalhado
        showModalLoading();
        updateModalProgress(10, '⚡ Carregando Algoritmos Avançados...');
        
        // Aguardar audio analyzer carregar se necessário
        if (!window.audioAnalyzer) {
            __dbg('⏳ Aguardando Audio Analyzer carregar...');
            updateModalProgress(20, '🔧 Inicializando V2 Engine...');
            await waitForAudioAnalyzer();
        }

        // Garantir que referências estejam carregadas antes da análise (evita race)
        try {
            const genre = (typeof window !== 'undefined') ? window.PROD_AI_REF_GENRE : null;
            if (genre && !__activeRefData) {
                updateModalProgress(25, `📚 Carregando referências: ${genre}...`);
                await loadReferenceData(genre);
                updateModalProgress(30, '📚 Referências ok');
            }
        } catch (_) { /* silencioso */ }
        
        // Analisar arquivo
        __dbg('🔬 Iniciando análise...');
        updateModalProgress(40, '🎵 Processando Waveform Digital...');
        
    const analysis = await window.audioAnalyzer.analyzeAudioFile(file);
        currentModalAnalysis = analysis;
        
        __dbg('✅ Análise concluída:', analysis);
        
        updateModalProgress(90, '🧠 Computando Métricas Avançadas...');
        
        // Aguardar um pouco para melhor UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        updateModalProgress(100, '✨ Análise Completa - Pronto!');
        
        // Mostrar resultados
        setTimeout(() => {
            // Telemetria: verificar elementos alvo antes de preencher o modal
            const exists = {
                audioUploadArea: !!document.getElementById('audioUploadArea'),
                audioAnalysisLoading: !!document.getElementById('audioAnalysisLoading'),
                audioAnalysisResults: !!document.getElementById('audioAnalysisResults'),
                modalTechnicalData: !!document.getElementById('modalTechnicalData')
            };
            __dbg('🛰️ [Telemetry] Front antes de preencher modal (existência de elementos):', exists);
            displayModalResults(analysis);
        }, 800);
        
    } catch (error) {
        console.error('❌ Erro na análise do modal:', error);
        showModalError(`Erro ao analisar arquivo: ${error.message}`);
    }
}

// ⏳ Aguardar Audio Analyzer carregar
function waitForAudioAnalyzer() {
    return new Promise((resolve) => {
        if (window.audioAnalyzer) {
            resolve();
            return;
        }
        
        const checkInterval = setInterval(() => {
            if (window.audioAnalyzer) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout após 10 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 10000);
    });
}

// � Atualizar progresso no modal
function updateModalProgress(percentage, message) {
    const progressFill = document.getElementById('audioProgressFill');
    const progressText = document.getElementById('audioProgressText');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = message || `${percentage}%`;
    }
    
    __dbg(`📈 Progresso: ${percentage}% - ${message}`);
}

// ❌ Mostrar erro no modal
function showModalError(message) {
    const uploadArea = document.getElementById('audioUploadArea');
    const loading = document.getElementById('audioAnalysisLoading');
    const results = document.getElementById('audioAnalysisResults');
    
    if (uploadArea) uploadArea.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (results) {
        results.style.display = 'block';
        results.innerHTML = `
            <div style="color: #ff4444; text-align: center; padding: 30px;">
                <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
                <h3 style="margin: 0 0 15px 0; color: #ff4444;">Erro na Análise</h3>
                <p style="margin: 0 0 25px 0; color: #666; line-height: 1.4;">${message}</p>
                <button onclick="resetModalState()" style="
                    background: #ff4444; 
                    color: white; 
                    border: none; 
                    padding: 12px 25px; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#ff3333'" 
                   onmouseout="this.style.background='#ff4444'">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// �🔄 Mostrar loading no modal
function showModalLoading() {
    const uploadArea = document.getElementById('audioUploadArea');
    const loading = document.getElementById('audioAnalysisLoading');
    const results = document.getElementById('audioAnalysisResults');
    
    if (uploadArea) uploadArea.style.display = 'none';
    if (results) results.style.display = 'none';
    if (loading) loading.style.display = 'block';
    
    // Reset progress
    updateModalProgress(0, '🔄 Inicializando Engine de Análise...');
}

// 📈 Simular progresso
// (função de simulação de progresso removida — não utilizada)

// 📊 Mostrar resultados no modal
function displayModalResults(analysis) {
    const uploadArea = document.getElementById('audioUploadArea');
    const loading = document.getElementById('audioAnalysisLoading');
    const results = document.getElementById('audioAnalysisResults');
    const technicalData = document.getElementById('modalTechnicalData');
    
    if (!results || !technicalData) {
        console.error('❌ Elementos de resultado não encontrados');
        return;
    }
    
    // Ocultar outras seções
    if (uploadArea) uploadArea.style.display = 'none';
    if (loading) loading.style.display = 'none';
    
    // Mostrar resultados
    results.style.display = 'block';
    
    // Helpers seguros
    const safeFixed = (v, d=1) => (Number.isFinite(v) ? v.toFixed(d) : '—');
    const safeHz = (v) => (Number.isFinite(v) ? `${Math.round(v)} Hz` : '—');
    const pct = (v, d=0) => (Number.isFinite(v) ? `${(v*100).toFixed(d)}%` : '—');
    const tonalSummary = (tb) => {
        if (!tb || typeof tb !== 'object') return '—';
        const parts = [];
        if (tb.sub && Number.isFinite(tb.sub.rms_db)) parts.push(`Sub ${tb.sub.rms_db.toFixed(1)}dB`);
        if (tb.low && Number.isFinite(tb.low.rms_db)) parts.push(`Low ${tb.low.rms_db.toFixed(1)}dB`);
        if (tb.mid && Number.isFinite(tb.mid.rms_db)) parts.push(`Mid ${tb.mid.rms_db.toFixed(1)}dB`);
        if (tb.high && Number.isFinite(tb.high.rms_db)) parts.push(`High ${tb.high.rms_db.toFixed(1)}dB`);
        return parts.length ? parts.join(' • ') : '—';
    };

        // Layout com cards e KPIs, mantendo o container #modalTechnicalData
        const kpi = (value, label, cls='') => `
            <div class="kpi ${cls}">
                <div class="kpi-value">${value}</div>
                <div class="kpi-label">${label}</div>
            </div>`;

        const scoreKpi = Number.isFinite(analysis.qualityOverall) ? kpi(Math.round(analysis.qualityOverall), 'SCORE GERAL', 'kpi-score') : '';
        const timeKpi = Number.isFinite(analysis.processingMs) ? kpi(analysis.processingMs, 'TEMPO (MS)', 'kpi-time') : '';

        const src = (k) => (analysis.technicalData?._sources && analysis.technicalData._sources[k]) ? ` data-src="${analysis.technicalData._sources[k]}" title="origem: ${analysis.technicalData._sources[k]}"` : '';
        const row = (label, valHtml, keyForSource=null) => `
            <div class="data-row"${keyForSource?src(keyForSource):''}>
                <span class="label">${label}</span>
                <span class="value">${valHtml}</span>
            </div>`;

        const safePct = (v) => (Number.isFinite(v) ? `${(v*100).toFixed(0)}%` : '—');
        const monoCompat = (s) => s ? s : '—';

        const col1 = [
            row('Peak', `${safeFixed(analysis.technicalData.peak)} dB`, 'peak'),
            row('RMS', `${safeFixed(analysis.technicalData.rms)} dB`, 'rms'),
            row('Dinâmica', `${safeFixed(analysis.technicalData.dynamicRange)} dB`, 'dynamicRange'),
            row('Crest Factor', `${safeFixed(analysis.technicalData.crestFactor)}`, 'crestFactor'),
            row('True Peak', Number.isFinite(analysis.technicalData.truePeakDbtp) ? `${safeFixed(analysis.technicalData.truePeakDbtp)} dBTP` : '—', 'truePeakDbtp'),
            row('LUFS (Int.)', Number.isFinite(analysis.technicalData.lufsIntegrated) ? `${safeFixed(analysis.technicalData.lufsIntegrated)} LUFS` : '—', 'lufsIntegrated'),
            row('LRA', Number.isFinite(analysis.technicalData.lra) ? `${safeFixed(analysis.technicalData.lra)} dB` : '—', 'lra')
        ].join('');

        const col2 = [
            row('Correlação', Number.isFinite(analysis.technicalData.stereoCorrelation) ? safeFixed(analysis.technicalData.stereoCorrelation, 2) : '—', 'stereoCorrelation'),
            row('Largura', Number.isFinite(analysis.technicalData.stereoWidth) ? safeFixed(analysis.technicalData.stereoWidth, 2) : '—'),
            row('Balance', Number.isFinite(analysis.technicalData.balanceLR) ? safePct(analysis.technicalData.balanceLR) : '—', 'balanceLR'),
            row('Mono Compat.', monoCompat(analysis.technicalData.monoCompatibility)),
            row('Centroide', Number.isFinite(analysis.technicalData.spectralCentroid) ? safeHz(analysis.technicalData.spectralCentroid) : '—', 'spectralCentroid'),
            row('Rolloff (85%)', Number.isFinite(analysis.technicalData.spectralRolloff85) ? safeHz(analysis.technicalData.spectralRolloff85) : '—', 'spectralRolloff85'),
            row('Flux', Number.isFinite(analysis.technicalData.spectralFlux) ? safeFixed(analysis.technicalData.spectralFlux, 3) : '—', 'spectralFlux'),
            row('Flatness', Number.isFinite(analysis.technicalData.spectralFlatness) ? safeFixed(analysis.technicalData.spectralFlatness, 3) : '—', 'spectralFlatness')
        ].join('');

            const col3 = [
                row('Tonal Balance', analysis.technicalData?.tonalBalance ? tonalSummary(analysis.technicalData.tonalBalance) : '—', 'tonalBalance'),
                (analysis.technicalData.dominantFrequencies.length > 0 ? row('Freq. Dominante', `${Math.round(analysis.technicalData.dominantFrequencies[0].frequency)} Hz`) : ''),
                row('Problemas', analysis.problems.length > 0 ? `<span class="tag tag-danger">${analysis.problems.length} detectado(s)</span>` : '—'),
                row('Sugestões', analysis.suggestions.length > 0 ? `<span class="tag tag-success">${analysis.suggestions.length} disponível(s)</span>` : '—')
            ].join('');

            // Card extra: Métricas Avançadas (novo card)
            const advancedMetricsCard = () => {
                const rows = [];
                // LUFS ST/M e Headroom
                if (Number.isFinite(analysis.technicalData?.lufsShortTerm)) {
                    rows.push(row('LUFS (Short‑Term)', `${safeFixed(analysis.technicalData.lufsShortTerm, 1)} LUFS`, 'lufsShortTerm'));
                }
                if (Number.isFinite(analysis.technicalData?.lufsMomentary)) {
                    rows.push(row('LUFS (Momentary)', `${safeFixed(analysis.technicalData.lufsMomentary, 1)} LUFS`, 'lufsMomentary'));
                }
                if (Number.isFinite(analysis.technicalData?.headroomDb)) {
                    rows.push(row('Headroom', `${safeFixed(analysis.technicalData.headroomDb, 1)} dB`, 'headroomDb'));
                }
                // Picos por canal
                if (Number.isFinite(analysis.technicalData?.samplePeakLeftDb)) {
                    rows.push(row('Sample Peak (L)', `${safeFixed(analysis.technicalData.samplePeakLeftDb, 1)} dB`, 'samplePeakLeftDb'));
                }
                if (Number.isFinite(analysis.technicalData?.samplePeakRightDb)) {
                    rows.push(row('Sample Peak (R)', `${safeFixed(analysis.technicalData.samplePeakRightDb, 1)} dB`, 'samplePeakRightDb'));
                }
                // Clipping (%)
                if (Number.isFinite(analysis.technicalData?.clippingPct)) {
                    rows.push(row('Clipping (%)', `${safeFixed(analysis.technicalData.clippingPct, 2)}%`, 'clippingPct'));
                }
                // Frequências dominantes extras
                if (Array.isArray(analysis.technicalData?.dominantFrequencies) && analysis.technicalData.dominantFrequencies.length > 1) {
                    const extra = analysis.technicalData.dominantFrequencies.slice(1, 4)
                        .map((f, idx) => `${idx+2}. ${Math.round(f.frequency)} Hz (${f.occurrences || 1}x)`).join('<br>');
                    if (extra) rows.push(row('Top Freq. adicionais', `<span style="opacity:.9">${extra}</span>`));
                }
                return rows.join('') || row('Status', 'Sem métricas adicionais');
            };

            // Card extra: Problemas Técnicos detalhados
            const techProblems = () => {
                const rows = [];
                const clipVal = Number.isFinite(analysis.technicalData?.clippingSamples) ? analysis.technicalData.clippingSamples : 0;
                const dcVal = Number.isFinite(analysis.technicalData?.dcOffset) ? analysis.technicalData.dcOffset : 0;
                rows.push(row('Clipping', `<span class="warn">${clipVal} samples</span>`, 'clippingSamples'));
                rows.push(row('DC Offset', `${safeFixed(dcVal, 4)}`, 'dcOffset'));
                // Consistência (se disponível)
                if (analysis.metricsValidation && Object.keys(analysis.metricsValidation).length) {
                    const mv = analysis.metricsValidation;
                    const badge = (k,v) => `<span style="padding:2px 6px;border-radius:4px;font-size:11px;background:${v==='ok'?'#143f2b':(v==='warn'?'#4d3808':'#4a1d1d')};color:${v==='ok'?'#29c182':(v==='warn'?'#ffce4d':'#ff7d7d')};margin-left:6px;">${v}</span>`;
                    if (mv.dynamicRangeConsistency) rows.push(row('DR Consistência', `Δ=${mv.dynamicRangeDelta} ${badge('dr', mv.dynamicRangeConsistency)}`));
                    if (mv.crestFactorConsistency) rows.push(row('Crest Consist.', `Δ=${mv.crestVsExpectedDelta} ${badge('cf', mv.crestFactorConsistency)}`));
                    if (mv.lraPlausibility) rows.push(row('LRA Plausível', badge('lra', mv.lraPlausibility)));
                }
                return rows.join('');
            };

            // Card extra: Diagnóstico & Sugestões listados
            const diagCard = () => {
                const blocks = [];

                // Helpers para embelezar as sugestões sem mudar layout/IDs
                const formatNumbers = (text, decimals = 2) => {
                    if (!text || typeof text !== 'string') return '';
                    return text.replace(/(-?\d+\.\d{3,})/g, (m) => {
                        const n = parseFloat(m);
                        return Number.isFinite(n) ? n.toFixed(decimals) : m;
                    });
                };
                const renderSuggestionItem = (sug) => {
                    const title = sug.message || '';
                    let action = sug.action || '';
                    let extra = '';
                    
                    // Detectar sugestões cirúrgicas
                    const isSurgical = sug.type === 'surgical_eq';
                    
                    if (isSurgical) {
                        // Formato especial para sugestões cirúrgicas
                        const freqMatch = title.match(/\[(\d+)Hz\]/);
                        const frequency = freqMatch ? freqMatch[1] : '?';
                        const [freqInfo, severity] = title.split(' - ');
                        const context = freqInfo.replace(/\[\d+Hz\]/, '').trim();
                        
                        return `
                            <div class="diag-item surgical">
                                <div class="surgical-header">
                                    <span class="frequency-badge">${frequency} Hz</span>
                                    <span class="severity-badge ${severity || 'moderada'}">${severity || 'moderada'}</span>
                                </div>
                                <div class="context">${context}</div>
                                <div class="surgical-action">${action}</div>
                                <div class="surgical-details">${sug.details || ''}</div>
                            </div>`;
                    } else {
                        // Formato padrão para outras sugestões
                        // Se a ação tiver métrica após " — ", mover para detalhes
                        const split = action.split(' — ');
                        if (split.length > 1) {
                            action = split[0];
                            extra = split.slice(1).join(' — ');
                        }
                        // Unificar detalhes e remover duplicados para ficar limpo
                        const rawPieces = [sug.details || '', extra || '']
                            .filter(Boolean)
                            .join(' • ')
                            .split(/[;•]+/)
                            .map(s => s.trim())
                            .filter(Boolean);
                        const seen = new Set();
                        const uniquePieces = rawPieces.filter(p => {
                            const key = p.toLowerCase();
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                        const prettyDetails = formatNumbers(uniquePieces.join(' • '), 2);
                        
                        return `
                            <div class="diag-item info">
                                <div class="diag-title">${title}</div>
                                ${action ? `<div class="diag-tip">${action}</div>` : ''}
                                ${prettyDetails ? `<div class="diag-tip" style="opacity:.85;font-size:12px;">${prettyDetails}</div>` : ''}
                            </div>`;
                    }
                };
                if (analysis.problems.length > 0) {
                    const list = analysis.problems.map(p => {
                        const msg = typeof p.message === 'string' ? p.message.replace(/(-?\d+\.\d{3,})/g, m => {
                            const n = parseFloat(m); return Number.isFinite(n) ? n.toFixed(2) : m;
                        }) : p.message;
                        const sol = typeof p.solution === 'string' ? p.solution.replace(/(-?\d+\.\d{3,})/g, m => {
                            const n = parseFloat(m); return Number.isFinite(n) ? n.toFixed(2) : m;
                        }) : p.solution;
                        return `
                        <div class="diag-item danger">
                            <div class="diag-title">${msg}</div>
                            <div class="diag-tip">${sol || ''}</div>
                        </div>`;
                    }).join('');
                    blocks.push(`<div class="diag-section"><div class="diag-heading">Problemas:</div>${list}</div>`);
                }
                if (analysis.suggestions.length > 0) {
                    const list = analysis.suggestions.map(s => renderSuggestionItem(s)).join('');
                                        // Rodapé com contagem por tipo (texto simples, sem CSS novo)
                                        try {
                                                const count = (t) => analysis.suggestions.filter(s => s && s.type === t).length;
                                                const cBand = count('band_adjust');
                                                const cGroup = count('band_group_adjust');
                                                const cSurg = count('surgical_eq');
                                                const footer = `<div style="opacity:.8;font-size:11px;margin-top:8px;">`+
                                                    `Resumo: ${cBand} ajuste(s) de banda`+
                                                    `${cGroup?` • ${cGroup} agrupado(s)`:''}`+
                                                    `${cSurg?` • ${cSurg} cirúrgico(s)`:''}`+
                                                    `</div>`;
                                                blocks.push(`<div class="diag-section"><div class="diag-heading">Sugestões:</div>${list}${footer}</div>`);
                                        } catch {
                                                blocks.push(`<div class="diag-section"><div class="diag-heading">Sugestões:</div>${list}</div>`);
                                        }
                }
                // Subbloco opcional com diagnósticos do V2 PRO (quando disponíveis)
                const v2Pro = analysis.v2Pro || analysis.v2Diagnostics; // Compatibilidade
                if (v2Pro && (typeof window === 'undefined' || window.SUGESTOES_AVANCADAS !== false)) {
                    const v2p = (v2Pro.problems || []).map(p => `
                        <div class="diag-item danger">
                            <div class="diag-title">${p.message}</div>
                            <div class="diag-tip">${p.solution || ''}</div>
                        </div>`).join('');
                    const v2s = (v2Pro.suggestions || []).map(s => renderSuggestionItem(s)).join('');
                    const anyV2 = v2p || v2s;
                    if (anyV2) {
                        const v2Block = `
                            <div class="diag-section">
                                <div class="diag-heading">🎯 Diagnósticos Avançados (V2 Pro):</div>
                                ${v2p ? `<div class=\"diag-subheading\">⚠️ Problemas Detectados</div>${v2p}` : ''}
                                ${v2s ? `<div class=\"diag-subheading\">💡 Sugestões Técnicas</div>${v2s}` : ''}
                            </div>`;
                        blocks.push(v2Block);
                    }
                }
                return blocks.join('') || '<div class="diag-empty">Sem diagnósticos</div>';
            };

        const breakdown = analysis.qualityBreakdown || {};
        
        // Função para renderizar score com barra de progresso
        const renderScoreWithProgress = (label, value, color = '#00ffff') => {
            const numValue = parseFloat(value) || 0;
            const displayValue = value != null ? value : '—';
            
            if (value == null) {
                return `<div class="data-row">
                    <span class="label">${label}:</span>
                    <span class="value">—</span>
                </div>`;
            }
            
            return `<div class="data-row metric-with-progress">
                <span class="label">${label}:</span>
                <div class="metric-value-progress">
                    <span class="value">${displayValue}/100</span>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${Math.min(Math.max(numValue, 0), 100)}%; background: ${color}; color: ${color};"></div>
                    </div>
                </div>
            </div>`;
        };
        
        const scoreRows = breakdown ? `
            ${renderScoreWithProgress('Dinâmica', breakdown.dynamics, '#ffd700')}
            ${renderScoreWithProgress('Técnico', breakdown.technical, '#00ff92')}
            ${renderScoreWithProgress('Loudness', breakdown.loudness, '#ff3366')}
            ${renderScoreWithProgress('Frequência', breakdown.frequency, '#00ffff')}
        ` : '';

        technicalData.innerHTML = `
            <div class="kpi-row">${scoreKpi}${timeKpi}</div>
                    <div class="cards-grid">
                        <div class="card">
                    <div class="card-title">🎛️ Métricas Principais</div>
                    ${col1}
                </div>
                        <div class="card">
                    <div class="card-title">🎧 Análise Estéreo & Espectral</div>
                    ${col2}
                </div>
                        <div class="card">
                    <div class="card-title">🏆 Scores & Diagnóstico</div>
                    ${scoreRows}
                    ${col3}
                </div>
                        <div class="card">
                            <div class="card-title">🧠 Métricas Avançadas</div>
                            ${advancedMetricsCard()}
                        </div>
                        <div class="card card-span-2">
                            <div class="card-title">⚠️ Problemas Técnicos</div>
                            ${techProblems()}
                        </div>
                        <div class="card card-span-2">
                            <div class="card-title">🩺 Diagnóstico & Sugestões</div>
                            ${diagCard()}
                        </div>
            </div>
        `;
    
    try { renderReferenceComparisons(analysis); } catch(e){ console.warn('ref compare fail', e);}    
    __dbg('📊 Resultados exibidos no modal');
}

function renderReferenceComparisons(analysis) {
    const container = document.getElementById('referenceComparisons');
    if (!container) return;
    const ref = __activeRefData;
    if (!ref) { container.innerHTML = '<div style="font-size:12px;opacity:.6">Referências não carregadas</div>'; return; }
    const tech = analysis.technicalData || {};
    // Mapeamento de métricas
    const rows = [];
    const nf = (n, d=2) => Number.isFinite(n) ? n.toFixed(d) : '—';
    const pushRow = (label, val, target, tol, unit='') => {
        if (!Number.isFinite(val) || !Number.isFinite(target)) return;
        const diff = val - target;
        const within = Number.isFinite(tol) ? Math.abs(diff) <= tol : false;
        rows.push(`<tr>
            <td>${label}</td>
            <td>${nf(val)}${unit}</td>
            <td>${nf(target)}${unit}${tol!=null?`<span class="tol">±${nf(tol,2)}</span>`:''}</td>
            <td class="${within?'ok':'warn'}">${diff>0?'+':''}${nf(diff)}${unit}</td>
        </tr>`);
    };
    pushRow('LUFS Int.', tech.lufsIntegrated ?? tech.rms, ref.lufs_target, ref.tol_lufs, '');
    pushRow('True Peak', tech.truePeakDbtp ?? tech.peak, ref.true_peak_target, ref.tol_true_peak, '');
    pushRow('DR', tech.dynamicRange, ref.dr_target, ref.tol_dr, '');
    pushRow('LRA', tech.lra, ref.lra_target, ref.tol_lra, '');
    pushRow('Stereo Corr.', tech.stereoCorrelation, ref.stereo_target, ref.tol_stereo, '');
    // Bandas detalhadas Fase 2: priorizar bandEnergies completas se disponíveis
    const preferLog = (typeof window !== 'undefined' && window.USE_LOG_BAND_ENERGIES === true);
    const bandEnergies = (preferLog ? (tech.bandEnergiesLog || tech.bandEnergies) : tech.bandEnergies) || null;
    if (bandEnergies && ref.bands) {
        for (const [band, refBand] of Object.entries(ref.bands)) {
            const bLocal = bandEnergies[band];
            if (bLocal && Number.isFinite(bLocal.rms_db)) {
                pushRow(band, bLocal.rms_db, refBand.target_db, refBand.tol_db);
            }
        }
    } else {
        // Fallback antigo: tonalBalance simplificado
        const tb = tech.tonalBalance || {};
        const bandMap = { sub:'sub', low:'low_bass', mid:'mid', high:'brilho' };
        Object.entries(bandMap).forEach(([tbKey, refBand]) => {
            const bData = tb[tbKey];
            const refBandData = ref.bands?.[refBand];
            if (bData && refBandData && Number.isFinite(bData.rms_db)) {
                pushRow(`${tbKey.toUpperCase()}`, bData.rms_db, refBandData.target_db, refBandData.tol_db);
            }
        });
    }
    container.innerHTML = `<div class="card" style="margin-top:12px;">
        <div class="card-title">📌 Comparação de Referência (${window.PROD_AI_REF_GENRE})</div>
        <table class="ref-compare-table">
            <thead><tr>
                <th>Métrica</th><th>Valor</th><th>Alvo</th><th>Δ</th>
            </tr></thead>
            <tbody>${rows.join('') || '<tr><td colspan="4" style="opacity:.6">Sem métricas disponíveis</td></tr>'}</tbody>
        </table>
    </div>`;
    // Estilos injetados uma vez
    if (!document.getElementById('refCompareStyles')) {
        const style = document.createElement('style');
        style.id = 'refCompareStyles';
        style.textContent = `
        .ref-compare-table{width:100%;border-collapse:collapse;font-size:11px;}
    .ref-compare-table th{font-weight:500;text-align:left;padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.12);font-size:11px;color:#fff;letter-spacing:.3px;}
    .ref-compare-table td{padding:5px 6px;border-bottom:1px solid rgba(255,255,255,.06);color:#f5f7fa;} 
        .ref-compare-table tr:last-child td{border-bottom:0;} 
    .ref-compare-table td.ok{color:#52f7ad;font-weight:600;} 
    .ref-compare-table td.warn{color:#ff7b7b;font-weight:600;} 
    .ref-compare-table .tol{opacity:.7;margin-left:4px;font-size:10px;color:#b8c2d6;} 
    .ref-compare-table tbody tr:hover td{background:rgba(255,255,255,.04);} 
        `;
        document.head.appendChild(style);
    }
}

// 🎨 Estilos do seletor de gênero (injeção única, não quebra CSS existente)
function injectRefGenreStyles() {
    if (document.getElementById('refGenreEnhancedStyles')) return; // já injetado
    const style = document.createElement('style');
    style.id = 'refGenreEnhancedStyles';
    style.textContent = `
    #audioRefGenreContainer{position:relative;gap:10px;padding:6px 10px 4px 10px;border:1px solid rgba(255,255,255,.06);background:linear-gradient(145deg,#0c111b,#0d1321);border-radius:10px;box-shadow:0 2px 6px -2px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,0.02);}
    #audioRefGenreContainer label{font-weight:500;letter-spacing:.3px;color:#9fb3d9;margin-right:4px;}
    #audioRefGenreSelect{appearance:none;-webkit-appearance:none;-moz-appearance:none;position:relative;padding:6px 32px 6px 12px;font-size:12px;line-height:1.2;background:rgba(20,32,54,.7);color:#f4f7fb;border:1px solid #1e2b40;border-radius:8px;cursor:pointer;font-family:inherit;transition:border .25s, background .25s, box-shadow .25s;min-width:140px;}
    #audioRefGenreSelect:hover{background:rgba(28,44,76,.85);}
    #audioRefGenreSelect:focus{outline:none;border-color:#249dff;box-shadow:0 0 0 2px rgba(36,157,255,.3);}
    #audioRefGenreSelect:active{transform:translateY(1px);} 
    #audioRefGenreContainer::after{content:"";position:absolute;top:13px;left: calc(10px + 140px);pointer-events:none;}
    #audioRefGenreContainer .select-wrap{position:relative;}
    /* Seta custom */
    #audioRefGenreContainer .select-wrap:after{content:"";position:absolute;right:12px;top:50%;width:7px;height:7px;border-right:2px solid #9fb3d9;border-bottom:2px solid #9fb3d9;transform:translateY(-60%) rotate(45deg);pointer-events:none;transition:transform .25s,border-color .25s;}
    #audioRefGenreSelect:focus + .arrow, #audioRefGenreContainer .select-wrap:focus-within:after{border-color:#53c2ff;}
    #audioRefStatus{font-size:11px;font-weight:500;letter-spacing:.4px;padding:4px 10px;border-radius:7px;background:#0d6efd;color:#fff;display:inline-flex;align-items:center;gap:6px;box-shadow:0 0 0 1px rgba(255,255,255,.06),0 2px 4px -1px rgba(0,0,0,.7);}
    #audioRefStatus::before{content:"";width:7px;height:7px;border-radius:50%;background:#3df29b;box-shadow:0 0 0 3px rgba(61,242,155,.25);} 
    #audioRefGenreContainer.dark #audioRefStatus{background:#14324f;}
    @media (max-width:600px){#audioRefGenreContainer{padding:6px 8px 4px 8px;gap:6px;}#audioRefGenreSelect{min-width:120px;padding:6px 28px 6px 10px;}}
    `;
    // Wrap opcional para setinha sem mexer HTML: inserir span ao redor do select
    const select = document.getElementById('audioRefGenreSelect');
    if (select && !select.parentElement.classList.contains('select-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'select-wrap';
        wrap.style.position = 'relative';
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);
    }
    document.head.appendChild(style);
}

// 🤖 Enviar análise para chat
window.sendModalAnalysisToChat = async function sendModalAnalysisToChat() {
    __dbg('🎯 BOTÃO CLICADO: Pedir Ajuda à IA');
    
    if (!currentModalAnalysis) {
        alert('Nenhuma análise disponível');
        __dbg('❌ Erro: currentModalAnalysis não existe');
        return;
    }
    
    __dbg('🤖 Enviando análise para chat...', currentModalAnalysis);
    
    try {
        // Gerar prompt personalizado baseado nos problemas encontrados
        const prompt = window.audioAnalyzer.generateAIPrompt(currentModalAnalysis);
        const message = `🎵 Analisei meu áudio e preciso de ajuda para melhorar. Aqui estão os dados técnicos:\n\n${prompt}`;
        
        __dbg('📝 Prompt gerado:', message.substring(0, 200) + '...');
        
        // Tentar diferentes formas de integrar com o chat
        let messageSent = false;
        
        // Método 1: Usar diretamente o ProdAI Chatbot quando disponível
        if (window.prodAIChatbot) {
            __dbg('🎯 Tentando enviar via ProdAI Chatbot...');
            try {
                // Se o chat ainda não está ativo, ativar com a mensagem
                if (!window.prodAIChatbot.isActive && typeof window.prodAIChatbot.activateChat === 'function') {
                    __dbg('🚀 Chat inativo. Ativando com a primeira mensagem...');
                    await window.prodAIChatbot.activateChat(message);
                    showTemporaryFeedback('🎵 Análise enviada para o chat!');
                    closeAudioModal();
                    messageSent = true;
                } else if (typeof window.prodAIChatbot.sendMessage === 'function') {
                    // Chat já ativo: preencher input ativo e enviar
                    const activeInput = document.getElementById('chatbotActiveInput');
                    if (activeInput) {
                        activeInput.value = message;
                        activeInput.focus();
                        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        await window.prodAIChatbot.sendMessage();
                        showTemporaryFeedback('🎵 Análise enviada para o chat!');
                        closeAudioModal();
                        messageSent = true;
                    }
                }
            } catch (err) {
                __dwrn('⚠️ Falha ao usar ProdAIChatbot direto, tentando fallback...', err);
            }
        }
        // Método 2: Inserir diretamente no input e simular envio
        else {
            __dbg('🎯 Tentando método alternativo...');
            
            const input = document.getElementById('chatbotActiveInput') || document.getElementById('chatbotMainInput');
            const sendBtn = document.getElementById('chatbotActiveSendBtn') || document.getElementById('chatbotSendButton');
            
            __dbg('🔍 Elementos encontrados:', { input: !!input, sendBtn: !!sendBtn });
            
            if (input && sendBtn) {
                input.value = message;
                input.focus();
                
                // Disparar eventos para simular interação do usuário
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Aguardar um pouco e clicar no botão
                setTimeout(() => {
                    sendBtn.click();
                    __dbg('✅ Botão clicado');
                    showTemporaryFeedback('🎵 Análise enviada para o chat!');
                    closeAudioModal();
                }, 500);
                
                messageSent = true;
            }
        }
        
        if (!messageSent) {
            __dbg('❌ Não foi possível enviar automaticamente, copiando para clipboard...');
            
            // Fallback: copiar para clipboard
            await navigator.clipboard.writeText(message);
            showTemporaryFeedback('📋 Análise copiada! Cole no chat manualmente.');
            __dbg('📋 Mensagem copiada para clipboard como fallback');
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar análise para chat:', error);
        showTemporaryFeedback('❌ Erro ao enviar análise. Tente novamente.');
    }
}

// � Mostrar feedback temporário
// (definição duplicada de showTemporaryFeedback removida — mantida a versão consolidada abaixo)

// �📄 Baixar relatório do modal
function downloadModalAnalysis() {
    if (!currentModalAnalysis) {
        alert('Nenhuma análise disponível');
        return;
    }
    
    console.log('📄 Baixando relatório...');
    
    try {
        const report = generateDetailedReport(currentModalAnalysis);
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `prod_ai_audio_analysis_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Relatório baixado com sucesso');
        showTemporaryFeedback('📄 Relatório baixado!');
        
    } catch (error) {
        console.error('❌ Erro ao baixar relatório:', error);
        alert('Erro ao gerar relatório');
    }
}

// 📋 Gerar relatório detalhado
function generateDetailedReport(analysis) {
    const now = new Date();
    let report = `🎵 PROD.AI - RELATÓRIO DE ANÁLISE DE ÁUDIO\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `📅 Data: ${now.toLocaleString('pt-BR')}\n`;
    report += `🔬 Análise realizada com tecnologia Web Audio API\n\n`;
    
    report += `📊 DADOS TÉCNICOS PRINCIPAIS:\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `Peak Level: ${analysis.technicalData.peak.toFixed(2)} dB\n`;
    report += `RMS Level: ${analysis.technicalData.rms.toFixed(2)} dB\n`;
    report += `Dynamic Range: ${analysis.technicalData.dynamicRange.toFixed(2)} dB\n`;
    report += `Duration: ${analysis.duration.toFixed(2)} seconds\n`;
    report += `Sample Rate: ${analysis.sampleRate || 'N/A'} Hz\n`;
    report += `Channels: ${analysis.channels || 'N/A'}\n\n`;
    
    if (analysis.technicalData.dominantFrequencies.length > 0) {
        report += `🎯 FREQUÊNCIAS DOMINANTES:\n`;
        report += `${'-'.repeat(30)}\n`;
        analysis.technicalData.dominantFrequencies.slice(0, 10).forEach((freq, i) => {
            report += `${i + 1}. ${Math.round(freq.frequency)} Hz (${freq.occurrences} ocorrências)\n`;
        });
        report += `\n`;
    }
    
    if (analysis.problems.length > 0) {
        report += `🚨 PROBLEMAS DETECTADOS:\n`;
        report += `${'-'.repeat(30)}\n`;
        analysis.problems.forEach((problem, i) => {
            report += `${i + 1}. PROBLEMA: ${problem.message}\n`;
            report += `   SOLUÇÃO: ${problem.solution}\n`;
            report += `   SEVERIDADE: ${problem.severity}\n\n`;
        });
    }
    
    if (analysis.suggestions.length > 0) {
        report += `💡 SUGESTÕES DE MELHORIA:\n`;
        report += `${'-'.repeat(30)}\n`;
        analysis.suggestions.forEach((suggestion, i) => {
            report += `${i + 1}. ${suggestion.message}\n`;
            report += `   AÇÃO: ${suggestion.action}\n`;
            report += `   TIPO: ${suggestion.type}\n\n`;
        });
    }
    
    report += `📝 OBSERVAÇÕES TÉCNICAS:\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `• Esta análise foi realizada usando Web Audio API\n`;
    report += `• Para análises mais avançadas, considere usar ferramentas profissionais\n`;
    report += `• Valores de referência: RMS ideal para streaming: -14 LUFS\n`;
    report += `• Peak ideal: máximo -1 dB para evitar clipping\n`;
    report += `• Dynamic range ideal: entre 8-15 dB para música popular\n\n`;
    
    report += `🎵 Gerado por PROD.AI - Seu mentor de produção musical\n`;
    report += `📱 Para mais análises: prod-ai-teste.vercel.app\n`;
    
    return report;
}

// 💬 Mostrar feedback temporário
function showTemporaryFeedback(message) {
    // Criar elemento de feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00d4ff, #0096cc);
        color: #000;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
    `;
    feedback.textContent = message;
    
    // Adicionar animação CSS
    if (!document.getElementById('feedbackStyles')) {
        const style = document.createElement('style');
        style.id = 'feedbackStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    // Remover após 3 segundos
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 3000);
}

__dbg('🎵 Audio Analyzer Integration Script carregado!');

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    __dbg('🎵 DOM carregado, inicializando Audio Analyzer...');
    initializeAudioAnalyzerIntegration();
});

// Fallback: se o DOM já estiver carregado
if (document.readyState !== 'loading') {
    // se DOM já pronto, inicializar uma vez
    initializeAudioAnalyzerIntegration();
}
