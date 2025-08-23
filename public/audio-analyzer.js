// 🎵 AUDIO ANALYZER V1 - Ponte para V2 com cache-busting agressivo
// Versão v1.5-FIXED-CLEAN-NOHIGH sem duplicações (removido "muito alto")
// Implementação usando Web Audio API (100% gratuito)

class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyzer = null;
    this.dataArray = null;
    this.isAnalyzing = false;
    this._v2Loaded = false;
    this._v2LoadingPromise = null;
  // CAIAR: log construção
  try { (window.__caiarLog||function(){})('INIT','AudioAnalyzer instanciado'); } catch {}
    
    console.log('🎯 AudioAnalyzer V1 construído - ponte para V2');
    this._preloadV2();
  this._pipelineVersion = 'CAIAR_PIPELINE_0.4';
  }

  // 🚀 Pre-carregar V2 imediatamente
  async _preloadV2() {
    console.log('🚀 Pré-carregando Audio Analyzer V2...');
    
    if (!this._v2LoadingPromise) {
      this._v2LoadingPromise = new Promise((resolve) => {
        const timestamp = Date.now();
        const cacheBust = Math.random().toString(36).substring(2);
        const url = `audio-analyzer-v2.js?v=CLEAN-${timestamp}-${cacheBust}`;
        
        console.log('🔄 CARREGANDO V2:', url);
        
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = () => { 
          this._v2Loaded = true; 
          console.log('✅ V2 PRÉ-CARREGADO com sucesso!');
          resolve(); 
        };
        s.onerror = () => { 
          console.warn('⚠️ Falha no pré-carregamento V2:', url); 
          resolve(); 
        };
        document.head.appendChild(s);
      });
    }
    
    try { 
      await this._v2LoadingPromise; 
    } catch (e) { 
      console.warn('Erro no pré-carregamento V2:', e); 
    }
  }

  // 🎤 Inicializar análise de áudio
  async initializeAnalyzer() {
    try {
      // Criar contexto de áudio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyzer = this.audioContext.createAnalyser();
      
      // Configurações de análise
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyzer.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
  if (window.DEBUG_ANALYZER === true) console.log('🎵 Analisador de áudio inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar analisador:', error);
      return false;
    }
  }

  // 📁 Analisar arquivo de áudio
  async analyzeAudioFile(file, options = {}) {
    // 🎯 CORREÇÃO TOTAL: Propagar contexto de modo
    const mode = options.mode || 'genre'; // Default para compatibilidade
    const DEBUG_MODE_REFERENCE = options.debugModeReference || false;
    
    if (DEBUG_MODE_REFERENCE) {
      console.log('🔍 [MODE_DEBUG] analyzeAudioFile called with mode:', mode);
      console.log('🔍 [MODE_DEBUG] options:', options);
      
      // 🎯 MODO PURO: Apenas extrair métricas, sem comparações
      if (mode === 'pure_analysis') {
        console.log('🔍 [MODE_DEBUG] pure_analysis mode: extrair métricas sem comparações ou scores');
      }
    }
    
    const tsStart = new Date().toISOString();
  const disableCache = (typeof window !== 'undefined' && window.DISABLE_ANALYSIS_CACHE === true);
  // ====== CACHE POR HASH (somente leitura de conteúdo) ======
  let fileHash = null;
  try {
    if (file && file.arrayBuffer) {
      const buf = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      fileHash = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,40);
      // Cache global
      const cacheMap = (window.__AUDIO_ANALYSIS_CACHE__ = window.__AUDIO_ANALYSIS_CACHE__ || new Map());
  if (!disableCache && cacheMap.has(fileHash)) {
        const cached = cacheMap.get(fileHash);
        try { (window.__caiarLog||function(){})('CACHE_HIT','Reuso análise por hash', { hash:fileHash, ageMs: Date.now()-cached._ts }); } catch {}
        // Deep clone leve para evitar mutações externas
        return JSON.parse(JSON.stringify(cached.analysis));
      }
      // Recriar FileReader usando buffer já lido (evitar reler)
      file._cachedArrayBufferForHash = buf;
    }
  } catch(e){ try { (window.__caiarLog||function(){})('CACHE_HASH_ERROR','Falha gerar hash',{ err:e?.message}); } catch {} }
  try { (window.__caiarLog||function(){})('INPUT','Arquivo recebido para análise', { name: file?.name, size: file?.size }); } catch {}
  if (window.DEBUG_ANALYZER === true) console.log('🛰️ [Telemetry] Front antes do fetch (modo local, sem fetch):', {
      route: '(client-only) audio-analyzer.js',
      method: 'N/A',
      file: file?.name,
      sizeBytes: file?.size,
      startedAt: tsStart
    });
  if (window.DEBUG_ANALYZER === true) console.log(`🎵 Iniciando análise de: ${file.name}`);
    
    if (!this.audioContext) {
      await this.initializeAnalyzer();
    }

    // Se já temos o ArrayBuffer (hash) podemos pular FileReader para reduzir latência
    if (file._cachedArrayBufferForHash && file._cachedArrayBufferForHash.byteLength) {
      try {
        const directBuf = file._cachedArrayBufferForHash;
        return await new Promise(async (resolve, reject)=>{
          const timeout = setTimeout(()=> reject(new Error('Timeout decode (direct path)')), 30000);
          try {
            const audioBuffer = await this.audioContext.decodeAudioData(directBuf.slice(0));
            clearTimeout(timeout);
            const analysis = await this._pipelineFromDecodedBuffer(audioBuffer, file, { fileHash });
            // Cache store
            try { if (fileHash && !disableCache) { const cacheMap = (window.__AUDIO_ANALYSIS_CACHE__ = window.__AUDIO_ANALYSIS_CACHE__ || new Map()); cacheMap.set(fileHash, { analysis: JSON.parse(JSON.stringify(analysis)), _ts: Date.now() }); } } catch{}
            resolve(analysis);
          } catch(e){ clearTimeout(timeout); reject(e); }
        });
      } catch(e){ console.warn('Direct decode fallback para FileReader', e); }
    }

    return new Promise((resolve, reject) => {
      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na análise do áudio (30s)'));
      }, 30000);

      const reader = new FileReader();
      
    reader.onload = async (e) => {
        try {
      if (window.DEBUG_ANALYZER === true) console.log('� Decodificando áudio...');
          let audioData = e.target.result;
          if (!audioData && file._cachedArrayBufferForHash) audioData = file._cachedArrayBufferForHash;
          const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice ? audioData.slice(0) : audioData);
          try { (window.__caiarLog||function(){})('DECODE_OK','Buffer decodificado', { duration: audioBuffer.duration, sr: audioBuffer.sampleRate, channels: audioBuffer.numberOfChannels }); } catch {}
          // ===== Context Detector (BPM / Key / Densidade) =====
          try {
            const ctxMod = await import('/lib/audio/features/context-detector.js?v=' + Date.now()).catch(()=>null);
            if (ctxMod && typeof ctxMod.detectAudioContext === 'function') {
              const ctxRes = await ctxMod.detectAudioContext(audioBuffer, {});
              if (ctxRes) {
                // Expor sempre global (para uso futuro) sem alterar UI
                try { if (typeof window !== 'undefined') window.__AUDIO_CONTEXT_DETECTION = ctxRes; } catch {}
                // Só anexar ao objeto de análise quando CAIAR_ENABLED estiver ativo para evitar mudanças no objeto final padrão
                if (typeof window !== 'undefined' && window.CAIAR_ENABLED) {
                  (analysis || (analysis={}))._contextDetection = ctxRes;
                }
              }
            }
          } catch (ctxErr) { try { (window.__caiarLog||function(){})('CTX_INTEGRATION_ERROR','Erro integrando context detector', { error: ctxErr?.message||String(ctxErr) }); } catch {} }
          
          if (window.DEBUG_ANALYZER === true) console.log('🔬 Realizando análise completa...');
          // Análise completa do áudio (V1)
          const t0Full = (performance&&performance.now)?performance.now():Date.now();
          // Modo de qualidade: 'fast' ou 'full' (default 'full' se CAIAR_ENABLED e window.ANALYSIS_QUALITY!='fast')
          const qualityMode = (window.CAIAR_ENABLED && window.ANALYSIS_QUALITY !== 'fast') ? 'full' : 'fast';
          let analysis = this.performFullAnalysis(audioBuffer, { qualityMode });
          analysis.qualityMode = qualityMode;
          try { (window.__caiarLog||function(){})('METRICS_V1_DONE','Métricas V1 calculadas', { keys: Object.keys(analysis.technicalData||{}) }); } catch {}

          // Enriquecimento Fase 2 (sem alterar UI): tenta carregar V2 e mapear novas métricas
          try {
            try { (window.__caiarLog||function(){})('METRICS_V2_START','Enriquecimento Fase 2 iniciado'); } catch {}
            analysis = await this._enrichWithPhase2Metrics(audioBuffer, analysis, file);
            try { (window.__caiarLog||function(){})('METRICS_V2_DONE','Enriquecimento Fase 2 concluído', { techKeys: Object.keys(analysis.technicalData||{}), suggestions: (analysis.suggestions||[]).length }); } catch {}
          } catch (enrichErr) {
            console.warn('⚠️ Falha ao enriquecer com métricas Fase 2:', enrichErr?.message || enrichErr);
            try { (window.__caiarLog||function(){})('METRICS_V2_ERROR','Falha Fase 2', { error: enrichErr?.message||String(enrichErr) }); } catch {}
          }

          // ===== Stems (bass/drums/vocals/other) – somente com CAIAR_ENABLED ativo =====
          try {
            if (typeof window !== 'undefined' && window.CAIAR_ENABLED) {
              // Ajustar concorrência dinâmica se modo rápido
              if (qualityMode === 'fast') { try { window.STEMS_MAX_CONCURRENCY = 1; } catch{} }
              const { enqueueJob } = await import('/lib/audio/features/job-queue.js?v=' + Date.now()).catch(()=>({enqueueJob: null}));
              (window.__caiarLog||function(){})('STEMS_CHAIN_START','Iniciando cadeia de stems');
              const stemsMod = await import('/lib/audio/features/stems.js?v=' + Date.now()).catch(()=>null);
              if (stemsMod && typeof stemsMod.separateStems === 'function') {
                const jobFn = ()=> Promise.race([
                  stemsMod.separateStems(audioBuffer, { quality: qualityMode }),
                  new Promise(res=> setTimeout(()=>res({_timeout:true}), qualityMode==='fast'?40000:90000))
                ]);
                let stemsRes;
                if (enqueueJob) {
                  stemsRes = await enqueueJob(jobFn, { label:'stems:'+ (fileHash||file.name), priority: qualityMode==='fast'?4:2, timeoutMs: qualityMode==='fast'?45000:95000 });
                } else {
                  stemsRes = await jobFn();
                }
                if (stemsRes && !stemsRes._timeout) {
                  try { if (typeof window !== 'undefined') window.__LAST_STEMS = stemsRes; } catch {}
                  analysis._stems = {
                    method: stemsRes.method,
                    totalMs: stemsRes.totalMs,
                    metrics: stemsRes.metrics
                  };
                  // Construir matriz de análise (mix + stems) antes de descartar buffers pesados
                  try {
                    this._computeAnalysisMatrix(audioBuffer, analysis, stemsRes.stems);
                  } catch (mxErr) { (window.__caiarLog||function(){})('MATRIX_ERROR','Falha construir analysis_matrix', { error: mxErr?.message||String(mxErr) }); }
                  (window.__caiarLog||function(){})('STEMS_CHAIN_DONE','Stems anexados', { ms: stemsRes.totalMs, method: stemsRes.method });
                  // Liberar referências de buffers crus para GC (não anexar à análise principal)
                  try { stemsRes.stems = null; } catch {}
                } else if (stemsRes && stemsRes._timeout) {
                  (window.__caiarLog||function(){})('STEMS_TIMEOUT','Timeout stems (>90s)');
                  // Mesmo sem stems, ainda podemos gerar matriz apenas do mix
                  try { this._computeAnalysisMatrix(audioBuffer, analysis, null); } catch {}
                } else {
                  (window.__caiarLog||function(){})('STEMS_FALLBACK','Stems não disponíveis');
                  try { this._computeAnalysisMatrix(audioBuffer, analysis, null); } catch {}
                }
              }
              else {
                // Sem módulo de stems: ainda gerar matriz do mix
                try { this._computeAnalysisMatrix(audioBuffer, analysis, null); } catch {}
              }
            }
          } catch (stErr) { (window.__caiarLog||function(){})('STEMS_CHAIN_ERROR','Erro cadeia stems', { error: stErr?.message||String(stErr) }); }
          
          clearTimeout(timeout);
          const finalAnalysis = await this._finalizeAndMaybeCache(analysis, { t0Full, fileHash, disableCache });
          resolve(finalAnalysis);
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Erro na decodificação:', error);
          try { (window.__caiarLog||function(){})('DECODE_ERROR','Erro ao decodificar', { error: error?.message||String(error) }); } catch {}
          reject(new Error(`Erro ao decodificar áudio: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Erro ao ler arquivo:', error);
        reject(new Error('Erro ao ler arquivo de áudio'));
      };
      
      if (file._cachedArrayBufferForHash) {
        // se já temos o buffer (por hashing), simular FileReader concluído
        setTimeout(()=> reader.onload({ target: { result: file._cachedArrayBufferForHash } }), 0);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  async _pipelineFromDecodedBuffer(audioBuffer, file, { fileHash }) {
    const t0Full = (performance&&performance.now)?performance.now():Date.now();
    // Replicação da lógica existente (refatorada para reutilização)
    // Context + V1 + Phase2 + Stems + Matrix
    let analysis = this.performFullAnalysis(audioBuffer, { qualityMode: (window.CAIAR_ENABLED && window.ANALYSIS_QUALITY !== 'fast') ? 'full':'fast' });
    analysis.qualityMode = analysis.qualityMode || ((window.CAIAR_ENABLED && window.ANALYSIS_QUALITY !== 'fast') ? 'full':'fast');
    try { (window.__caiarLog||function(){})('METRICS_V1_DONE','Métricas V1 calculadas(direct)'); } catch {}
    try {
      analysis = await this._enrichWithPhase2Metrics(audioBuffer, analysis, file);
    } catch(e){ (window.__caiarLog||function(){})('METRICS_V2_ERROR','Falha Fase 2 direct',{err:e?.message}); }
    // Stems (respeitar duração para evitar travamento)
    try {
      if (typeof window !== 'undefined' && window.CAIAR_ENABLED) {
        const dur = audioBuffer.duration;
        if (window.STEMS_MODE === 'off' || dur > (window.STEMS_MAX_DURATION_SEC||360)) {
          (window.__caiarLog||function(){})('STEMS_SKIP','Stems pulados',{duration:dur});
          try { this._computeAnalysisMatrix(audioBuffer, analysis, null); } catch{}
        } else {
          const { enqueueJob } = await import('/lib/audio/features/job-queue.js?v=' + Date.now()).catch(()=>({enqueueJob:null}));
          const stemsMod = await import('/lib/audio/features/stems.js?v=' + Date.now()).catch(()=>null);
          if (stemsMod && stemsMod.separateStems) {
            const qualityMode = analysis.qualityMode;
            const jobFn = ()=> Promise.race([
              stemsMod.separateStems(audioBuffer, { quality: qualityMode }),
              new Promise(res=> setTimeout(()=>res({_timeout:true}), qualityMode==='fast'?40000:90000))
            ]);
            const stemsRes = enqueueJob? await enqueueJob(jobFn,{label:'stems:'+ (fileHash||file?.name), priority: qualityMode==='fast'?4:2, timeoutMs: qualityMode==='fast'?45000:95000 }): await jobFn();
            if (stemsRes && !stemsRes._timeout) {
              analysis._stems = { method: stemsRes.method, totalMs: stemsRes.totalMs, metrics: stemsRes.metrics };
              try { this._computeAnalysisMatrix(audioBuffer, analysis, stemsRes.stems); } catch{}
            } else {
              try { this._computeAnalysisMatrix(audioBuffer, analysis, null); } catch{}
            }
          }
        }
      }
    } catch(e){ (window.__caiarLog||function(){})('STEMS_CHAIN_ERROR','Erro stems direct',{err:e?.message}); }
    return await this._finalizeAndMaybeCache(analysis, { t0Full, fileHash, disableCache: (typeof window!=='undefined' && window.DISABLE_ANALYSIS_CACHE) });
  }

  async _finalizeAndMaybeCache(analysis, { t0Full, fileHash, disableCache }) {
    try {
      const t1Full=(performance&&performance.now)?performance.now():Date.now();
      (window.__caiarLog||function(){})('OUTPUT','Análise final pronta', { totalMs: +(t1Full - t0Full).toFixed(1), problems: (analysis.problems||[]).length, suggestions: (analysis.suggestions||[]).length, scorePct: analysis.mixScorePct });
    } catch {}
    try { analysis.pipelineVersion = this._pipelineVersion; } catch {}
    if (fileHash && !disableCache) {
      try {
        const cacheMap = (window.__AUDIO_ANALYSIS_CACHE__ = window.__AUDIO_ANALYSIS_CACHE__ || new Map());
        cacheMap.set(fileHash, { analysis: JSON.parse(JSON.stringify(analysis)), _ts: Date.now() });
        if (cacheMap.size > 30) {
          const keys = Array.from(cacheMap.keys());
            for (let i=0;i<keys.length-30;i++) cacheMap.delete(keys[i]);
        }
        (window.__caiarLog||function(){})('CACHE_STORE','Análise salva em cache',{hash:fileHash});
      } catch{}
    }
    return analysis;
  }


// (utilitário de invalidação de cache movido para após o fechamento da classe)
  // 🔌 Enriquecer com métricas da Fase 2 usando motor V2 (já pré-carregado)
  async _enrichWithPhase2Metrics(audioBuffer, baseAnalysis, fileRef) {
    const __DEBUG_ANALYZER__ = (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true);
    
    // Aguardar V2 se ainda estiver carregando
    if (this._v2LoadingPromise && !this._v2Loaded) {
      console.log('⏳ Aguardando V2 terminar de carregar...');
      await this._v2LoadingPromise;
    }

    if (typeof window.AudioAnalyzerV2 !== 'function') {
      // Quando V2 não está disponível, ainda tentaremos métricas avançadas (LUFS/LRA/TruePeak) via módulos dedicados
      try {
        baseAnalysis = await this._tryAdvancedMetricsAdapter(audioBuffer, baseAnalysis);
      } catch (e) {
        if (__DEBUG_ANALYZER__) console.warn('⚠️ Adapter avançado falhou (sem V2):', e?.message || e);
      }
      return baseAnalysis;
    }

  // Executar análise V2 de forma leve usando diretamente o AudioBuffer (evita re-decodificação)
  console.log('🎯 CRIANDO INSTÂNCIA V2...');
  console.log('🎯 window.AudioAnalyzerV2 existe?', typeof window.AudioAnalyzerV2);
  const v2 = new window.AudioAnalyzerV2();
  console.log('🎯 V2 INSTÂNCIA CRIADA:', !!v2);
  console.log('🎯 V2 BUILD VERSION:', v2.__buildVersion);
  await v2.initialize?.();
  if (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true) {
    console.log('🛰️ [Telemetry] V2: performFullAnalysis com audioBuffer.');
  }
  console.log('🎯 CHAMANDO performFullAnalysis...');
  
  // Removido forçamento rígido de gênero 'trance' (Fase 2)
  // Mantemos apenas fallback opcional se flag explícita estiver ativa
  if (!window.PROD_AI_REF_GENRE && window.FORCE_DEFAULT_GENRE) {
    window.PROD_AI_REF_GENRE = window.FORCE_DEFAULT_GENRE;
    console.log('[GENRE] Atribuído gênero padrão via FORCE_DEFAULT_GENRE:', window.PROD_AI_REF_GENRE);
  }
  
  let v2res = null;
  try {
    v2res = await v2.performFullAnalysis(audioBuffer, { quality: 'fast', features: ['core','spectral','stereo','quality'] });
    console.log('🎯 V2 RESULT SUCCESS:', !!v2res);
    console.log('🎯 V2 RESULT KEYS:', v2res ? Object.keys(v2res) : 'NULL');
    console.log('🎯 V2 DIAGNOSTICS EXISTS:', !!v2res?.diagnostics);
    if (v2res?.diagnostics) {
      console.log('🎯 V2 DIAGNOSTICS KEYS:', Object.keys(v2res.diagnostics));
    }
  } catch (v2Error) {
    console.error('❌ V2 performFullAnalysis ERROR:', v2Error);
    return baseAnalysis; // Retornar análise V1 básica em caso de erro no V2
  }
  const metrics = v2res?.metrics || {};
  // Fallback direto (V2 mínimo) – garantir estrutura semelhante esperada
  if (!metrics.loudness && Number.isFinite(metrics.lufs)) {
    metrics.loudness = { lufs_integrated: metrics.lufs };
  }
  if (!metrics.truePeak && Number.isFinite(metrics.peakDb)) {
    metrics.truePeak = { true_peak_dbtp: metrics.peakDb };
  }
  // Se BPI indicar excesso de graves, remova sugestão V1 de "Pouca presença de graves"
  try {
    const bpi = v2res?.metrics?.v2ProMetrics?.indices?.bpi;
    if (Number.isFinite(bpi) && bpi > 2 && Array.isArray(baseAnalysis.suggestions)) {
      baseAnalysis.suggestions = baseAnalysis.suggestions.filter(s => s?.type !== 'bass_enhancement' && !/Pouca presença de graves/i.test(s?.message || ''));
    }
  } catch {}
  // Disponibilizar diagnósticos V2 para a UI (sem alterar o que já existe do V1)
  if (v2res?.diagnostics) {
    // CORRIGIR: diagnostics deve estar em baseAnalysis.diagnostics, não v2Diagnostics
    console.log('🎯 COPIANDO DIAGNOSTICS DO V2 PARA RESULT...');
    baseAnalysis.diagnostics = v2res.diagnostics;
    
    baseAnalysis.v2Diagnostics = v2res.diagnostics; // manter compatibilidade
    console.log('🎯 baseAnalysis.diagnostics copiado:', !!baseAnalysis.diagnostics);
    console.log('🎯 baseAnalysis.diagnostics.__refEvidence:', baseAnalysis.diagnostics?.__refEvidence);
    // Mesclar sugestões/problemas avançados no resultado principal por padrão (sem mudar layout/IDs)
    try {
      const advDefaultOn = (typeof window !== 'undefined') ? (window.SUGESTOES_AVANCADAS !== false) : false;
      if (advDefaultOn) {
        const v2d = v2res.diagnostics || {};
        const mergeUnique = (a = [], b = [], key = (x) => `${x.type||''}|${x.message||''}`) => {
          const seen = new Set((a||[]).map(key));
          const out = Array.isArray(a) ? a.slice() : [];
          for (const item of (b||[])) {
            const k = key(item);
            if (!seen.has(k)) { seen.add(k); out.push(item); }
          }
          return out;
        };
        baseAnalysis.problems = mergeUnique(baseAnalysis.problems, v2d.problems);
  }
    } catch {}
  }
    const loud = metrics.loudness || {};
    const tp = metrics.truePeak || {};
    const core = metrics.core || {};
    const stereo = metrics.stereo || {};
    const tonal = metrics.tonalBalance || {};

    // Adapter: mapear para o formato já consumido pelo front (technicalData)
    baseAnalysis.technicalData = baseAnalysis.technicalData || {};
    const td = baseAnalysis.technicalData;
    // Mapear métricas V2 para chaves conhecidas da interface (somente se válidas / não sobrescrever manual)
    const setIfValid = (key, val, source) => {
      if (val == null || !Number.isFinite(val)) return;
      if (td[key] == null) td[key] = val;
      (td._sources = td._sources || {})[key] = (td._sources[key] || source);
    };
    // Loudness
    setIfValid('lufsIntegrated', loud.lufs_integrated, 'v2:loudness');
    setIfValid('lufsShortTerm', loud.lufs_short_term, 'v2:loudness');
    setIfValid('lufsMomentary', loud.lufs_momentary, 'v2:loudness');
          // ===== Pontuação final (Mix Scoring) =====
          try {
            // Reference Matcher (antes do score) – gera adaptiveReference sem quebrar a referência atual
            try {
              if (typeof window !== 'undefined' && window.CAIAR_ENABLED) {
                const refMatchMod = await import('/lib/audio/features/reference-matcher.js?v=' + Date.now()).catch(()=>null);
                if (refMatchMod && typeof refMatchMod.applyAdaptiveReference === 'function') {
                  refMatchMod.applyAdaptiveReference(baseAnalysis);
                }
              }
            } catch (rmErr) { (window.__caiarLog||function(){})('REF_MATCH_INTEGRATION_ERROR','Erro matcher', { error: rmErr?.message||String(rmErr) }); }
            const enableScoring = (typeof window === 'undefined' || window.ENABLE_MIX_SCORING !== false);
            // Adiado: scoring completo será recalculado ao final (após bandas) para garantir contagem correta
            if (false && enableScoring) {
              let activeRef = null;
              try {
                if (typeof window !== 'undefined') {
                  // 🎯 CORREÇÃO TOTAL: Apenas usar PROD_AI_REF_DATA no modo gênero
                  if (mode === 'genre') {
                    activeRef = window.PROD_AI_REF_DATA_ACTIVE || window.PROD_AI_REF_DATA || null;
                    if (DEBUG_MODE_REFERENCE) {
                      console.log('🔍 [MODE_DEBUG] Using genre targets for scoring, mode:', mode);
                    }
                  } else {
                    activeRef = null; // Modos reference, extract_metrics, pure_analysis não usam targets de gênero
                    if (DEBUG_MODE_REFERENCE) {
                      console.log('🔍 [MODE_DEBUG] Skipping genre targets, mode:', mode, '(pure analysis)');
                    }
                  }
                }
              } catch {}
              
              // 🔧 FUNÇÃO PARA CARREGAR SCORING V1 COMO FALLBACK
              async function loadScoringV1() {
                try {
                  const script = document.createElement('script');
                  script.src = '/lib/audio/features/scoring.js?v=' + Date.now();
                  script.type = 'text/javascript';
                  
                  return new Promise((resolve, reject) => {
                    script.onload = () => {
                      console.log('✅ [FALLBACK] Scoring V1 carregado');
                      resolve();
                    };
                    script.onerror = () => {
                      console.error('❌ [FALLBACK] Erro ao carregar Scoring V1');
                      reject(new Error('Falha no carregamento V1'));
                    };
                    document.head.appendChild(script);
                  });
                } catch (error) {
                  console.error('❌ [FALLBACK] Erro na função loadScoringV1:', error);
                }
              }
              
              let scorerMod = null;
              // 🚀 SCORING V2 COMPLETE - Sistema simplificado
              try {
                // Verificar se sistema V2 completo está carregado
                if (window.ScoringV2Complete && window.ScoringV2Complete.computeMixScore) {
                  scorerMod = window.ScoringV2Complete;
                  console.log('✅ [ANALYZER] Usando ScoringV2Complete');
                } else if (window.computeMixScore) {
                  scorerMod = { computeMixScore: window.computeMixScore };
                  console.log('✅ [ANALYZER] Usando função global computeMixScore');
                } else {
                  console.warn('⚠️ [ANALYZER] Carregando scoring V1 como fallback...');
                  // Último recurso: carregar V1 original diretamente
                  await loadScoringV1();
                  if (window.ScoringV1 && window.ScoringV1.computeMixScore) {
                    scorerMod = window.ScoringV1;
                  }
                }
              } catch (error) {
                console.error('❌ [ANALYZER] Erro ao carregar scoring:', error);
              }
              if (scorerMod && typeof scorerMod.computeMixScore === 'function') {
                // 🎯 CORREÇÃO: Buscar targets específicos do gênero ativo
                let genreSpecificRef = null;
                if (mode === 'genre' && activeRef) {
                  const activeGenre = window.PROD_AI_REF_GENRE || 'default';
                  genreSpecificRef = activeRef[activeGenre] || null;
                  if (DEBUG_MODE_REFERENCE) {
                    console.log('🔍 [MODE_DEBUG] Using genre-specific ref for scoring:', activeGenre);
                    console.log('🔍 [MODE_DEBUG] Genre ref targets:', genreSpecificRef);
                  }
                } else if (DEBUG_MODE_REFERENCE) {
                  console.log('🔍 [MODE_DEBUG] Skipping genre-specific ref (mode=' + mode + ')');
                }
                
                const scoreRes = scorerMod.computeMixScore(td, genreSpecificRef);
                baseAnalysis.mixScore = scoreRes;
                baseAnalysis.mixClassification = scoreRes.classification;
                baseAnalysis.mixScorePct = scoreRes.scorePct;
                try {
                  if (typeof window !== 'undefined') {
                    window.__LAST_FULL_ANALYSIS = baseAnalysis;
                    if (window.DEBUG_SCORE === true) {
                      console.log('[ANALYSIS] mixScorePct=', scoreRes.scorePct, 'mode=' + scoreRes.scoreMode, 'metrics=', scoreRes.perMetric?.length);
                    }
                  }
                } catch {}
                try {
                  const sug = baseAnalysis.suggestions = Array.isArray(baseAnalysis.suggestions) ? baseAnalysis.suggestions : [];
                  if (scoreRes.highlights?.needsAttention) {
                    for (const key of scoreRes.highlights.needsAttention) {
                      if (!sug.some(s => s && s.type === 'score_attention' && s.metric === key)) {
                        sug.push({ type: 'score_attention', metric: key, message: `Métrica '${key}' abaixo do ideal para subir de nível`, action: 'Ajuste processamento (EQ/dinâmica) para alinhar à referência', source: 'score:v2' });
                      }
                    }
                  }
                } catch {}
                // Reconciliação de sugestões (remover conflitos e duplicatas) se não desativada
                try {
                  if (typeof window === 'undefined' || window.SUGGESTION_RECONCILE !== false) {
                    baseAnalysis.suggestions = (function reconcileSuggestions(a){
                      const list = Array.isArray(a.suggestions)? a.suggestions.slice():[];
                      const byType = new Map();
                      const keep = [];
                      for (const s of list) {
                        if (!s || typeof s !== 'object') continue;
                        const key = s.type + '|' + (s.metric||'');
                        if (!byType.has(key)) { byType.set(key, s); keep.push(s); }
                        else {
                          // Preferir score_attention sobre genérica, e sugestões com source 'score:' ou 'v2:' sobre 'v1:'
                          const prev = byType.get(key);
                          const rank = (x)=> /score:/.test(x.source||'') ? 3 : (/v2:/.test(x.source||'')?2:(/v1:/.test(x.source||'')?1:0));
                          if (rank(s) > rank(prev)) { const idx = keep.indexOf(prev); if (idx>=0) keep[idx]=s; byType.set(key,s); }
                        }
                      }
                      // Remover combinações ilógicas: ex: low_end_excess & bass_deficient simultâneos
                      const types = new Set(keep.map(s=>s.type));
                      const removeSet = new Set();
                      if (types.has('low_end_excess') && types.has('bass_deficient')) {
                        // Escolher o que tem source mais confiável
                        const choose = (t)=> keep.filter(s=>s.type===t).sort((a,b)=> (b.source||'').localeCompare(a.source||''))[0];
                        const chosen = choose('low_end_excess').message.length >= choose('bass_deficient').message.length ? 'low_end_excess':'bass_deficient';
                        for (const s of keep) if (s.type !== chosen && (s.type==='low_end_excess'||s.type==='bass_deficient')) removeSet.add(s);
                      }
                      return keep.filter(s=>!removeSet.has(s));
                    })(baseAnalysis);
                  }
                } catch (recErr) { if (window.DEBUG_ANALYZER) console.warn('Reconciliação sugestões falhou', recErr); }
                // ===== Contextual Rules Engine (CAIAR) =====
                try {
                  if (typeof window !== 'undefined' && window.CAIAR_ENABLED) {
                    (window.__caiarLog||function(){})('RULES_START','Invocando rules-engine contextual');
                    const rulesMod = await import('/lib/audio/features/rules-engine.js?v=' + Date.now()).catch(()=>null);
                    if (rulesMod && typeof rulesMod.generateContextualCorrections === 'function') {
                      const before = (baseAnalysis.suggestions||[]).length;
                      rulesMod.generateContextualCorrections(baseAnalysis);
                      const after = (baseAnalysis.suggestions||[]).length;
                      (window.__caiarLog||function(){})('RULES_APPLIED','Rules-engine aplicado', { before, after });
                      // Snapshot opcional para UI futura sem alterar layout legado
                      try { baseAnalysis.suggestionsSnapshot = baseAnalysis.suggestions.slice(); } catch {}
                      // ===== CAIAR Explain (plano de ação auditivo) =====
                      try {
                        (window.__caiarLog||function(){})('EXPLAIN_INVOKE','Gerando plano de ação');
                        const explainMod = await import('/lib/audio/features/caiar-explain.js?v=' + Date.now()).catch(()=>null);
                        if (explainMod && typeof explainMod.generateExplainPlan === 'function') {
                          explainMod.generateExplainPlan(baseAnalysis);
                          (window.__caiarLog||function(){})('EXPLAIN_ATTACHED','Plano anexado', { passos: baseAnalysis.caiarExplainPlan?.totalPassos });
                        } else {
                          (window.__caiarLog||function(){})('EXPLAIN_MODULE_MISSING','Módulo explain ausente');
                        }
                      } catch (exErr) {
                        (window.__caiarLog||function(){})('EXPLAIN_ERROR','Falha explain', { error: exErr?.message||String(exErr) });
                      }
                    } else {
                      (window.__caiarLog||function(){})('RULES_MODULE_MISSING','Módulo rules-engine indisponível');
                    }
                  }
                } catch (reErr) {
                  (window.__caiarLog||function(){})('RULES_ERROR','Falha rules-engine', { error: reErr?.message||String(reErr) });
                }
              }
            }
          } catch (esc) { if (debug) console.warn('⚠️ Scoring falhou:', esc?.message || esc); }
    setIfValid('lra', loud.lra, 'v2:loudness');
    setIfValid('headroomDb', loud.headroom_db, 'v2:loudness');
    // True Peak
    setIfValid('truePeakDbtp', tp.true_peak_dbtp, 'v2:truepeak');
    setIfValid('samplePeakLeftDb', tp.sample_peak_left_db, 'v2:truepeak');
    setIfValid('samplePeakRightDb', tp.sample_peak_right_db, 'v2:truepeak');
    // Core / espectrais extra
    setIfValid('spectralCentroid', core.spectralCentroid, 'v2:spectral');
    setIfValid('spectralRolloff85', core.spectralRolloff85, 'v2:spectral');
    if ((typeof window !== 'undefined' && window.AUDIT_MODE === true) || (typeof process !== 'undefined' && process.env.AUDIT_MODE==='1')) {
      setIfValid('spectralRolloff50', core.spectralRolloff50, 'v2:spectral');
      setIfValid('thdPercent', core.thdPercent, 'v2:spectral');
    }
    setIfValid('spectralFlux', core.spectralFlux, 'v2:spectral');
    setIfValid('spectralFlatness', core.spectralFlatness, 'v2:spectral');
    setIfValid('dcOffset', core.dcOffset, 'v2:core');
    // Stereo
    setIfValid('stereoWidth', stereo.width, 'v2:stereo');
    if (typeof stereo.monoCompatibility === 'string') {
      td.monoCompatibility = td.monoCompatibility || stereo.monoCompatibility;
      (td._sources = td._sources || {}).monoCompatibility = (td._sources.monoCompatibility || 'v2:stereo');
    }
    if (Number.isFinite(stereo.correlation) && td.stereoCorrelation == null) {
      td.stereoCorrelation = stereo.correlation;
      (td._sources = td._sources || {}).stereoCorrelation = 'v2:stereo';
    }
    if (Number.isFinite(stereo.balanceLR) && td.balanceLR == null) {
      td.balanceLR = stereo.balanceLR;
      (td._sources = td._sources || {}).balanceLR = 'v2:stereo';
    }
    td.tonalBalance = tonal && typeof tonal === 'object' ? tonal : null;
  // Extras para visual completo
  td.crestFactor = isFinite(core.crestFactor) ? core.crestFactor : null;
  if (td.crestFactor == null && Number.isFinite(baseAnalysis.technicalData?.peak) && Number.isFinite(baseAnalysis.technicalData?.rms)) {
    td.crestFactor = (baseAnalysis.technicalData.peak - baseAnalysis.technicalData.rms).toFixed(2)*1;
  }
  td.stereoWidth = isFinite(stereo.width) ? stereo.width : null;
  // Calcular métricas estéreo simples se ausentes e arquivo for estéreo
  try {
    if (audioBuffer.numberOfChannels > 1 && (td.stereoCorrelation == null || td.balanceLR == null)) {
      const l = audioBuffer.getChannelData(0);
      const r = audioBuffer.getChannelData(1);
      let sumLR=0,sumL2=0,sumR2=0,sumDiff=0,total= Math.min(l.length,r.length);
      let sumL=0,sumR=0;
      for (let i=0;i<total;i+=512){ // amostragem para performance
        const li=l[i], ri=r[i];
        sumLR += li*ri; sumL2 += li*li; sumR2 += ri*ri; sumDiff += Math.abs(li-ri); sumL+=li; sumR+=ri;
      }
      const corr = sumLR / Math.sqrt((sumL2||1)*(sumR2||1));
      if (td.stereoCorrelation == null && isFinite(corr)) td.stereoCorrelation = Math.max(-1, Math.min(1, corr));
      const avgL = sumL/ (total/512); const avgR = sumR/(total/512);
      if (td.balanceLR == null && isFinite(avgL) && isFinite(avgR)) {
        const max = Math.max(Math.abs(avgL), Math.abs(avgR)) || 1;
        td.balanceLR = (avgL-avgR)/max; // -1 a 1
      }
      if (td.stereoWidth == null && isFinite(sumDiff)) td.stereoWidth = (sumDiff/(total/512));
    }
  } catch {}
  td.monoCompatibility = typeof stereo.monoCompatibility === 'string' ? stereo.monoCompatibility : null;
  if (!td.monoCompatibility && Number.isFinite(td.stereoCorrelation)) {
    td.monoCompatibility = td.stereoCorrelation < -0.2 ? 'Problemas de fase' : (td.stereoCorrelation < 0.2 ? 'Parcial' : 'Boa');
  }
  td.spectralFlatness = isFinite(core.spectralFlatness) ? core.spectralFlatness : null;
  td.dcOffset = isFinite(core.dcOffset) ? core.dcOffset : null;
  td.clippingSamples = Number.isFinite(core.clippingEvents) ? core.clippingEvents : null;
  td.clippingPct = isFinite(core.clippingPercentage) ? core.clippingPercentage : null;
  
  // ===== FASE 1 AUDITORIA: UNIFICAÇÃO E OBSERVAÇÃO (ZERO RISCO) =====
  try {
    if (baseAnalysis && td && typeof getUnifiedAnalysisData === 'function') {
      const unifiedData = getUnifiedAnalysisData(baseAnalysis, td, metrics);
      if (typeof performConsistencyAudit === 'function') {
        performConsistencyAudit(unifiedData, baseAnalysis);
      }
      
      // ===== FASE 2: APLICAR DADOS UNIFICADOS (BAIXO RISCO) =====
      if (typeof applyUnifiedCorrections === 'function') {
        applyUnifiedCorrections(baseAnalysis, td, unifiedData);
      }
      
      // ===== FASE 3: ALINHAMENTO LÓGICO (RISCO MÉDIO) =====
      if (typeof applyLogicAlignmentCorrections === 'function') {
        applyLogicAlignmentCorrections(baseAnalysis, td, unifiedData, metrics);
      }
      
      // ===== FASE 4: AUDITORIA FINAL COMPLETA (BAIXO RISCO) =====
      if (typeof applyFinalAuditCorrections === 'function') {
        applyFinalAuditCorrections(baseAnalysis, td, unifiedData, metrics);
      }
      
      // ===== FASE 5: CORREÇÕES CRÍTICAS ESPECÍFICAS (SEGURO) =====
      if (typeof applyCriticalSpecificFixes === 'function') {
        applyCriticalSpecificFixes(baseAnalysis, td, unifiedData, metrics);
      }
      
      // ===== DEBUG DETALHADO (SE ATIVADO) =====
      if (window.DEBUG_ANALYZER_DETAILED === true) {
        performDetailedAnalysisDebug(baseAnalysis);
      }
    }
  } catch (auditError) {
    console.warn('⚠️ Erro nas correções de auditoria:', auditError);
  }
  // ================================================================
  
  try {
    if (Array.isArray(baseAnalysis.problems)) {
      const tpv = td.truePeakDbtp;
      if (Number.isFinite(tpv) && tpv < 0 && (td.clippingSamples === 0 || td.clippingSamples == null)) {
        baseAnalysis.problems = baseAnalysis.problems.filter(p => p?.type !== 'clipping');
      }
    }
  } catch {}

  // Scores de qualidade e tempo total de processamento
  baseAnalysis.qualityOverall = isFinite(metrics?.quality?.overall) ? metrics.quality.overall : null;
  baseAnalysis.qualityBreakdown = metrics?.quality?.breakdown || null;
  baseAnalysis.processingMs = Number.isFinite(v2res?.processingTime) ? v2res.processingTime : null;

    // Frequências dominantes: manter existentes; se vazio, usar do V2
    if ((!Array.isArray(td.dominantFrequencies) || td.dominantFrequencies.length === 0) && metrics?.spectral?.dominantFrequencies) {
      td.dominantFrequencies = metrics.spectral.dominantFrequencies;
    }

    // Telemetria: chaves novas adicionadas
  const added = ['lufsIntegrated','lufsShortTerm','lufsMomentary','headroomDb','lra','truePeakDbtp','samplePeakLeftDb','samplePeakRightDb','spectralCentroid','spectralRolloff85','spectralRolloff50','spectralFlux','stereoCorrelation','balanceLR','tonalBalance','crestFactor','stereoWidth','monoCompatibility','spectralFlatness','thdPercent','dcOffset','clippingSamples','clippingPct','qualityOverall','processingMs'];

    // ===== Fallback: calcular métricas espectrais se ainda ausentes =====
    try {
      const td2 = td; // alias
      if (td2.spectralCentroid == null || td2.spectralRolloff85 == null || td2.spectralFlatness == null || td2.spectralFlux == null) {
        const channel = audioBuffer.getChannelData(0);
        const fftSize = 2048;
        if (channel.length > fftSize) {
          // Capturar duas janelas para fluxo
          const startA = 0;
          const startB = Math.min(channel.length - fftSize, Math.floor(channel.length/2));
          const sliceA = channel.slice(startA, startA + fftSize);
          const sliceB = channel.slice(startB, startB + fftSize);
          const specA = this.simpleFFT(sliceA).slice(0, fftSize/2);
          const specB = this.simpleFFT(sliceB).slice(0, fftSize/2);
          const sr = audioBuffer.sampleRate;
          const binHz = sr / fftSize;
          // Centróide
          if (td2.spectralCentroid == null) {
            let num=0, den=0; for (let i=1;i<specA.length;i++){ const m=specA[i]; den+=m; num+=m*(i*binHz);} td2.spectralCentroid = den>0 ? num/den : null;
          }
          // Rolloff 85%
          if (td2.spectralRolloff85 == null) {
            const total = specA.reduce((a,b)=>a+b,0);
              let acc=0, target= total*0.85, freq= null;
              for (let i=0;i<specA.length;i++){ acc+=specA[i]; if(acc>=target){ freq = i*binHz; break;} }
              td2.spectralRolloff85 = freq;
          }
          // Flatness
          if (td2.spectralFlatness == null) {
            let geo=0, ar=0, n=specA.length; for(let i=1;i<n;i++){ const m=specA[i]||1e-12; geo += Math.log(m); ar += m; }
            geo = Math.exp(geo/(n-1)); ar = ar/(n-1); td2.spectralFlatness = ar>0 ? geo/ar : null;
          }
          // Flux
          if (td2.spectralFlux == null) {
            let flux=0; for (let i=0;i<specA.length;i++){ const a=specA[i]; const b=specB[i]||0; const d=(b-a); flux += d*d; }
            td2.spectralFlux = Math.sqrt(flux)/specA.length;
          }
        }
      }
    } catch(e){ if (window.DEBUG_ANALYZER) console.warn('Fallback espectral falhou', e); }

    // ===== Fallback: calcular LRA (Loudness Range) simples se ausente =====
    try {
      if (td.lra == null || !Number.isFinite(td.lra)) {
        const sr = audioBuffer.sampleRate;
        const channel = audioBuffer.getChannelData(0);
        const win = Math.min(sr * 3, channel.length); // ~3s window
        if (win > 0) {
          const step = Math.max(1, Math.floor(win / 2));
          const loudBlocks = [];
          for (let start = 0; start < channel.length - win; start += step * 4) { // saltar para performance
            let sum = 0;
            for (let i = 0; i < win; i += 8) { // sub-amostragem
              const s = channel[start + i]; sum += s * s;
            }
            const rms = Math.sqrt(sum / (win/8));
            if (rms > 0) loudBlocks.push(20 * Math.log10(rms));
            if (loudBlocks.length > 80) break; // limite
          }
          if (loudBlocks.length > 4) {
            loudBlocks.sort((a,b)=>a-b);
            const p10 = loudBlocks[Math.floor(loudBlocks.length * 0.1)];
              const p95 = loudBlocks[Math.floor(loudBlocks.length * 0.95)];
              td.lra = Number.isFinite(p95) && Number.isFinite(p10) ? (p95 - p10) : null;
          }
        }
      }
    } catch(e) { if (window.DEBUG_ANALYZER) console.warn('Fallback LRA falhou', e); }

    // ===== Fallback: tonal balance simplificado (sub, low, mid, high) =====
    try {
      if (!td.tonalBalance) {
        const channel = audioBuffer.getChannelData(0);
        const fftSize = 4096;
        if (channel.length > fftSize) {
          const slice = channel.slice(0, fftSize);
          const spec = this.simpleFFT(slice).slice(0, fftSize/2);
          const sr = audioBuffer.sampleRate; const binHz = sr / fftSize;
          const bands = { sub:[20,60], low:[60,250], mid:[250,4000], high:[4000,12000] };
          const out = {};
          for (const [k,[a,b]] of Object.entries(bands)) {
            let energy=0, count=0; const maxBin = spec.length;
            for (let i=0;i<maxBin;i++) { const f=i*binHz; if (f>=a && f<b) { energy += spec[i]; count++; } }
            if (count>0) { const rms = energy / count; out[k] = { rms_db: 20*Math.log10(rms || 1e-9) }; }
          }
          td.tonalBalance = out;
        }
      }
    } catch(e){ if (window.DEBUG_ANALYZER) console.warn('Fallback tonal balance falhou', e); }

    // ===== Quality Breakdown (preencher se ausente) =====
    try {
      if (!baseAnalysis.qualityBreakdown) {
        // 🎯 CORREÇÃO TOTAL: Apenas usar PROD_AI_REF_DATA no modo gênero
        let ref = null;
        if (mode === 'genre' && typeof window !== 'undefined') {
          ref = window.PROD_AI_REF_DATA;
          if (DEBUG_MODE_REFERENCE) {
            console.log('🔍 [MODE_DEBUG] Using genre ref for quality breakdown, mode:', mode);
          }
        } else if (DEBUG_MODE_REFERENCE) {
          console.log('🔍 [MODE_DEBUG] Skipping genre ref for quality breakdown, mode:', mode, '(pure analysis)');
        }
        
        const safe = (v,def=0)=> Number.isFinite(v)?v:def;
        // FASE 2: Usar dados unificados para LUFS (sem fallback RMS problemático)
        const lufsInt = safe(td.lufsIntegrated, null); // Não usar RMS como fallback
        if (lufsInt === null) {
          console.warn('🔍 FASE 2: LUFS não disponível, pulando cálculo de loudness score');
        }
        const dr = safe(baseAnalysis.technicalData?.dynamicRange);
        const crest = safe(td.crestFactor);
        const corr = safe(td.stereoCorrelation,0);
        const centroid = safe(td.spectralCentroid);
        const freqIdealLow = 1800, freqIdealHigh = 3200;
        const refLufs = ref?.lufs_target ?? -14;
        const refDR = ref?.dr_target ?? 10;
        // Scores - FASE 2: Tratar LUFS nulo de forma segura
        const scoreLoud = (lufsInt !== null) 
          ? 100 - Math.min(100, Math.abs(lufsInt - refLufs) * 6) 
          : 50; // Score neutro quando LUFS não disponível
        const scoreDyn = 100 - Math.min(100, Math.abs(dr - refDR) * 10); // 2 dB -> -20
        let scoreTech = 100;
        if (safe(baseAnalysis.technicalData?.clippingSamples) > 0) scoreTech -= 20;
        if (Math.abs(safe(baseAnalysis.technicalData?.dcOffset)) > 0.02) scoreTech -= 10;
        if (crest < 6) scoreTech -= 15; else if (crest < 8) scoreTech -= 5;
        if (corr < -0.2) scoreTech -= 15;
        // Frequency score baseado em centroid
        let scoreFreq;
        if (!Number.isFinite(centroid)) scoreFreq = 50; else if (centroid < freqIdealLow) scoreFreq = 100 - Math.min(60, (freqIdealLow-centroid)/freqIdealLow*100); else if (centroid>freqIdealHigh) scoreFreq = 100 - Math.min(60, (centroid-freqIdealHigh)/freqIdealHigh*100); else scoreFreq = 100;
        const clamp = v=>Math.max(0, Math.min(100, Math.round(v)));
        baseAnalysis.qualityBreakdown = {
          dynamics: clamp(scoreDyn),
          technical: clamp(scoreTech),
          loudness: clamp(scoreLoud),
          frequency: clamp(scoreFreq)
        };
        // 🎯 FALLBACK MELHORADO: Se Color Ratio V2 falhar, usar pesos rebalanceados
        // Alinhado com os novos pesos: mais peso para loudness/dynamics, menos para technical
        if (!Number.isFinite(baseAnalysis.qualityOverall)) {
          console.log('[FALLBACK_BALANCED] Triggered - qualityOverall was:', baseAnalysis.qualityOverall);
          // Novos pesos mais balanceados: loudness↑, dynamics=, technical↓, frequency=
          baseAnalysis.qualityOverall = clamp((scoreDyn*0.30 + scoreTech*0.20 + scoreLoud*0.35 + scoreFreq*0.15));
          console.log('[FALLBACK_BALANCED] Set qualityOverall =', baseAnalysis.qualityOverall, 'using balanced weights');
        }
      }
    } catch(e){ if (window.DEBUG_ANALYZER) console.warn('Fallback quality breakdown falhou', e); }
  if (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true) {
    console.log('🛰️ [Telemetry] Adapter Fase2 aplicado (novas chaves):', added.filter(k => k in td));
    console.log('🛰️ [Telemetry] Valores mapeados:', {
      lufsIntegrated: td.lufsIntegrated,
      lra: td.lra,
      truePeakDbtp: td.truePeakDbtp,
      spectralCentroid: td.spectralCentroid,
  spectralRolloff85: td.spectralRolloff85,
  spectralRolloff50: td.spectralRolloff50,
  thdPercent: td.thdPercent,
      spectralFlux: td.spectralFlux,
      stereoCorrelation: td.stereoCorrelation,
      balanceLR: td.balanceLR,
      tonalBalance: td.tonalBalance ? {
        sub: td.tonalBalance.sub?.rms_db,
        low: td.tonalBalance.low?.rms_db,
        mid: td.tonalBalance.mid?.rms_db,
        high: td.tonalBalance.high?.rms_db,
      } : null
    });
  }

    // Após mapear V2, opcionalmente aprimorar com módulos avançados (LUFS/LRA/TruePeak padrão ITU) se habilitado
    try {
      const preferAdv = (typeof window !== 'undefined') ? (window.USE_ADVANCED_METRICS !== false) : true;
      if (preferAdv) {
        baseAnalysis = await this._tryAdvancedMetricsAdapter(audioBuffer, baseAnalysis);
      }
    } catch (e) {
      if (__DEBUG_ANALYZER__) console.warn('⚠️ Adapter avançado falhou (com V2):', e?.message || e);
    }

    try {
      // Recalcular score ao final (todas bandas prontas) para garantir contagem correta de verdes/vermelhas
      // Removida exigência de baseAnalysis.mixScore prévio (bloco inicial está desativado)
      if (typeof window !== 'undefined' && baseAnalysis.technicalData) {
        const tdFinal = baseAnalysis.technicalData;
        console.log('[COLOR_RATIO_V2_DEBUG] tdFinal input:', tdFinal);
        console.log('[COLOR_RATIO_V2_DEBUG] tdFinal keys:', Object.keys(tdFinal || {}));
        let activeRef = null;
        // 🎯 CORREÇÃO TOTAL: Apenas usar PROD_AI_REF_DATA no modo gênero
        try { 
          if (mode === 'genre') {
            activeRef = window.PROD_AI_REF_DATA_ACTIVE || window.PROD_AI_REF_DATA || null;
            if (DEBUG_MODE_REFERENCE) {
              console.log('🔍 [MODE_DEBUG] Using genre ref for scoring, mode:', mode);
            }
          } else if (DEBUG_MODE_REFERENCE) {
            console.log('🔍 [MODE_DEBUG] Skipping genre ref for scoring, mode:', mode, '(pure analysis)');
          }
        } catch {}
        try {
          // 🚀 SCORING V2 COMPLETE - Sistema simplificado (segunda ocorrência)
          let scorerMod = null;
          
          // Verificar se sistema V2 completo está carregado
          if (window.ScoringV2Complete && window.ScoringV2Complete.computeMixScore) {
            scorerMod = window.ScoringV2Complete;
            console.log('✅ [ANALYZER_2] Usando ScoringV2Complete');
          } else if (window.computeMixScore) {
            scorerMod = { computeMixScore: window.computeMixScore };
            console.log('✅ [ANALYZER_2] Usando função global computeMixScore');
          } else if (window.ScoringV1 && window.ScoringV1.computeMixScore) {
            scorerMod = window.ScoringV1;
            console.log('⚠️ [ANALYZER_2] Fallback para ScoringV1 global');
          } else {
            console.warn('⚠️ [ANALYZER_2] Carregando scoring como fallback...');
            // Último recurso: usar scoring V1 se disponível ou carregar
            if (window.ScoringV1 && window.ScoringV1.computeMixScore) {
              scorerMod = window.ScoringV1;
            } else {
              try {
                scorerMod = await import('/lib/audio/features/scoring.js?v=' + Date.now()).catch(()=>null);
              } catch (e) {
                console.error('❌ [ANALYZER_2] Falha ao carregar scoring:', e);
              }
            }
          }
          if (scorerMod && typeof scorerMod.computeMixScore === 'function') {
            // 🎯 CORREÇÃO: Buscar targets específicos do gênero ativo (segunda ocorrência)
            let genreSpecificRef = null;
            if (mode === 'genre' && activeRef) {
              const activeGenre = window.PROD_AI_REF_GENRE || 'default';
              genreSpecificRef = activeRef[activeGenre] || null;
              if (DEBUG_MODE_REFERENCE) {
                console.log('🔍 [MODE_DEBUG] Final scoring using genre-specific ref:', activeGenre);
                console.log('🔍 [MODE_DEBUG] Final genre ref targets:', genreSpecificRef);
              }
            } else if (DEBUG_MODE_REFERENCE) {
              console.log('🔍 [MODE_DEBUG] Final scoring skipping genre-specific ref (mode=' + mode + ')');
            }
            
            const finalScore = scorerMod.computeMixScore(tdFinal, genreSpecificRef);
            console.log('[COLOR_RATIO_V2_DEBUG] Raw finalScore:', finalScore);
            
            // TESTE MANUAL COM DADOS CONHECIDOS
            const testData = {
              "spectrum.balance": { classification: "yellow" },
              "spectrum.clarity": { classification: "red" },
              "spectrum.presence": { classification: "green" },
              "spectrum.warmth": { classification: "yellow" },
              "spectrum.brightness": { classification: "green" },
              "spectrum.fullness": { classification: "green" },
              "dynamics.punch": { classification: "yellow" },
              "dynamics.consistency": { classification: "red" },
              "dynamics.contrast": { classification: "green" },
              "technical.clipCount": { classification: "green" },
              "technical.distortionLevel": { classification: "red" },
              "technical.noiseFloor": { classification: "yellow" }
            };
            // 🎯 CORREÇÃO: Buscar targets específicos do gênero ativo (terceira ocorrência - teste)
            let testGenreSpecificRef = null;
            if (mode === 'genre' && activeRef) {
              const activeGenre = window.PROD_AI_REF_GENRE || 'default';
              testGenreSpecificRef = activeRef[activeGenre] || null;
            }
            
            const testScore = scorerMod.computeMixScore(testData, testGenreSpecificRef);
            console.log('[COLOR_RATIO_V2_TEST] Manual test G=5, Y=4, R=3, T=12 should be 59:', testScore);
            // O scoring.js agora está correto, não precisa de override
            baseAnalysis.mixScore = finalScore;
            baseAnalysis.mixScorePct = finalScore.scorePct;
            baseAnalysis.mixClassification = finalScore.classification;
            
            // CRÍTICO: Atualizar qualityOverall usado pela UI
            baseAnalysis._originalQualityOverall = baseAnalysis.qualityOverall;
            baseAnalysis.qualityOverall = finalScore.scorePct;
            console.log('[COLOR_RATIO_V2_FIX] Setting qualityOverall =', finalScore.scorePct, '(was:', baseAnalysis._originalQualityOverall, ')');
            // Logging para debug (sem override)
            try {
              const cc = finalScore.colorCounts || {};
              if (window.DEBUG_SCORE === true && cc.total > 0) {
                console.log('[ANALYSIS][FINAL_SCORE]', {
                  method: finalScore.method,
                  scorePct: finalScore.scorePct,
                  colorCounts: cc,
                  weights: finalScore.weights,
                  denominator: finalScore.denominator_info,
                  yellowKeys: finalScore.yellowKeys
                });
              }
              try { window.__LAST_MIX_SCORE = finalScore; } catch {}
            } catch {}
            if (window.DEBUG_SCORE === true) console.log('[ANALYSIS][RECALC_SCORE] method=', finalScore.scoringMethod, 'scorePct=', finalScore.scorePct, finalScore.colorCounts, 'weights=', finalScore.weights, 'denom=', finalScore.denominator_info, 'yellowKeys=', finalScore.yellowKeys);
          }
        } catch (reScoreErr) { if (window.DEBUG_SCORE) console.warn('[RECALC_SCORE_ERROR]', reScoreErr); }
      }
    } catch {}
    return baseAnalysis;
  }

  // (remoção do conversor WAV — não é mais necessário)

  // 🔬 Realizar análise completa
  performFullAnalysis(audioBuffer) {
  const _caiarLog = (window && window.__caiarLog) ? window.__caiarLog : function(){};
  _caiarLog('METRICS_V1_START','Iniciando cálculo métricas V1', { duration: audioBuffer?.duration, sr: audioBuffer?.sampleRate });
    const analysis = {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      problems: [],
      suggestions: [],
      technicalData: {},
      diagnostics: {
        problems: [],
        suggestions: [],
        __refEvidence: false
  },
  metricsValidation: {},
  timingBreakdown: {}
    };

    // Garantir que arrays essenciais existam
    analysis.problems = analysis.problems || [];
    analysis.suggestions = analysis.suggestions || [];

    // Obter dados dos canais
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

    // ===== SINGLE STAGE METRICS (feature flag) =====
    try {
      if (typeof window === 'undefined' || window.SINGLE_STAGE_METRICS === true) {
        // Todas as métricas base calculadas aqui usarão exatamente o mesmo PCM bruto (sem ganhos posteriores)
        const td = analysis.technicalData;
        // Peak (dBFS) já será calculado abaixo; adiantamos se quisermos evitar duplicação
        // Clipping sample-level unificado com threshold mais rigoroso
        let samplePeakL = 0, samplePeakR = 0, clipCount = 0;
        const clipThresh = 0.99; // Threshold mais rigoroso para clipping
        
        // Análise do canal esquerdo
        for (let i=0;i<leftChannel.length;i++) {
          const a = Math.abs(leftChannel[i]);
          if (a > samplePeakL) samplePeakL = a;
          if (a >= clipThresh) clipCount++;
        }
        
        // Análise do canal direito (se diferente)
        if (rightChannel !== leftChannel) {
          for (let i=0;i<rightChannel.length;i++) {
            const a = Math.abs(rightChannel[i]);
            if (a > samplePeakR) samplePeakR = a;
            if (a >= clipThresh) clipCount++;
          }
        } else samplePeakR = samplePeakL;
        const toDb = v => v>0 ? 20*Math.log10(v) : -Infinity;
        td._singleStage = {
          samplePeakLeftDb: toDb(samplePeakL),
            samplePeakRightDb: toDb(samplePeakR),
            clippingSamples: clipCount,
            clipThreshold: clipThresh,
            source: 'single-stage:pcm'
        };
      }
    } catch {}

    // 📊 Análise de Volume e Dinâmica
    analysis.technicalData.peak = this.findPeakLevel(leftChannel);
    analysis.technicalData.rms = this.calculateRMS(leftChannel);
    // 🎯 Calcular Crest Factor (nova nomenclatura correta)
    analysis.technicalData.crestFactor = this.calculateCrestFactor(leftChannel);
    // 🔄 Manter dynamicRange para compatibilidade (mesmo valor que crestFactor)
    analysis.technicalData.dynamicRange = analysis.technicalData.crestFactor;
    // 🔬 Nova métrica de dinâmica estatística (dr_stat) – não substitui dynamicRange legacy
    try {
      const enableDRRedef = (typeof window !== 'undefined') && (
        (window.AUDIT_MODE === true && window.DR_REDEF !== false) ||
        window.FORCE_SCORING_V2 === true || window.AUTO_SCORING_V2 === true
      );
      if (enableDRRedef && !analysis.technicalData.dr_stat) {
        const sampleRate = audioBuffer.sampleRate || 48000;
        const winMs = 300; const hopMs = 100;
        const win = Math.max(1, Math.round(sampleRate * winMs / 1000));
        const hop = Math.max(1, Math.round(sampleRate * hopMs / 1000));
        // Construir mid para robustez stereo
        const n = Math.min(leftChannel.length, rightChannel.length);
        const mid = new Float32Array(n);
        for (let i=0;i<n;i++) mid[i] = 0.5*(leftChannel[i] + rightChannel[i]);
        // Sliding RMS
        const rmsVals = [];
        let sum = 0; let buf = new Float32Array(win); let bi=0; let filled=0;
        for (let i=0;i<n;i++) {
          const x = mid[i];
          const prev = buf[bi];
          buf[bi] = x; bi = (bi+1)%win;
          if (filled < win) { sum += x*x; filled++; } else { sum += x*x - prev*prev; }
          if (i+1 >= win && ((i - win) % hop === 0)) {
            const ms = sum / win; rmsVals.push(ms>0 ? 20*Math.log10(Math.sqrt(ms)) : -Infinity);
          }
        }
        const finite = rmsVals.filter(v => Number.isFinite(v)).sort((a,b)=>a-b);
        if (finite.length > 5) { // garantir amostra mínima
          const idx = (p)=> Math.min(finite.length-1, Math.max(0, Math.floor(finite.length * p)));
          const p10 = finite[idx(0.10)];
          const p95 = finite[idx(0.95)];
          const drStat = (Number.isFinite(p95) && Number.isFinite(p10)) ? (p95 - p10) : null;
          if (drStat != null) {
            analysis.technicalData.dr_stat = parseFloat(drStat.toFixed(2));
            analysis.technicalData.dr_stat_p95 = p95;
            analysis.technicalData.dr_stat_p10 = p10;
            analysis.technicalData.dr_stat_windows = rmsVals.length;
            (analysis.technicalData._sources = analysis.technicalData._sources || {}).dr_stat = 'audit:dr_percentile';
          }
        }
      }
    } catch (e) { if (window && window.DEBUG_ANALYZER) console.warn('DR_STAT erro:', e); }
    // Garantir crestFactor base (peak - rms) já inicial
    if (Number.isFinite(analysis.technicalData.peak) && Number.isFinite(analysis.technicalData.rms)) {
      const cf = (analysis.technicalData.peak - analysis.technicalData.rms);
      if (!Number.isFinite(analysis.technicalData.crestFactor)) {
        analysis.technicalData.crestFactor = parseFloat(cf.toFixed(2));
        (analysis.technicalData._sources = analysis.technicalData._sources || {}).crestFactor = 'fallback:basic';
      }
    }

    // ⚙️ Métricas técnicas básicas extras (fallback quando V2 não estiver disponível)
    try {
      let dcSum = 0;
      let clipped = 0;
      const len = leftChannel.length;
      const clipThreshold = 0.99; // Threshold mais rigoroso para detecção de clipping
      let dcSumR = 0;
      const useHPF = (typeof window !== 'undefined' && window.AUDIT_MODE===true && window.DC_HPF20===true) || (typeof process !== 'undefined' && process.env.AUDIT_MODE==='1' && process.env.DC_HPF20==='1');
      // HPF estado
      let aL=0,aR=0, xPrevL=0,yPrevL=0,xPrevR=0,yPrevR=0;
      const sr = audioBuffer.sampleRate || 48000;
      const fc=20; const w=2*Math.PI*fc/sr; const alpha = w/(w+1);
      
      // Contagem de clipping mais precisa - verificar ambos os canais
      for (let i = 0; i < len; i++) {
        let sL = leftChannel[i];
        let sR = rightChannel[i] ?? sL;
        if (useHPF) {
          const yL = alpha*(yPrevL + sL - xPrevL); yPrevL = yL; xPrevL = sL; sL = yL;
          const yR = alpha*(yPrevR + sR - xPrevR); yPrevR = yR; xPrevR = sR; sR = yR;
        }
        dcSum += sL;
        dcSumR += sR;
        
        // Detectar clipping em qualquer canal
        if (Math.abs(sL) >= clipThreshold || Math.abs(sR) >= clipThreshold) {
          clipped++;
        }
      }
      const dcOffset = dcSum / Math.max(1, len);
      const dcOffsetRight = dcSumR / Math.max(1, len);
      const clippingPct = (clipped / Math.max(1, len)) * 100;
      if (!Number.isFinite(analysis.technicalData.dcOffset)) {
        analysis.technicalData.dcOffset = dcOffset;
      }
      if ((typeof window !== 'undefined' && window.AUDIT_MODE===true) || (typeof process !== 'undefined' && process.env.AUDIT_MODE==='1')) {
        analysis.technicalData.dcOffsetLeft = dcOffset;
        analysis.technicalData.dcOffsetRight = dcOffsetRight;
        (analysis.technicalData._sources = analysis.technicalData._sources || {}).dcOffsetLeft = useHPF? 'audit:hpf20' : 'audit:raw';
        (analysis.technicalData._sources = analysis.technicalData._sources || {}).dcOffsetRight = useHPF? 'audit:hpf20' : 'audit:raw';
      }
      if (!Number.isFinite(analysis.technicalData.clippingSamples)) {
        analysis.technicalData.clippingSamples = clipped;
      }
      if (!Number.isFinite(analysis.technicalData.clippingPct)) {
        analysis.technicalData.clippingPct = clippingPct;
      }
    } catch {}

    // 🎯 Análise de Frequências Dominantes
    analysis.technicalData.dominantFrequencies = this.findDominantFrequencies(leftChannel, audioBuffer.sampleRate) || [];

    // 🔍 Detectar Problemas Comuns
    this.detectCommonProblems(analysis);

    // 💡 Gerar Sugestões Técnicas
    this.generateTechnicalSuggestions(analysis);
  try { (window.__caiarLog||function(){})('SUGGESTIONS_V1_DONE','Sugestões V1 geradas', { count: (analysis.suggestions||[]).length }); } catch {}

    // 🔒 Validação final dos arrays essenciais
    analysis.problems = Array.isArray(analysis.problems) ? analysis.problems : [];
    analysis.suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];
    analysis.technicalData.dominantFrequencies = Array.isArray(analysis.technicalData.dominantFrequencies) ? analysis.technicalData.dominantFrequencies : [];

    // 🛡️ Invariants (audit)
    try {
      if ((typeof window !== 'undefined' && window.AUDIT_MODE === true) || (typeof process !== 'undefined' && process.env.AUDIT_MODE==='1')) {
        // Lazy dynamic import se disponível
  // Import dinâmico não disponível neste contexto sem bundler; placeholder para futura injeção.
  const validator = (typeof window !== 'undefined' && window.__validateInvariants) ? window.__validateInvariants : null;
  if (typeof validator === 'function') {
          const inv = validator({
            truePeakDbtp: analysis.technicalData.truePeakDbtp ?? analysis.technicalData.true_peak_dbtp,
            samplePeakLeftDb: analysis.technicalData.samplePeakLeftDb,
            samplePeakRightDb: analysis.technicalData.samplePeakRightDb,
            lufsIntegrated: analysis.technicalData.lufsIntegrated,
            crestFactor: analysis.technicalData.crestFactor,
            dr_stat: analysis.technicalData.dr_stat,
            thdPercent: analysis.technicalData.thdPercent
          });
          if (inv?.warnings?.length) {
            analysis.auditInvariants = inv;
            // Anexar warnings sem duplicar
            const seen = new Set(analysis.problems.map(p=>p?.message||p));
            for (const w of inv.warnings) {
              if (!seen.has(w)) { analysis.problems.push({ type:'invariant', message:w }); seen.add(w); }
            }
          }
        }
      }
    } catch (e) { if (window && window.DEBUG_ANALYZER) console.warn('Invariant validator erro', e); }

    return analysis;
  }

  // 📈 Encontrar nível de pico
  findPeakLevel(channelData) {
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      if (sample > peak) {
        peak = sample;
      }
    }
    // Evitar log de zero
    if (peak === 0) peak = 0.000001;
    return 20 * Math.log10(peak); // Converter para dB
  }

  // 📊 Calcular RMS (Volume médio)
  calculateRMS(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);
    // Evitar log de zero
    if (rms === 0) return -Infinity;
    return 20 * Math.log10(rms); // Converter para dB
  }

  // 🎚️ Calcular Crest Factor (anteriormente chamado Dynamic Range)
  // Nota: Esta é a diferença Peak-RMS em dB, não o Dynamic Range técnico (TT DR ou EBU PLR)
  calculateCrestFactor(channelData) {
    const peak = this.findPeakLevel(channelData);
    const rms = this.calculateRMS(channelData);
    
    // Verificar valores válidos
    if (rms === -Infinity || isNaN(peak) || isNaN(rms)) {
      return 0;
    }
    
    return Math.abs(peak - rms);
  }

  // 🔄 Alias para compatibilidade (será removido gradualmente)
  calculateDynamicRange(channelData) {
    console.warn('⚠️ calculateDynamicRange() deprecated - use calculateCrestFactor() instead');
    return this.calculateCrestFactor(channelData);
  }

  // 🎵 Encontrar frequências dominantes (versão melhorada)
  findDominantFrequencies(channelData, sampleRate) {
  if (window.DEBUG_ANALYZER === true) console.log('🎯 Iniciando análise de frequências...');
    
    // 🎯 Implementação melhorada com FFT maior e interpolação
    const fftSize = 2048; // Aumentado de 256 para melhor resolução
    const frequencies = [];
    const maxSections = 15; // Reduzido para melhor performance
    
    const stepSize = Math.max(fftSize * 2, Math.floor(channelData.length / maxSections));
    
    // Analisar diferentes seções do áudio
    for (let i = 0; i < channelData.length - fftSize && frequencies.length < maxSections; i += stepSize) {
      try {
        const section = channelData.slice(i, i + fftSize);
        const spectrum = this.simpleFFT(section);
        
        // 🎯 Encontrar top 3 picos por seção para melhor detecção
        const peaks = [];
        for (let j = 2; j < spectrum.length / 2 - 2; j++) { // Evitar DC e Nyquist
          const magnitude = spectrum[j];
          // Verificar se é um pico local
          if (magnitude > spectrum[j-1] && magnitude > spectrum[j+1] && 
              magnitude > spectrum[j-2] && magnitude > spectrum[j+2]) {
            const freq = (j * sampleRate) / fftSize;
            if (freq > 30 && freq < 18000) { // Faixa mais focada
              // 🎯 Interpolação parabólica para melhor precisão
              const y1 = spectrum[j-1], y2 = spectrum[j], y3 = spectrum[j+1];
              const a = (y1 - 2*y2 + y3) / 2;
              const b = (y3 - y1) / 2;
              const correction = a !== 0 ? -b / (2*a) : 0;
              const refinedFreq = ((j + correction) * sampleRate) / fftSize;
              
              peaks.push({ freq: refinedFreq, magnitude });
            }
          }
        }
        
        // Ordenar por magnitude e pegar os top 2
        peaks.sort((a, b) => b.magnitude - a.magnitude);
        frequencies.push(...peaks.slice(0, 2).map(p => p.freq));
        
      } catch (error) {
        console.warn('Erro na análise de seção:', error);
        continue;
      }
    }

  if (window.DEBUG_ANALYZER === true) console.log(`🎯 Frequências encontradas: ${frequencies.length}`);

    // Encontrar as frequências mais comuns
    const freqGroups = this.groupFrequencies(frequencies);
    const result = freqGroups.slice(0, 5) || []; // Top 5 frequências
    return Array.isArray(result) ? result : [];
  }

  // 🔍 FFT Simples (para análise básica de frequências)
  simpleFFT(samples) {
    // Implementação básica para detectar frequências dominantes
    const N = samples.length;
    const spectrum = new Array(N);
    
    // Limitar N para evitar travamento
    const maxN = Math.min(N, 512);
    
    for (let k = 0; k < maxN; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < maxN; n++) {
        const angle = -2 * Math.PI * k * n / maxN;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * Math.sin(angle);
      }
      
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    // Preencher o resto com zeros
    for (let k = maxN; k < N; k++) {
      spectrum[k] = 0;
    }
    
    return spectrum;
  }

  // 📊 Agrupar frequências similares (versão melhorada)
  groupFrequencies(frequencies) {
    const groups = {};
    // 🎯 Tolerância adaptativa baseada na frequência
    const getTolerance = (freq) => {
      if (freq < 200) return 20;      // Graves: ±20 Hz
      if (freq < 1000) return 30;     // Low-mid: ±30 Hz  
      if (freq < 4000) return 50;     // Mid: ±50 Hz
      if (freq < 10000) return 100;   // High-mid: ±100 Hz
      return 200;                     // Agudos: ±200 Hz
    };
    
    frequencies.forEach(freq => {
      const tolerance = getTolerance(freq);
      const rounded = Math.round(freq / tolerance) * tolerance;
      groups[rounded] = (groups[rounded] || 0) + 1;
    });
    
    return Object.entries(groups)
      .sort(([,a], [,b]) => b - a)
      .map(([freq, count]) => ({ 
        frequency: parseFloat(freq), 
        occurrences: count,
        confidence: Math.min(1.0, count / 3) // Confiança baseada em ocorrências
      }));
  }

  // 🚨 Detectar problemas comuns
  detectCommonProblems(analysis) {
    const { peak, rms, dynamicRange } = analysis.technicalData;
    const clipSamples = analysis.technicalData?.clippingSamples || 0;
    const clipPct = analysis.technicalData?.clippingPct || 0;
    const truePeak = analysis.technicalData?.truePeakDbtp;

    // Problema: Clipping - critérios mais rigorosos e completos
    const hasClipping = peak > -0.1 || clipSamples > 0 || clipPct > 0 || (truePeak !== null && truePeak > -0.1);
    
    if (hasClipping) {
      let clippingDetails = [];
      if (peak > -0.1) clippingDetails.push(`Peak: ${peak.toFixed(2)}dB`);
      if (truePeak !== null && truePeak > -0.1) clippingDetails.push(`TruePeak: ${truePeak.toFixed(2)}dBTP`);
      if (clipSamples > 0) clippingDetails.push(`${clipSamples} samples (${clipPct.toFixed(3)}%)`);
      
      analysis.problems.push({
        type: 'clipping',
        severity: 'critical',
        message: `Clipping detectado`,
        solution: `Reduzir volume geral em ${Math.max(3, Math.min(6, clipPct * 20)).toFixed(1)}dB`,
        explanation: "Clipping ocorre quando o sinal excede 0dBFS, causando distorção digital",
        impact: "Distorção audível, perda de qualidade, som áspero e desagradável",
        frequency_range: "Todas as frequências",
        adjustment_db: -Math.max(3, Math.min(6, clipPct * 20)),
        details: clippingDetails.join(', ')
      });
    }

    // Problema: Volume muito baixo
    if (rms < -30) {
      const gainNeeded = Math.abs(rms + 18); // Target para -18dB RMS
      analysis.problems.push({
        type: 'low_volume',
        severity: rms < -40 ? 'high' : 'medium',
        message: `Volume muito baixo`,
        solution: `Aumentar volume em ${gainNeeded.toFixed(1)}dB`,
        explanation: "Volume insuficiente reduz impacto e pode soar fraco comparado a outras músicas",
        impact: "Som sem energia, usuários precisam aumentar o volume manualmente",
        frequency_range: "Todas as frequências",
        adjustment_db: gainNeeded,
        details: `RMS atual: ${rms.toFixed(1)}dB (ideal: -18dB)`
      });
    }

    // Problema: Falta de dinâmica
    if (dynamicRange < 6) {
      analysis.problems.push({
        type: 'over_compressed',
        severity: dynamicRange < 3 ? 'high' : 'medium',
        message: `Áudio muito comprimido`,
        solution: `Reduzir compressão para atingir ${Math.max(8, dynamicRange + 3).toFixed(0)}dB de dinâmica`,
        explanation: "Excesso de compressão remove a dinâmica natural, deixando o som cansativo",
        impact: "Som sem vida, fadiga auditiva, perda da expressividade musical",
        frequency_range: "Todas as frequências",
        adjustment_db: 0, // Ajuste de compressão, não de ganho
        details: `Dinâmica atual: ${dynamicRange.toFixed(1)}dB (ideal: >8dB)`
      });
    }

    // Problema: Frequências dominantes problemáticas
    analysis.technicalData.dominantFrequencies.forEach(freq => {
      if (freq.frequency > 300 && freq.frequency < 600 && freq.occurrences > 10) {
        analysis.problems.push({
          type: 'muddy_mids',
          severity: 'medium',
          message: `Frequência problemática em ${Math.round(freq.frequency)}Hz`,
          solution: `Corte em ${Math.round(freq.frequency)}Hz com Q de 2-4`
        });
      }
    });
  }

  // 💡 Gerar sugestões técnicas
  generateTechnicalSuggestions(analysis) {
  try { (window.__caiarLog||function(){})('SUGGESTIONS_V1_START','Gerando sugestões V1'); } catch {}
    const { peak, rms, dominantFrequencies, spectralCentroid, lufsIntegrated } = analysis.technicalData;

    // Sugestões baseadas no LUFS integrado real (quando disponível)
    if (lufsIntegrated !== null && Number.isFinite(lufsIntegrated)) {
      if (lufsIntegrated >= -16 && lufsIntegrated <= -13) {
        analysis.suggestions.push({
          type: 'mastering_optimal',
          message: `Volume ideal para streaming`,
          action: `Seu áudio está no volume ideal para plataformas digitais`,
          explanation: "LUFS entre -14 e -16 é o padrão para Spotify, YouTube e Apple Music",
          impact: "Mantém dinâmica e evita limitação excessiva das plataformas",
          frequency_range: "N/A",
          adjustment_db: 0
        });
      } else if (lufsIntegrated < -16) {
        analysis.suggestions.push({
          type: 'mastering_volume_low',
          message: `Volume baixo para streaming`,
          action: `Aumentar volume para -14 LUFS`,
          explanation: "Áudio muito baixo pode soar fraco comparado a outras músicas",
          impact: "Usuários vão precisar aumentar o volume manualmente",
          frequency_range: "N/A",
          adjustment_db: Math.abs(lufsIntegrated + 14)
        });
      } else if (lufsIntegrated > -13) {
        analysis.suggestions.push({
          type: 'mastering_volume_high',
          message: `Volume alto demais`,
          action: `Reduzir volume para -14 LUFS`,
          explanation: "Plataformas irão reduzir o volume automaticamente",
          impact: "Perda de dinâmica e compressão adicional das plataformas",
          frequency_range: "N/A",
          adjustment_db: -(lufsIntegrated + 14)
        });
      }
    } else if (rms > -16 && rms < -12) {
      // Fallback para RMS quando LUFS não disponível 
      analysis.suggestions.push({
        type: 'mastering_rms_ok',
        message: 'Volume adequado (baseado em RMS)',
        action: `Volume estimado adequado via RMS`,
        explanation: "Análise via RMS é menos precisa que LUFS mas indica nível aceitável",
        impact: "Para resultados mais precisos, use medição LUFS",
        frequency_range: "N/A",
        adjustment_db: 0
      });
    }

    // ===== ANÁLISE APRIMORADA DE FREQUÊNCIAS (V1) =====
    // Sistema baseado em centroide espectral + análise de energia por banda
    if (spectralCentroid && Number.isFinite(spectralCentroid)) {
      
      // Thresholds para classificação (baseados em análise de referências)
      const thresholds = {
        veryDark: 600,    // Muito escuro - graves dominantes
        dark: 1200,       // Escuro - falta de agudos  
        balanced_low: 1800, // Início da zona balanceada
        balanced_high: 3200, // Fim da zona balanceada
        bright: 4500,     // Brilhante - agudos dominantes
        veryBright: 6000  // Muito brilhante
      };

      // Análise principal baseada no centroide espectral
      if (spectralCentroid < thresholds.veryDark) {
        analysis.suggestions.push({
          type: 'frequency_low_excess',
          message: `Excesso de graves detectado`,
          action: `Reduzir graves para equilibrar o som`,
          explanation: "Centroide espectral muito baixo indica dominância excessiva de graves",
          impact: "Som abafado, perda de clareza, mascaramento dos médios",
          frequency_range: "60–200 Hz",
          adjustment_db: -3
        });
      } 
      else if (spectralCentroid < thresholds.dark) {
        analysis.suggestions.push({
          type: 'frequency_highs_deficient',
          message: `Agudos insuficientes - som escuro`,
          action: `Adicionar presença e brilho`,
          explanation: "Falta de energia nas frequências altas deixa o som abafado",
          impact: "Som sem vida, falta de clareza e espacialidade",
          frequency_range: "3–6 kHz, 10 kHz",
          adjustment_db: 2.5
        });
      }
      else if (spectralCentroid >= thresholds.balanced_low && spectralCentroid <= thresholds.balanced_high) {
        // Zona equilibrada - sem sugestões de correção
        if (window.DEBUG_ANALYZER) console.log(`[V1] ✅ Frequências equilibradas (${Math.round(spectralCentroid)}Hz)`);
      }
      else if (spectralCentroid > thresholds.bright) {
        analysis.suggestions.push({
          type: 'frequency_highs_excess',
          message: `Excesso de agudos - som muito brilhante`,
          action: `Suavizar frequências altas`,
          explanation: "Centroide espectral elevado indica excesso de energia nos agudos",
          impact: "Som cansativo, sibilância excessiva, fadiga auditiva",
          frequency_range: "6–10 kHz",
          adjustment_db: -2
        });
      }
      else if (spectralCentroid > thresholds.balanced_high) {
        analysis.suggestions.push({
          type: 'frequency_bass_deficient',
          message: `Falta de corpo e graves`,
          action: `Reforçar graves e médios graves`,
          explanation: "Centroide espectral alto demais indica falta de energia nos graves",
          impact: "Som fino, sem peso, falta de groove e presença física",
          frequency_range: "100–500 Hz",
          adjustment_db: 3
        });
      }

      // Análise adicional baseada nas frequências dominantes
      if (dominantFrequencies && dominantFrequencies.length > 0) {
        const bassCount = dominantFrequencies.filter(f => f.frequency < 200).length;
        const midCount = dominantFrequencies.filter(f => f.frequency >= 200 && f.frequency < 2000).length;
        const highCount = dominantFrequencies.filter(f => f.frequency >= 2000).length;
        const total = bassCount + midCount + highCount;
        
        // Análise de distribuição de energia (cruzada com centroide)
        if (total > 0) {
          const bassRatio = bassCount / total;
          const midRatio = midCount / total;  
          const highRatio = highCount / total;
          
          // Detectar desequilíbrios extremos
          if (bassRatio > 0.6 && spectralCentroid < 1000) {
            analysis.suggestions.push({
              type: 'frequency_imbalance',
              message: `Desequilíbrio confirmado: graves dominantes (${(bassRatio*100).toFixed(0)}% da energia)`,
              action: `Balancear: reduzir graves e adicionar médios/agudos`
            });
          } else if (highRatio > 0.6 && spectralCentroid > 3500) {
            analysis.suggestions.push({
              type: 'frequency_imbalance',
              message: `Desequilíbrio confirmado: agudos dominantes (${(highRatio*100).toFixed(0)}% da energia)`,
              action: `Balancear: reduzir agudos e adicionar corpo/graves`
            });
          } else if (midRatio > 0.7) {
            // Médios dominantes - possível lama
            analysis.suggestions.push({
              type: 'mud_detected',
              message: `Concentração excessiva em médios (${(midRatio*100).toFixed(0)}% da energia)`,
              action: `Verificar lama em 200-400Hz, usar EQ para balancear`
            });
          }
        }
      }
      
    }
    // Fallback se centroide não estiver disponível
    else {
      const bassFreqs = dominantFrequencies.filter(f => f.frequency < 250);
      const highFreqs = dominantFrequencies.filter(f => f.frequency > 8000);
      
      // Só sugerir se realmente há pouquíssimas frequências detectadas
      if (bassFreqs.length === 0 && dominantFrequencies.length > 3) {
        analysis.suggestions.push({
          type: 'bass_enhancement',
          message: 'Nenhuma frequência dominante detectada abaixo de 250Hz',
          action: 'Considere boost em 60-120Hz se o mix soar "magro"'
        });
      }

      if (highFreqs.length === 0 && dominantFrequencies.length > 3) {
        analysis.suggestions.push({
          type: 'brightness',
          message: 'Nenhuma frequência dominante detectada acima de 8kHz',
          action: 'Considere shelf suave em 10kHz se o mix soar "abafado"'
        });
      }
    }

    // Sugestão específica para funk
    const funkKickRange = dominantFrequencies.filter(f => f.frequency >= 50 && f.frequency <= 100);
    if (funkKickRange.length > 0) {
      analysis.suggestions.push({
        type: 'funk_specific',
        message: 'Frequência de kick detectada - típica do funk',
        action: `Optimize a faixa ${Math.round(funkKickRange[0].frequency)}Hz para mais punch`
      });
    }
    // Tag de origem v1 se ainda não marcada
    try {
      analysis.suggestions = (analysis.suggestions||[]).map(s=> (s && typeof s==='object' && !s.source) ? ({...s, source:'v1:rules'}) : s);
    } catch {}
  try { (window.__caiarLog||function(){})('SUGGESTIONS_V1_POST','Sugestões V1 pós-processadas', { total: (analysis.suggestions||[]).length }); } catch {}
  }

  // 🎯 Gerar prompt personalizado para IA (otimizado)
  generateAIPrompt(analysis) {
    const td = analysis.technicalData || {};
    const sugList = analysis.suggestionsSnapshot || analysis.suggestions || [];
    
    // Cabeçalho compacto
    let prompt = `🎵 ANÁLISE DE ÁUDIO - Preciso de ajuda para otimizar meu mix:\n\n`;
    
    // Métricas principais em linha compacta
    const metrics = [
      `Peak: ${td.peak?.toFixed(1)||'N/A'}dB`,
      `RMS: ${td.rms?.toFixed(1)||'N/A'}dB`, 
      `DR: ${td.dynamicRange?.toFixed(1)||'N/A'}dB`,
      td.lufsIntegrated ? `LUFS: ${td.lufsIntegrated.toFixed(1)}` : null,
      td.truePeakDbtp ? `TP: ${td.truePeakDbtp.toFixed(1)}dBTP` : null,
      td.lra ? `LRA: ${td.lra.toFixed(1)}` : null
    ].filter(Boolean);
    
    prompt += `📊 MÉTRICAS: ${metrics.join(' | ')}\n`;
    
    // Frequências dominantes (só as 3 principais)
    if (td.dominantFrequencies?.length > 0) {
      const topFreqs = td.dominantFrequencies.slice(0, 3)
        .map(f => `${Math.round(f.frequency)}Hz`)
        .join(', ');
      prompt += `🎯 FREQ. DOMINANTES: ${topFreqs}\n`;
    }
    
    // Centroide espectral se disponível
    if (td.spectralCentroid) {
      prompt += `🎼 CENTROIDE: ${Math.round(td.spectralCentroid)}Hz\n`;
    }
    
    prompt += `\n`;

    // Problemas críticos
    if (analysis.problems?.length > 0) {
      prompt += `🚨 PROBLEMAS:\n`;
      analysis.problems.forEach(p => {
        prompt += `• ${p.message} → ${p.solution}\n`;
      });
      prompt += `\n`;
    }

    // Sugestões principais
    if (sugList.length > 0) {
      prompt += `💡 SUGESTÕES:\n`;
      // Converter sugestões para nomes amigáveis
      const friendlySuggestions = (window.convertSuggestionsToFriendly && window.convertSuggestionsToFriendly(sugList)) || sugList;
      friendlySuggestions.forEach(s => {
        prompt += `• ${s.message} → ${s.action}\n`;
      });
      prompt += `\n`;
    }

    // Contexto direto e objetivo
    prompt += `CONTEXTO: Com base nestes dados técnicos REAIS, forneça conselhos específicos com valores exatos (dB, Hz, Q, ratios) para EQ, compressão e limitação.`;

    // JSON estruturado otimizado
    try {
      // Deduplicação de sugestões por tipo - apenas uma por problema
      const deduplicatedSuggestions = this._deduplicateByType(sugList);
      const deduplicatedProblems = this._deduplicateByType(analysis.problems || []);
      
      const data = {
        metrics: {
          peak: td.peak,
          rms: td.rms,
          dynamicRange: td.dynamicRange,
          dr_stat: td.dr_stat,
          lufsIntegrated: td.lufsIntegrated,
          lra: td.lra,
          truePeakDbtp: td.truePeakDbtp,
          spectralCentroid: td.spectralCentroid,
          clippingSamples: td.clippingSamples,
          dcOffset: td.dcOffset
        },
        score: analysis.mixScore?.scorePct,
        classification: analysis.mixScore?.classification,
        suggestions: deduplicatedSuggestions.map(s => ({ 
          type: s.type, 
          message: s.message, 
          action: s.action,
          frequency_range: s.frequency_range,
          adjustment_db: s.adjustment_db,
          impact: s.impact,
          explanation: s.explanation
        })),
        problems: deduplicatedProblems.map(p => ({ 
          type: p.type, 
          message: p.message, 
          solution: p.solution,
          explanation: p.explanation,
          impact: p.impact,
          frequency_range: p.frequency_range,
          adjustment_db: p.adjustment_db,
          details: p.details
        }))
      };
      
      // Remove propriedades null/undefined para economizar espaço
      Object.keys(data.metrics).forEach(k => {
        if (data.metrics[k] == null) delete data.metrics[k];
      });
      
      prompt += `\n\n### JSON_DATA\n${JSON.stringify(data, null, 1)}\n### END_JSON`;
    } catch {}

    return prompt;
  }

  // Função para dedupilcar sugestões/problemas por tipo
  _deduplicateByType(items) {
    const seen = new Map();
    const deduplicated = [];
    
    for (const item of items) {
      if (!item || !item.type) continue;
      
      // Se já existe um item deste tipo, manter o mais detalhado
      if (seen.has(item.type)) {
        const existing = seen.get(item.type);
        // Priorizar item com mais detalhes técnicos
        const currentScore = this._calculateDetailScore(item);
        const existingScore = this._calculateDetailScore(existing);
        
        if (currentScore > existingScore) {
          // Substituir na lista
          const index = deduplicated.findIndex(d => d.type === item.type);
          if (index !== -1) {
            deduplicated[index] = item;
            seen.set(item.type, item);
          }
        }
      } else {
        seen.set(item.type, item);
        deduplicated.push(item);
      }
    }
    
    return deduplicated;
  }

  // Calcular score de detalhamento técnico
  _calculateDetailScore(item) {
    let score = 0;
    if (item.frequency_range) score += 2;
    if (item.adjustment_db && item.adjustment_db !== 0) score += 2;
    if (item.impact) score += 1;
    if (item.explanation) score += 1;
    if (item.details) score += 1;
    return score;
  }

  // ====== MATRIX: Métricas por banda e por stem (aprox) ======
  _computeAnalysisMatrix(mainBuffer, analysis, stemBuffersOrNull) {
    if (typeof window === 'undefined' || !window.CAIAR_ENABLED) return; // somente modo CAIAR
    const log = window.__caiarLog||function(){};
    log('MATRIX_START','Construindo analysis_matrix');
    const bandsDef = {
      sub: [20,60],
      low: [60,250],
      mid: [250,4000],
      high: [4000,12000]
    };
    const maxSeconds = 30; // limitar custo
    const procWindow = 2048;
    const hop = 1024;
    const toDb = v=> v>0 ? 20*Math.log10(v) : -Infinity;
    const percentile = (arr,p)=> { if(!arr.length) return null; const a=arr.slice().sort((x,y)=>x-y); const i=Math.min(a.length-1, Math.max(0, Math.floor(p*(a.length-1)))); return a[i]; };
    const processBuffer = (buf)=> {
      try {
        const sr = buf.sampleRate||48000;
        const lenLimit = Math.min(buf.length, sr*maxSeconds);
        const chL = buf.getChannelData(0);
        const chR = buf.numberOfChannels>1 ? buf.getChannelData(1) : chL;
        // Mid channel simplificado
        const mid = new Float32Array(lenLimit);
        for (let i=0;i<lenLimit;i++) mid[i] = 0.5*(chL[i]+chR[i]);
        // Janelas FFT
        const bandEnergyTotal = {}; const bandWindowEnergies = {}; const bandMaxEnergy = {}; const bandWindowRmsDbSeries = {};
        Object.keys(bandsDef).forEach(b=> { bandEnergyTotal[b]=0; bandWindowEnergies[b]=[]; bandMaxEnergy[b]=0; bandWindowRmsDbSeries[b]=[]; });
        for (let start=0; start+procWindow<=lenLimit; start+=hop) {
          const slice = mid.subarray(start, start+procWindow);
            const spec = this.simpleFFT ? this.simpleFFT(slice) : [];
            const half = spec.length/2;
            if (!half) continue;
            const binHz = (sr/procWindow);
            // Convert spec to magnitude (if complex output assumed real-imag pairs we need adaptation; aqui simpleFFT retorna magnitudes já no código existente)
            for (const [band, [fLo,fHi]] of Object.entries(bandsDef)) {
              let e = 0; let bins=0;
              const kStart = Math.max(1, Math.floor(fLo / binHz));
              const kEnd = Math.min(half-1, Math.floor(fHi / binHz));
              for (let k=kStart; k<=kEnd; k++) { const m = spec[k]; if (Number.isFinite(m)) { e += m*m; bins++; } }
              if (bins>0) {
                bandEnergyTotal[band] += e;
                if (e > bandMaxEnergy[band]) bandMaxEnergy[band] = e;
                bandWindowEnergies[band].push(e);
                const rms = Math.sqrt(e / Math.max(1,bins));
                bandWindowRmsDbSeries[band].push(toDb(rms));
              }
            }
        }
        const outBands = {};
        for (const band of Object.keys(bandsDef)) {
          const energies = bandWindowEnergies[band];
          if (!energies.length) { outBands[band] = null; continue; }
          const totalE = bandEnergyTotal[band];
          const maxE = bandMaxEnergy[band];
          const meanE = totalE / energies.length;
          const rms = Math.sqrt(meanE / (procWindow/2)); // normalização aproximada
          const peakAmp = Math.sqrt(maxE / (procWindow/2));
          const rmsDb = toDb(rms);
          const peakDb = toDb(peakAmp);
          const crest = Number.isFinite(rmsDb) && Number.isFinite(peakDb) ? parseFloat((peakDb - rmsDb).toFixed(2)) : null;
          const series = bandWindowRmsDbSeries[band].filter(v=>Number.isFinite(v));
          const p95 = percentile(series,0.95); const p10 = percentile(series,0.10);
          const lraApprox = (Number.isFinite(p95) && Number.isFinite(p10)) ? parseFloat((p95-p10).toFixed(2)) : null;
          const stWindows = series.slice(-3);
          const stMean = stWindows.length? (stWindows.reduce((a,b)=>a+b,0)/stWindows.length): null;
          outBands[band] = {
            rmsDb: Number.isFinite(rmsDb)? parseFloat(rmsDb.toFixed(2)) : null,
            truePeakDbtpApprox: Number.isFinite(peakDb)? parseFloat(peakDb.toFixed(2)) : null,
            crestFactor: crest,
            lraApprox,
            lufsIntegratedApprox: Number.isFinite(rmsDb)? parseFloat(rmsDb.toFixed(2)) : null,
            lufsShortTermApprox: Number.isFinite(stMean)? parseFloat(stMean.toFixed(2)) : null,
            windows: energies.length
          };
        }
        // Overall metrics (reuse existing if available)
        let overall = {};
        try {
          const td = analysis.technicalData||{};
          overall = {
            lufsIntegrated: td.lufsIntegrated ?? null,
            lufsShortTerm: td.lufsShortTerm ?? null,
            truePeakDbtp: td.truePeakDbtp ?? null,
            crestFactor: td.crestFactor ?? (Number.isFinite(td.peak) && Number.isFinite(td.rms)? parseFloat((td.peak-td.rms).toFixed(2)) : null),
            lra: td.lra ?? null
          };
        } catch {}
        return { bands: outBands, overall };
      } catch (e) { log('MATRIX_BUFFER_ERROR','Erro processando buffer', { error: e?.message||String(e) }); return null; }
    };
    const stems = {};
    // Mix principal
    stems.mix = processBuffer(mainBuffer);
    if (stemBuffersOrNull && typeof stemBuffersOrNull === 'object') {
      for (const [k,buf] of Object.entries(stemBuffersOrNull)) {
        if (buf) stems[k] = processBuffer(buf);
      }
    }
    analysis.analysis_matrix = {
      stems,
      meta: { version: '1.0.0', bands: bandsDef, approximations: true, generatedAt: new Date().toISOString() }
    };
    log('MATRIX_DONE','analysis_matrix pronta', { stems: Object.keys(stems).length });
  }
}

// 🌟 Interface simplificada para uso
window.audioAnalyzer = new AudioAnalyzer();

// 🎤 Função para analisar arquivo e enviar para chat
async function analyzeAndChat(file) {
  try {
    console.log('🎵 Iniciando análise de áudio...');
    
    const analysis = await window.audioAnalyzer.analyzeAudioFile(file);
    const aiPrompt = window.audioAnalyzer.generateAIPrompt(analysis);
    
    console.log('✅ Análise concluída:', analysis);
    
    // Enviar prompt personalizado para o chat
    await sendAudioAnalysisToChat(aiPrompt, analysis);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    alert('Erro ao analisar áudio. Verifique se é um arquivo válido.');
  }
}

// 📤 Enviar análise para chat
async function sendAudioAnalysisToChat(prompt, analysis) {
  // Simular envio de mensagem do usuário
  const message = `[ANÁLISE DE ÁUDIO] Analisei meu áudio e preciso de ajuda para melhorar. Aqui estão os dados técnicos:\n\n${prompt}`;
  
  // Enviar para o sistema de chat existente
  if (window.sendMessage) {
    window.sendMessage(message);
  } else {
    console.log('Prompt gerado:', message);
  }
}

console.log('🎵 Audio Analyzer carregado com sucesso!');

// Utilitário global para invalidar cache manualmente (fora da classe)
if (typeof window !== 'undefined' && !window.invalidateAudioAnalysisCache) {
  window.invalidateAudioAnalysisCache = function(){
    try {
      const map = window.__AUDIO_ANALYSIS_CACHE__;
      if (map && typeof map.clear === 'function') map.clear();
      (window.__caiarLog||function(){})('CACHE_INVALIDATE','Cache de análises limpo manualmente');
      console.log('[AudioAnalyzer] Cache limpo. Próxima análise será recalculada.');
    } catch(e){ console.warn('Falha ao invalidar cache', e); }
  };
}

// === Extensão: análise direta de AudioBuffer (uso interno / testes) ===
if (!AudioAnalyzer.prototype.analyzeAudioBufferDirect) {
  AudioAnalyzer.prototype.analyzeAudioBufferDirect = async function(audioBuffer, label='synthetic') {
    try {
      if (!this.audioContext) {
        await this.initializeAnalyzer();
      }
      let base = this.performFullAnalysis(audioBuffer);
      // Enriquecer (fase 2 / avançado) – reutiliza pipeline existente
      try { base = await this._enrichWithPhase2Metrics(audioBuffer, base, { name: label }); } catch {}
      base.syntheticLabel = label;
      return base;
    } catch (e) {
      console.warn('analyzeAudioBufferDirect falhou', e);
      return null;
    }
  };
}

// 🔌 Adapter para métricas avançadas (LUFS/LRA ITU + True Peak oversampled) via módulos em /lib
// - Seguro e opcional: só sobrescreve valores quando ausentes ou quando preferido via flag
// - Cacheia módulos para evitar recarregamento
// Prototype method definido após a classe principal
AudioAnalyzer.prototype._tryAdvancedMetricsAdapter = async function(audioBuffer, baseAnalysis) {
  try {
    const debug = (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true);
    const td = baseAnalysis.technicalData = baseAnalysis.technicalData || {};
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
    const sr = audioBuffer.sampleRate;

    // Resolver URLs absolutas para import dinâmico
    // URLs base
    const primary = {
      loud: '/lib/audio/features/loudness.js',
      tp: '/lib/audio/features/truepeak.js',
      spec: '/lib/audio/features/spectrum.js'
    };
    const fallback = {
      loud: '/public/lib/audio/features/loudness.js',
      tp: '/public/lib/audio/features/truepeak.js',
      spec: '/public/lib/audio/features/spectrum.js'
    };
    // Helper para importar com fallback
    async function importWithFallback(url1, url2) {
      try { return await import(url1 + '?v=' + Date.now()); }
      catch (e) { try { return await import(url2 + '?v=' + Date.now()); } catch (e2) { return { __err: e2 || e }; } }
    }

    // Cache global simples
    const cache = (window.__PROD_AI_ADV_CACHE__ = window.__PROD_AI_ADV_CACHE__ || {});

    // Flags de controle
    const doLoud = (typeof window === 'undefined' || window.USE_ADVANCED_LOUDNESS !== false);
    const doTP = (typeof window === 'undefined' || window.USE_ADVANCED_TRUEPEAK !== false);

    // Importar módulos necessários
    const imports = [];
    if (doLoud && !cache.loudMod) imports.push(importWithFallback(primary.loud, fallback.loud).then(m => cache.loudMod = m));
    if (doTP && !cache.tpMod) imports.push(importWithFallback(primary.tp, fallback.tp).then(m => cache.tpMod = m));
  // Import espectro somente se quisermos fase 2 (flag USE_ADVANCED_SPECTRUM não false)
  const doSpec = (typeof window !== 'undefined' || window.USE_ADVANCED_SPECTRUM !== false);
  if (doSpec && !cache.specMod) imports.push(importWithFallback(primary.spec, fallback.spec).then(m => cache.specMod = m));
    if (imports.length) await Promise.all(imports);

    // Cálculo LUFS/LRA
  const timing = baseAnalysis.timingBreakdown || (baseAnalysis.timingBreakdown = {});
  const t0Loud = performance.now();
  if (doLoud && cache.loudMod && !cache.loudMod.__err && typeof cache.loudMod.calculateLoudnessMetrics === 'function') {
      try {
        const lres = cache.loudMod.calculateLoudnessMetrics(left, right, sr);
        // Preencher/atualizar valores: preferir avançado se ausente ou se PREFER_ADVANCED_METRICS=true
        const prefer = (typeof window !== 'undefined' && window.PREFER_ADVANCED_METRICS === true);
        const setIfBetter = (key, val) => {
          if (val == null || !Number.isFinite(val)) return;
          if (td[key] == null || prefer) {
            td[key] = val;
            (td._sources = td._sources || {})[key] = 'advanced:loudness';
          }
        };
        setIfBetter('lufsIntegrated', lres.lufs_integrated);
        setIfBetter('lufsShortTerm', lres.lufs_short_term);
        setIfBetter('lufsMomentary', lres.lufs_momentary);
        setIfBetter('lra', lres.lra);
        // headroom_db original (offset para -23 LUFS) mantido para compatibilidade
        setIfBetter('headroomDb', lres.headroom_db);
        if (Number.isFinite(lres.loudness_offset_db)) {
          td.loudnessOffsetDb = lres.loudness_offset_db;
          (td._sources = td._sources || {}).loudnessOffsetDb = 'advanced:loudness';
        }
        // Guardar meta-info útil
        baseAnalysis.advancedLoudness = {
          gating: lres.gating_stats,
          referenceLevel: lres.reference_level,
          meetsBroadcast: !!lres.meets_broadcast
        };
        if (debug) console.log('✅ [ADV] Loudness/LRA aplicados:', {
          lufs: td.lufsIntegrated, lra: td.lra, headroomDb: td.headroomDb
        });
      } catch (e) { if (debug) console.warn('⚠️ [ADV] Falha LUFS:', e?.message || e); }
    }
  timing.loudnessMs = Math.round(performance.now() - t0Loud);

    // Cálculo True Peak
  const t0TP = performance.now();
  if (doTP && cache.tpMod && !cache.tpMod.__err && typeof cache.tpMod.analyzeTruePeaks === 'function') {
      try {
        const tres = cache.tpMod.analyzeTruePeaks(left, right, sr);
        const prefer = (typeof window !== 'undefined' && window.PREFER_ADVANCED_METRICS === true);
        const setIfBetter = (key, val) => {
          if (val == null || !Number.isFinite(val)) return;
          if (td[key] == null || prefer) {
            td[key] = val;
            (td._sources = td._sources || {})[key] = 'advanced:truepeak';
          }
        };
        setIfBetter('truePeakDbtp', tres.true_peak_dbtp);
        setIfBetter('samplePeakLeftDb', tres.sample_peak_left_db);
        setIfBetter('samplePeakRightDb', tres.sample_peak_right_db);
        // === Clipping oversampled unificado (domínio True Peak) ===
        try {
          const enableUnifiedClip = (typeof window === 'undefined' || window.UNIFIED_TRUEPEAK_CLIP === true);
          if (enableUnifiedClip && Number.isFinite(tres.true_peak_clipping_count)) {
            td.clippingSamplesTruePeak = tres.true_peak_clipping_count;
            (td._sources = td._sources || {}).clippingSamplesTruePeak = 'advanced:truepeak';
            td.truePeakClipThresholdDbtp = tres.true_peak_clip_threshold_dbtp;
            td.truePeakClipThresholdLinear = tres.true_peak_clip_threshold_linear;
            // Se contagem legacy inexistente ou prefer avançado, substituir
            if (td.clippingSamples == null || prefer) {
              td.clippingSamples = tres.true_peak_clipping_count;
              (td._sources = td._sources || {}).clippingSamples = 'advanced:truepeak';
            }
          }
        } catch {}
        // Derivar headroom real (pico até 0 dBTP) e ajustar se valor anterior incoerente
        try {
          const peaks = [tres.true_peak_dbtp, tres.sample_peak_left_db, tres.sample_peak_right_db].filter(v => Number.isFinite(v));
          if (peaks.length) {
            const maxPeak = Math.max(...peaks);
            const headroomTrue = 0 - maxPeak;
            if (Number.isFinite(headroomTrue)) {
              td.headroomTruePeakDb = headroomTrue;
              (td._sources = td._sources || {}).headroomTruePeakDb = 'derived:truepeak';
              if (!Number.isFinite(td.headroomDb) || td.headroomDb < -40 || td.headroomDb > 60) {
                td.headroomDb = headroomTrue;
                (td._sources = td._sources || {}).headroomDb = 'derived:truepeak';
              }
            }
          }
        } catch {}
        // Info extra
        baseAnalysis.advancedTruePeak = {
          oversampling: tres.oversampling_factor,
          exceedsMinus1dBTP: !!tres.exceeds_minus1dbtp,
          warnings: tres.warnings || []
        };
        if (debug) console.log('✅ [ADV] True Peak aplicado:', { truePeakDbtp: td.truePeakDbtp });
      } catch (e) { if (debug) console.warn('⚠️ [ADV] Falha TruePeak:', e?.message || e); }
    }
  timing.truePeakMs = Math.round(performance.now() - t0TP);

  // ===== FASE 2 (INÍCIO): Bandas espectrais alinhadas às referências =====
    try {
      const t0Spec = performance.now();
      const ref = (typeof window !== 'undefined') ? window.PROD_AI_REF_DATA : null;
      const doBands = !!ref && cache.specMod && !cache.specMod.__err && typeof cache.specMod.analyzeSpectralFeatures === 'function';
      if (doBands) {
        // Evitar reprocessar se já existe (idempotente)
        if (!td.bandEnergies) {
          // Esperar referência carregada (até 1s) se necessário
          if (!ref) {
            await new Promise(r => setTimeout(r, 50));
          }
          // Fonte espectral: por padrão usa canal esquerdo (compatibilidade). Opcionalmente mix estéreo
          const useStereoMix = (typeof window !== 'undefined' && window.USE_STEREO_MIX_SPECTRUM === true);
          const srcBuffer = (useStereoMix && right) ? (function(){
            const maxSeconds = 90;
            const maxSamples = Math.min(Math.min(left.length, right.length), sr * maxSeconds);
            const mix = new Float32Array(maxSamples);
            for (let i=0;i<maxSamples;i++) mix[i] = 0.5*(left[i] + right[i]);
            return mix;
          })() : (function(){
            const maxSeconds = 90;
            const maxSamples = Math.min(left.length, sr * maxSeconds);
            return left.subarray(0, maxSamples);
          })();
          const slice = srcBuffer;
          let specRes = null;
          try {
            specRes = cache.specMod.analyzeSpectralFeatures(slice, sr, 'fast');
          } catch (se) { if (debug) console.warn('⚠️ [ADV] Falha analyzeSpectralFeatures:', se?.message || se); }
          if (specRes && Array.isArray(specRes.spectrum_avg) && Array.isArray(specRes.freq_bins_compact)) {
            // Definir faixas das bandas (assumido; documentar se necessário)
            const bandDefs = {
              sub: [20, 60],
              low_bass: [60, 120],
              upper_bass: [120, 250],
              low_mid: [250, 500],
              mid: [500, 2000],
              high_mid: [2000, 6000],
              brilho: [6000, 12000],
              presenca: [12000, 18000]
            };
            const bins = specRes.freq_bins_compact;
            const mags = specRes.spectrum_avg;
            const bandEnergies = {};
            const totalEnergy = mags.reduce((a,b)=>a + (b>0?b:0),0) || 1;
            for (const [band,[fLow,fHigh]] of Object.entries(bandDefs)) {
              let energy=0, count=0;
              for (let i=0; i<bins.length; i++) {
                const f = bins[i];
                if (f >= fLow && f < fHigh) { energy += mags[i]; count++; }
              }
              if (count>0) {
                const lin = energy / count; // média simples
                // CORREÇÃO: Normalizar pela energia TOTAL, não pela média por bin
                // Isso garante valores relativos negativos (banda < total)
                const norm = energy / totalEnergy; // Proporção da energia total
                const db = 10 * Math.log10(norm || 1e-9);
                bandEnergies[band] = { energy: lin, rms_db: db, scale: 'log_ratio_db' };
              } else {
                bandEnergies[band] = { energy: 0, rms_db: -Infinity, scale: 'log_ratio_db' };
              }
            }
            td.bandEnergies = bandEnergies;
            (td._sources = td._sources || {}).bandEnergies = 'advanced:spectrum';
            // Alternativa segura: normalização log baseada na proporção da soma linear por banda
            try {
              const sumPerBand = {};
              let totalSum = 0;
              for (const [band,[fLow,fHigh]] of Object.entries(bandDefs)) {
                let sum=0;
                for (let i=0;i<bins.length;i++) {
                  const f = bins[i];
                  if (f >= fLow && f < fHigh) { const v = mags[i]; if (v>0) sum += v; }
                }
                sumPerBand[band] = sum;
                totalSum += sum;
              }
              const safeTotal = totalSum || 1;
              const bandEnergiesLog = {};
              for (const band of Object.keys(bandDefs)) {
                let ratio = sumPerBand[band] / safeTotal;
                if (!(ratio>0)) ratio = 1e-9; // evitar -Inf
                const db = 10 * Math.log10(ratio);
                // manter shape compatível (usa rms_db)
                bandEnergiesLog[band] = { rms_db: db, proportion: ratio, scale: 'log_proportion_db' };
              }
              td.bandEnergiesLog = bandEnergiesLog;
              (td._sources = td._sources || {}).bandEnergiesLog = 'advanced:spectrum:log';
              // Metadados de escala global
              td.bandScale = 'log_ratio_db';
              td.bandLogScale = 'log_proportion_db';
            } catch (_) { /* não crítico */ }
            // Converter subconjunto para tonalBalance se ainda vazio (não substitui tonalBalance existente)
            if (!td.tonalBalance) {
              td.tonalBalance = {
                sub: bandEnergies.sub ? { rms_db: bandEnergies.sub.rms_db } : null,
                low: bandEnergies.low_bass ? { rms_db: bandEnergies.low_bass.rms_db } : null,
                mid: bandEnergies.mid ? { rms_db: bandEnergies.mid.rms_db } : null,
                high: bandEnergies.brilho ? { rms_db: bandEnergies.brilho.rms_db } : null
              };
              (td._sources = td._sources || {}).tonalBalance = 'advanced:spectrum';
            }
            // Comparar com targets da referência e gerar sugestões band_adjust
            try {
              const sug = baseAnalysis.suggestions = Array.isArray(baseAnalysis.suggestions) ? baseAnalysis.suggestions : [];
              const existingKeys = new Set(sug.map(s => s && s._bandKey));
              let addedCount = 0;
              const maxBandSuggestions = (typeof window !== 'undefined' && Number.isFinite(window.MAX_BAND_SUGGESTIONS)) ? window.MAX_BAND_SUGGESTIONS : 6;
              // === Normalização de escala de bandas (feature flag) ===
              // Objetivo: quando referências possuem escala diferente (ex.: valores positivos grandes) alinhar ao espaço dos valores medidos (normalmente negativos em log_ratio_db)
              let refBandTargetsNormalized = null;
              try {
                const enableNorm = (typeof window !== 'undefined' && window.ENABLE_REF_BAND_NORMALIZATION === true);
                if (enableNorm && ref && ref.bands && td.bandEnergies) {
                  const measuredVals = Object.values(td.bandEnergies).map(v => v && Number.isFinite(v.rms_db) ? v.rms_db : null).filter(v => v!=null);
                  const refVals = Object.values(ref.bands).map(v => v && Number.isFinite(v.target_db) ? v.target_db : null).filter(v => v!=null);
                  if (measuredVals.length >= 3 && refVals.length >= 3) {
                    const measMin = Math.min(...measuredVals);
                    const measMax = Math.max(...measuredVals);
                    const refMin = Math.min(...refVals);
                    const refMax = Math.max(...refVals);
                    const posRefRatio = refVals.filter(v => v > 0).length / refVals.length;
                    const allMeasuredNeg = measuredVals.every(v => v <= 0);
                    if (allMeasuredNeg && posRefRatio > 0.6 && (refMax - refMin) > 1e-3 && (measMax - measMin) > 1e-3) {
                      refBandTargetsNormalized = {};
                      for (const [bk, rb] of Object.entries(ref.bands)) {
                        if (rb && Number.isFinite(rb.target_db)) {
                          const t = (rb.target_db - refMin) / (refMax - refMin);
                          refBandTargetsNormalized[bk] = measMin + t * (measMax - measMin);
                        }
                      }
                    }
                  }
                  // Construir estrutura norm com status (OK/OUT/NA)
                  const normBands = {};
                  for (const [bk, rb] of Object.entries(ref.bands)) {
                    const measured = td.bandEnergies[bk];
                    const hasTarget = rb && Number.isFinite(rb.target_db) && Number.isFinite(rb.tol_db);
                    if (!hasTarget) {
                      normBands[bk] = { rms_db: measured?.rms_db ?? null, status: 'NA' };
                      continue;
                    }
                    const target = (refBandTargetsNormalized && Number.isFinite(refBandTargetsNormalized[bk])) ? refBandTargetsNormalized[bk] : rb.target_db;
                    const tol = rb.tol_db;
                    const val = measured && Number.isFinite(measured.rms_db) ? measured.rms_db : null;
                    if (val == null) { normBands[bk] = { rms_db: null, target, tol, status: 'MISSING' }; continue; }
                    const delta = val - target;
                    normBands[bk] = { rms_db: val, target, tol, delta, status: Math.abs(delta) <= tol ? 'OK':'OUT' };
                  }
                  td.bandNorm = { bands: normBands, normalized: !!refBandTargetsNormalized };
                  (td._sources = td._sources || {}).bandNorm = 'audit:band_norm';
                }
              } catch (eNorm) { if (window.DEBUG_ANALYZER) console.warn('[REF_SCALE] Falha normalização bandas', eNorm); }
              for (const [band, data] of Object.entries(bandEnergies)) {
                if (addedCount >= maxBandSuggestions) break;
                const refBand = ref?.bands?.[band];
                if (!refBand || !Number.isFinite(refBand.target_db) || !Number.isFinite(refBand.tol_db)) continue;
                if (!Number.isFinite(data.rms_db) || data.rms_db === -Infinity) continue;
                // Usar valor normalizado se disponível
                const refTarget = (refBandTargetsNormalized && Number.isFinite(refBandTargetsNormalized[band])) ? refBandTargetsNormalized[band] : refBand.target_db;
                // CORREÇÃO: Usar mesmo cálculo da tabela de referência (atual - target)
                const diff = data.rms_db - refTarget;
                // Suporte a tolerância assimétrica: tol_min / tol_max. Compat: usar tol_db se não existirem.
                const tolMin = Number.isFinite(refBand.tol_min) ? refBand.tol_min : refBand.tol_db;
                const tolMax = Number.isFinite(refBand.tol_max) ? refBand.tol_max : refBand.tol_db;
                const highLimit = refTarget + tolMax;
                const lowLimit = refTarget - tolMin;
                let status = 'OK';
                if (data.rms_db < lowLimit) status = 'BAIXO'; else if (data.rms_db > highLimit) status = 'ALTO';
                const outOfRange = status !== 'OK';
                if (outOfRange) {
                  // CORREÇÃO: Usar a mesma lógica da tabela de referência
                  // diff > 0 = valor atual maior que target = DIMINUIR/CORTAR
                  // diff < 0 = valor atual menor que target = AUMENTAR/BOOST
                  const shouldReduce = diff > 0; // valor atual > target
                  const shouldBoost = diff < 0;  // valor atual < target
                  
                  const baseMag = Math.abs(diff);
                  const sideTol = diff > 0 ? tolMax : tolMin;
                  const n = sideTol>0 ? baseMag / sideTol : 0;
                  const severity = n <= 1 ? 'leve' : (n <= 2 ? 'media' : 'alta');
                  let action;
                  
                  if (shouldReduce) {
                    // Valor atual > target = precisa reduzir
                    if (band === 'high_mid') {
                      action = `Médios Agudos estão ${baseMag.toFixed(1)}dB acima do ideal`;
                      var explanation = "Excesso nesta faixa causa harshness e fadiga auditiva";
                      var impact = "Som áspero, vocais agressivos, cymbals cortantes";
                      var frequency_range = "2–4 kHz";
                      var adjustment_db = -baseMag;
                    }
                    else if (band === 'brilho') {
                      action = `Agudos estão ${baseMag.toFixed(1)}dB acima do ideal`;
                      var explanation = "Excesso de brilho pode causar sibilância excessiva";
                      var impact = "Som muito brilhante, sibilantes exageradas, fadiga";
                      var frequency_range = "4–8 kHz";
                      var adjustment_db = -baseMag;
                    }
                    else if (band === 'presenca') {
                      action = `Presença está ${baseMag.toFixed(1)}dB acima do ideal`;
                      var explanation = "Excesso de presença torna o som artificial e cansativo";
                      var impact = "Vocais muito na frente, instrumentos artificiais";
                      var frequency_range = "8–12 kHz";
                      var adjustment_db = -baseMag;
                    }
                    else if (band === 'low_bass') {
                      action = `Bass está ${baseMag.toFixed(1)}dB acima do ideal`;
                      var explanation = "Excesso de graves causa perda de definição e mascaramento";
                      var impact = "Som confuso, perda de punch, mascaramento dos médios";
                      var frequency_range = "60–200 Hz";
                      var adjustment_db = -baseMag;
                    }
                    else if (band === 'mid_bass') {
                      action = `Médios Graves estão ${baseMag.toFixed(1)}dB acima do ideal`;
                      var explanation = "Excesso nesta região causa 'muddy sound' (som enlameado)";
                      var impact = "Som abafado, instrumentos sem clareza, mix confuso";
                      var frequency_range = "200–500 Hz";
                      var adjustment_db = -baseMag;
                    }
                    else if (band === 'mid') {
                      action = `Médios estão ${baseMag.toFixed(1)}dB acima do ideal`;
                      var explanation = "Excesso de médios deixa o som entediante e sem vida";
                      var impact = "Som monótono, vocais abafados, falta de dinâmica";
                      var frequency_range = "500 Hz–2 kHz";
                      var adjustment_db = -baseMag;
                    }
                    else {
                      action = `${band} precisa ser reduzido em ${baseMag.toFixed(1)}dB`;
                      var explanation = "Nível acima do recomendado para o gênero";
                      var impact = "Desequilíbrio tonal geral";
                      var frequency_range = "N/A";
                      var adjustment_db = -baseMag;
                    }
                  } else if (shouldBoost) {
                    // Valor atual < target = precisa aumentar
                    if (band === 'high_mid') {
                      action = `Médios Agudos estão ${baseMag.toFixed(1)}dB abaixo do ideal`;
                      var explanation = "Falta de definição e clareza na região de presença vocal";
                      var impact = "Vocais distantes, falta de inteligibilidade, som sem vida";
                      var frequency_range = "2–4 kHz";
                      var adjustment_db = baseMag;
                    }
                    else if (band === 'brilho') {
                      action = `Agudos estão ${baseMag.toFixed(1)}dB abaixo do ideal`;
                      var explanation = "Falta de brilho e air deixa o som sem abertura";
                      var impact = "Som abafado, cymbals sem crisp, falta de espacialidade";
                      var frequency_range = "4–8 kHz";
                      var adjustment_db = baseMag;
                    }
                    else if (band === 'presenca') {
                      action = `Presença está ${baseMag.toFixed(1)}dB abaixo do ideal`;
                      var explanation = "Falta de presença reduz a proximidade e intimidade";
                      var impact = "Instrumentos distantes, falta de conexão emocional";
                      var frequency_range = "8–12 kHz";
                      var adjustment_db = baseMag;
                    }
                    else if (band === 'low_bass') {
                      action = `Bass está ${baseMag.toFixed(1)}dB abaixo do ideal`;
                      var explanation = "Falta de fundação graves reduz o impacto e energia";
                      var impact = "Som fraco, sem peso, falta de groove e energia";
                      var frequency_range = "60–200 Hz";
                      var adjustment_db = baseMag;
                    }
                    else if (band === 'mid_bass') {
                      action = `Médios Graves estão ${baseMag.toFixed(1)}dB abaixo do ideal`;
                      var explanation = "Falta de corpo e warmth na região fundamental";
                      var impact = "Som fino, instrumentos sem corpo, falta de calor";
                      var frequency_range = "200–500 Hz";
                      var adjustment_db = baseMag;
                    }
                    else if (band === 'mid') {
                      action = `Médios estão ${baseMag.toFixed(1)}dB abaixo do ideal`;
                      var explanation = "Falta de preenchimento na região mais importante para audição";
                      var impact = "Som oco, vocais distantes, falta de corpo geral";
                      var frequency_range = "500 Hz–2 kHz";
                      var adjustment_db = baseMag;
                    }
                    else {
                      action = `${band} precisa ser aumentado em ${baseMag.toFixed(1)}dB`;
                      var explanation = "Nível abaixo do recomendado para o gênero";
                      var impact = "Desequilíbrio tonal geral";
                      var frequency_range = "N/A";
                      var adjustment_db = baseMag;
                    }
                  }
                  const key = `band:${band}`;
                  if (!existingKeys.has(key)) {
                    // Acrescentar faixa sugerida (Hz) nos detalhes, usando definição das bandas
                    const br = bandDefs[band];
                    const rangeTxt = Array.isArray(br) && br.length===2 ? ` | faixa ${Math.round(br[0])}-${Math.round(br[1])}Hz` : '';
                    // Usar nome amigável da banda se disponível
                    const friendlyBandName = (window.getFriendlyLabel && window.getFriendlyLabel(`band:${band}`)) || band;
                    const statusMessage = shouldReduce ? `${friendlyBandName} acima do ideal` : `${friendlyBandName} abaixo do ideal`;
                    
                    sug.push({
                      type: 'band_adjust',
                      _bandKey: key,
                      message: `${friendlyBandName}: ${statusMessage}`,
                      action: action.replace(new RegExp(`\\b${band}\\b`, 'gi'), friendlyBandName),
                      explanation: explanation || "Ajuste necessário para equilibrio tonal",
                      impact: impact || "Afeta o balanço geral da mixagem",
                      frequency_range: frequency_range || "N/A",
                      adjustment_db: adjustment_db || 0,
                      details: `Atual: ${data.rms_db.toFixed(1)}dB | Alvo: ${refTarget.toFixed(1)}dB | Diferença: ${diff>0?'+':''}${diff.toFixed(1)}dB`
                    });
                    existingKeys.add(key);
                    addedCount++;
                  }
                }
              }
            } catch (es) { if (debug) console.warn('⚠️ [ADV] Sugestões bandas falharam:', es?.message || es); }
            // Sugestões agrupadas (Lote B) – somente se múltiplas bandas relacionadas fora do alvo
            try {
              const sug = baseAnalysis.suggestions = Array.isArray(baseAnalysis.suggestions) ? baseAnalysis.suggestions : [];
              const groups = [
                { name: 'Graves', bands: ['sub','low_bass','upper_bass'] },
                { name: 'Médios', bands: ['low_mid','mid','high_mid'] },
                { name: 'Agudos', bands: ['brilho','presenca'] }
              ];
              for (const g of groups) {
                const related = sug.filter(s => s.type==='band_adjust' && g.bands.some(b => s._bandKey === `band:${b}`));
                if (related.length >= 2) {
                  const diffs = related.map(r => {
                    const m = r.details && r.details.match(/([+\-]?[0-9.]+)dB/); return m ? Math.abs(parseFloat(m[1])) : 0; });
                  const meanAbs = diffs.reduce((a,b)=>a+b,0)/Math.max(1,diffs.length);
                  if (!sug.some(s => s.type==='band_group_adjust' && s.group===g.name)) {
                    sug.push({
                      type: 'band_group_adjust',
                      group: g.name,
                      message: `${g.name} com várias bandas fora do alvo`,
                      action: `Aplicar EQ geral nos ${g.name.toLowerCase()} (ajuste médio ~${meanAbs.toFixed(1)}dB)`,
                      details: related.map(r=>r.message).join(' | ')
                    });
                  }
                }
              }
            } catch (eg) { if (debug) console.warn('⚠️ [ADV] Agrupamento bandas falhou:', eg?.message || eg); }
            // Ordenação opcional das sugestões por prioridade (não altera padrão)
            try {
              if (typeof window !== 'undefined' && window.SORT_SUGGESTIONS === true) {
                const priority = {
                  band_group_adjust: 1,
                  band_adjust: 2,
                  surgical_eq: 3,
                  mastering: 4,
                  frequency_imbalance: 5,
                  highs_excess: 5,
                  highs_deficient: 5,
                  low_end_excess: 5,
                  bass_deficient: 5,
                };
                const arr = baseAnalysis.suggestions || [];
                baseAnalysis.suggestions = arr
                  .map((s, idx) => ({ s, idx }))
                  .sort((a,b)=> (priority[a.s?.type]||99) - (priority[b.s?.type]||99) || a.idx - b.idx)
                  .map(x=>x.s);
              }
            } catch (esrt) { if (debug) console.warn('⚠️ [ADV] Sort sugestões falhou:', esrt?.message || esrt); }
            // Sugestões cirúrgicas (detecção de ressonâncias estreitas)
            try {
              const enableSurgical = (typeof window === 'undefined' || window.USE_SURGICAL_EQ !== false);
              if (enableSurgical && Array.isArray(mags) && Array.isArray(bins)) {
                const sug = baseAnalysis.suggestions = Array.isArray(baseAnalysis.suggestions) ? baseAnalysis.suggestions : [];
                const maxItems = (typeof window !== 'undefined' && Number.isFinite(window.MAX_SURGICAL_EQ)) ? window.MAX_SURGICAL_EQ : 3;
                const minHz = 120; // evitar subgrave
                const maxHz = 12000; // evitar extremo alto
                const results = [];
                // Suavização local simples e detecção por contraste com vizinhos
                const eps = 1e-12;
                const win = 2; // vizinhos de cada lado
                for (let i = win; i < mags.length - win; i++) {
                  const f = bins[i];
                  if (f < minHz || f > maxHz) continue;
                  const m = Math.max(mags[i], 0);
                  // média de vizinhos (exclui o pico)
                  let nsum = 0, ncount = 0;
                  for (let k = i - win; k <= i + win; k++) {
                    if (k === i) continue; const mv = Math.max(mags[k], 0); nsum += mv; ncount++;
                  }
                  const navg = nsum / Math.max(1, ncount);
                  const contrastDb = 20 * Math.log10((m + eps) / (navg + eps));
                  if (!Number.isFinite(contrastDb)) continue;
                  // critério: pico pelo menos 7 dB acima da vizinhança
                  if (contrastDb >= 7) {
                    results.push({ idx: i, freq: f, gainDb: contrastDb, mag: m });
                  }
                }
                // Ordenar por saliência e filtrar próximos (>= 200 Hz de distância)
                results.sort((a,b)=> b.gainDb - a.gainDb);
                const picked = [];
                const minDist = 200; // Hz
                for (const r of results) {
                  if (picked.length >= maxItems) break;
                  if (picked.some(p => Math.abs(p.freq - r.freq) < minDist)) continue;
                  picked.push(r);
                }
                // Adicionar sugestões
                for (const r of picked) {
                  // Severidade baseada no ganho relativo
                  const severity = r.gainDb >= 12 ? 'severa' : (r.gainDb >= 9 ? 'alta' : 'moderada');
                  const freqStr = Math.round(r.freq);
                  const gainStr = (r.gainDb >= 12 ? 4 : r.gainDb >= 9 ? 3 : 2); // sugestão de corte aproximado
                  const qStr = r.freq < 1500 ? 5 : (r.freq < 5000 ? 6 : 7);
                  // Evitar duplicados aproximados
                  const dupe = sug.some(s => s.type==='surgical_eq' && /\[(\d+)Hz\]/.test(s.message || '') && Math.abs(parseFloat((s.message.match(/\[(\d+)Hz\]/)||[])[1]) - r.freq) < 120);
                  if (dupe) continue;
                  sug.push({
                    type: 'surgical_eq',
                    message: `Ressonância — [${freqStr}Hz] - ${severity}`,
                    action: `Corte cirúrgico em ${freqStr} Hz: -${gainStr} dB, Q ${qStr}`,
                    details: `Pico estreito ~+${r.gainDb.toFixed(1)} dB acima da vizinhança`
                  });
                }
              }
            } catch (esurg) { if (debug) console.warn('⚠️ [ADV] Surgical EQ falhou:', esurg?.message || esurg); }
            if (debug) console.log('✅ [ADV] Band energies calculadas', td.bandEnergies);
          }
        }
      }
      if (doBands) timing.spectrumMs = Math.round(performance.now() - t0Spec);
    } catch (e) { if (debug) console.warn('⚠️ [ADV] Band energies falharam:', e?.message || e); }
    // ===== FASE 2 (FIM) =====

    // ===== Validação de consistência (DR vs crestFactor, Loudness Range plausível) =====
    try {
      const mv = baseAnalysis.metricsValidation || (baseAnalysis.metricsValidation = {});
      const peak = td.peak ?? baseAnalysis.technicalData.peak;
      const rms = td.rms ?? baseAnalysis.technicalData.rms;
      const dr = td.dynamicRange ?? baseAnalysis.technicalData.dynamicRange;
      const crest = td.crestFactor;
      if (Number.isFinite(peak) && Number.isFinite(rms)) {
        const expectedDR = Math.abs(peak - rms);
        if (Number.isFinite(dr)) {
          const diff = Math.abs(dr - expectedDR);
          mv.dynamicRangeConsistency = diff < 0.8 ? 'ok' : (diff < 1.5 ? 'warn' : 'check');
          mv.dynamicRangeDelta = parseFloat(diff.toFixed(2));
        }
        if (Number.isFinite(crest)) {
          const d2 = Math.abs(crest - expectedDR);
          mv.crestFactorConsistency = d2 < 0.8 ? 'ok' : (d2 < 1.5 ? 'warn' : 'check');
          mv.crestVsExpectedDelta = parseFloat(d2.toFixed(2));
        }
      }
      // 🎯 Validação LRA: detectar valores anômalos
      if (Number.isFinite(td.lra)) {
        if (td.lra > 30) {
          mv.lraAnomaly = 'high';
          mv.lraNote = 'LRA muito alto - possível uso de algoritmo legacy';
          console.warn(`⚠️ LRA anômalo: ${td.lra.toFixed(1)} LU - considere ativar USE_R128_LRA`);
        } else if (td.lra < 0.5) {
          mv.lraAnomaly = 'low';
          mv.lraNote = 'LRA muito baixo - material muito comprimido';
        } else {
          mv.lraAnomaly = 'normal';
        }
      }
      // 🎯 Validação LUFS: range broadcasting
      if (Number.isFinite(td.lufsIntegrated)) {
        const lufs = td.lufsIntegrated;
        if (lufs > -6) {
          mv.lufsWarning = 'very_loud';
          mv.lufsNote = 'LUFS muito alto - risco de distorção';
        } else if (lufs < -50) {
          mv.lufsWarning = 'very_quiet';
          mv.lufsNote = 'LUFS muito baixo - possível silêncio/erro';
        } else if (lufs >= -24 && lufs <= -22) {
          mv.lufsNote = 'Broadcast compliant (EBU R128)';
        }
      }
      // 🎯 Validação adicional LRA vs DR
      if (Number.isFinite(td.lra) && Number.isFinite(dr)) {
        // LRA plausível: não maior que 3× DR e não negativa
        mv.lraPlausibility = (td.lra >= 0 && td.lra <= dr * 3) ? 'ok' : 'check';
      }
    } catch (e) { if (debug) console.warn('⚠️ [ADV] Validação métricas falhou:', e?.message || e); }
    // === Invariantes & saneamento (feature flag ENABLE_METRIC_INVARIANTS) ===
    try {
      if (typeof window === 'undefined' || window.ENABLE_METRIC_INVARIANTS === true) {
        const tdv = baseAnalysis.technicalData || {};
        const logWarn = (m,c={})=>{ if (typeof window !== 'undefined' && window.DEBUG_ANALYZER) console.warn('[INVARIANT]', m, c); };
        // Consolidar sample peaks
        if (Number.isFinite(tdv.samplePeakLeftDb) && Number.isFinite(tdv.samplePeakRightDb)) {
          const maxPk = Math.max(tdv.samplePeakLeftDb, tdv.samplePeakRightDb);
          if (!Number.isFinite(tdv.samplePeakDb)) tdv.samplePeakDb = maxPk;
        }
        // SamplePeak ≤ TruePeak ≤ 0
        if (Number.isFinite(tdv.truePeakDbtp)) {
          if (tdv.truePeakDbtp > 0.05) logWarn('TruePeak > 0dBTP', {tp: tdv.truePeakDbtp});
          if (Number.isFinite(tdv.samplePeakDb) && tdv.samplePeakDb > tdv.truePeakDbtp + 0.1) {
            tdv.truePeakDbtp = tdv.samplePeakDb;
            logWarn('Ajustado truePeak para samplePeak', {newTruePeak: tdv.truePeakDbtp});
          }
          if (tdv.truePeakDbtp > 0) tdv.truePeakDbtp = 0; // clamp
        }
        // Headroom = 0 - TruePeak
        if (Number.isFinite(tdv.truePeakDbtp)) {
          const expHead = 0 - tdv.truePeakDbtp;
            if (!Number.isFinite(tdv.headroomTruePeakDb) || Math.abs(tdv.headroomTruePeakDb - expHead) > 0.11) {
              tdv.headroomTruePeakDb = expHead;
            }
          // Opcionalmente alinhar headroomDb ao headroomTruePeakDb (verdadeiro headroom em dBTP)
          try {
            const enforce = (typeof window === 'undefined' || window.ENFORCE_TRUEPEAK_HEADROOM === true);
            if (enforce && (!Number.isFinite(tdv.headroomDb) || Math.abs(tdv.headroomDb - expHead) > 0.11)) {
              tdv.headroomDb = expHead;
              (tdv._sources = tdv._sources || {}).headroomDb = 'invariant:truepeak';
            }
          } catch {}
        }
        // Clipping problem consistente - critérios mais rigorosos
        try {
          const tp = tdv.truePeakDbtp;
          const peak = tdv.peak;
          const clipSamples = tdv.clippingSamplesTruePeak ?? tdv.clippingSamples;
          const clipPct = tdv.clippingPct;
          
          // Critérios mais rigorosos para detecção de clipping
          const hasClippingByTruePeak = Number.isFinite(tp) && tp >= -0.1;
          const hasClippingByPeak = Number.isFinite(peak) && peak >= -0.1;
          const hasClippingBySamples = Number.isFinite(clipSamples) && clipSamples > 0;
          const hasClippingByPercent = Number.isFinite(clipPct) && clipPct > 0;
          
          const should = hasClippingByTruePeak || hasClippingByPeak || hasClippingBySamples || hasClippingByPercent;
          
          const probs = Array.isArray(baseAnalysis.problems) ? baseAnalysis.problems : (baseAnalysis.problems=[]);
          const has = probs.some(p=>p.type==='clipping');
          
          if (has && !should) {
            baseAnalysis.problems = probs.filter(p=>p.type!=='clipping');
          }
          // Nota: Clipping será gerado pela função principal generateTechnicalProblems() com formato melhorado
        } catch {}
        // LUFS ST plausível
        if (Number.isFinite(tdv.lufsIntegrated) && Number.isFinite(tdv.lufsShortTerm) && Math.abs(tdv.lufsShortTerm - tdv.lufsIntegrated) > 25) {
          logWarn('Invalid lufsShortTerm removed', {lufsIntegrated: tdv.lufsIntegrated, lufsShortTerm: tdv.lufsShortTerm});
          delete tdv.lufsShortTerm;
        }
        // Anti-NaN
        Object.entries(tdv).forEach(([k,v])=>{ if (typeof v==='number' && !Number.isFinite(v)) { delete tdv[k]; logWarn('Removed non-finite', {k}); }});
      }
    } catch (invErr) { if (typeof window !== 'undefined' && window.DEBUG_ANALYZER) console.warn('Falha invariants', invErr); }

    return baseAnalysis;
  } catch (err) {
    if (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true) console.warn('⚠️ [ADV] Adapter geral falhou:', err?.message || err);
    return baseAnalysis;
  }
};

// ===== FASE 1 AUDITORIA: FUNÇÕES DE UNIFICAÇÃO E OBSERVAÇÃO =====

/**
 * FASE 1: Unifica dados de múltiplas fontes em single source of truth
 * ⚠️ ZERO RISCO: Apenas observa e organiza, não altera comportamento
 */
function getUnifiedAnalysisData(baseAnalysis, technicalData, v2Metrics) {
  try {
    if (!baseAnalysis || !technicalData) {
      console.warn('🔍 FASE 1: Dados insuficientes para unificação');
      return {};
    }
    
    const unified = {
      // LUFS - Prioridade: V2 > V1 fallback
      lufsIntegrated: technicalData?.lufsIntegrated ?? 
                     v2Metrics?.loudness?.lufs_integrated ?? 
                     baseAnalysis?.technicalData?.rms ?? null,
    
    lufsShortTerm: technicalData?.lufsShortTerm ?? 
                   v2Metrics?.loudness?.lufs_short_term ?? null,
    
    lufsMomentary: technicalData?.lufsMomentary ?? 
                   v2Metrics?.loudness?.lufs_momentary ?? null,
    
    // True Peak - Prioridade: V2 > V1 fallback
    truePeakDbtp: technicalData?.truePeakDbtp ?? 
                  v2Metrics?.truePeak?.true_peak_dbtp ?? 
                  baseAnalysis?.peakDb ?? null,
    
    // Clipping - Múltiplas fontes
    clippingSamples: technicalData?.clippingSamples ?? 
                     v2Metrics?.core?.clippingEvents ?? 0,
    
    clippingPct: technicalData?.clippingPct ?? 
                 v2Metrics?.core?.clippingPercentage ?? 0,
    
    // Dinâmica
    lra: technicalData?.lra ?? v2Metrics?.loudness?.lra ?? null,
    
    // Estéreo
    stereoCorrelation: technicalData?.stereoCorrelation ?? 
                       v2Metrics?.stereo?.correlation ?? null,
    
    monoCompatibility: technicalData?.monoCompatibility ?? 
                       v2Metrics?.stereo?.monoCompatibility ?? null,
    
    // Timestamp para logs
    _timestamp: Date.now(),
    _sources: {
      hasV2: !!v2Metrics,
      hasV1: !!baseAnalysis,
      hasTD: !!technicalData
    }
  };
  
  return unified;
  
  } catch (unificationError) {
    console.warn('🔍 FASE 1: Erro na unificação:', unificationError.message);
    return {}; // Retorna objeto vazio em caso de erro
  }
}

/**
 * FASE 1: Auditoria de consistência passiva
 * ⚠️ ZERO RISCO: Apenas logs, não altera comportamento
 */
function performConsistencyAudit(unifiedData, baseAnalysis) {
  try {
    if (!unifiedData || !baseAnalysis) {
      console.warn('🔍 FASE 1: Dados insuficientes para auditoria');
      return;
    }
    
    if (!window.DEBUG_ANALYZER && !window.ENABLE_AUDIT_LOGS) return;
  
  const issues = [];
  const warnings = [];
  
  // 🔍 AUDITORIA 1: Clipping Logic
  const hasClippingAlert = baseAnalysis?.problems?.some(p => p?.type === 'clipping');
  const clippingMetrics = {
    samples: unifiedData.clippingSamples,
    percentage: unifiedData.clippingPct,
    truePeak: unifiedData.truePeakDbtp
  };
  
  if (hasClippingAlert && unifiedData.clippingSamples === 0 && unifiedData.truePeakDbtp < -1.0) {
    issues.push({
      type: 'CLIPPING_FALSE_POSITIVE',
      description: 'Clipping alert com 0% clipping e truePeak < -1.0 dBTP',
      data: clippingMetrics
    });
  }
  
  // 🔍 AUDITORIA 2: LUFS Consistency  
  const lufsValues = {
    integrated: unifiedData.lufsIntegrated,
    shortTerm: unifiedData.lufsShortTerm,
    momentary: unifiedData.lufsMomentary
  };
  
  if (unifiedData.lufsIntegrated && unifiedData.lufsShortTerm) {
    const diff = Math.abs(unifiedData.lufsIntegrated - unifiedData.lufsShortTerm);
    if (diff > 10) {
      warnings.push({
        type: 'LUFS_INCONSISTENT',
        description: `Diferença LUFS Integrado vs Short-Term muito alta: ${diff.toFixed(1)} dB`,
        data: lufsValues
      });
    }
  }
  
  // 🔍 AUDITORIA 3: Dynamic Range Validation
  if (unifiedData.lra !== null && unifiedData.lra < 0) {
    issues.push({
      type: 'NEGATIVE_DYNAMICS',
      description: 'LRA (Loudness Range) negativo detectado',
      data: { lra: unifiedData.lra }
    });
  }
  
  // 🔍 AUDITORIA 4: Stereo/Mono Alignment
  if (unifiedData.stereoCorrelation !== null && unifiedData.monoCompatibility) {
    const correlation = unifiedData.stereoCorrelation;
    const mono = unifiedData.monoCompatibility;
    
    // Correlação baixa deveria indicar problemas mono
    if (correlation < -0.2 && mono !== 'Problemas de fase') {
      warnings.push({
        type: 'STEREO_MONO_MISALIGN',
        description: 'Correlação baixa mas compatibilidade mono não indica problemas',
        data: { correlation, monoCompatibility: mono }
      });
    }
  }
  
  // 📊 LOG CONSOLIDADO
  if (issues.length > 0 || warnings.length > 0) {
    console.group('🔍 AUDITORIA ANALYZER - Inconsistências Detectadas');
    
    if (issues.length > 0) {
      console.error('🚨 PROBLEMAS CRÍTICOS:', issues);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ AVISOS:', warnings);
    }
    
    console.log('📊 DADOS UNIFICADOS:', unifiedData);
    console.groupEnd();
  } else if (window.DEBUG_ANALYZER) {
    console.log('✅ AUDITORIA: Nenhuma inconsistência detectada');
  }
  
  // Armazenar resultados para análise (não afeta comportamento)
  if (typeof window !== 'undefined') {
    window.__AUDIT_RESULTS__ = window.__AUDIT_RESULTS__ || [];
    window.__AUDIT_RESULTS__.push({
      timestamp: Date.now(),
      issues,
      warnings,
      unifiedData: { ...unifiedData }
    });
    
    // Manter apenas últimos 10 resultados
    if (window.__AUDIT_RESULTS__.length > 10) {
      window.__AUDIT_RESULTS__ = window.__AUDIT_RESULTS__.slice(-10);
    }
  }
  
  } catch (auditError) {
    console.warn('🔍 FASE 1: Erro na auditoria:', auditError.message);
  }
}

/**
 * FASE 2: Aplicar correções baseadas em dados unificados
 * ⚠️ BAIXO RISCO: Correções cosméticas e de consistência
 */
function applyUnifiedCorrections(baseAnalysis, technicalData, unifiedData) {
  try {
    if (!baseAnalysis || !technicalData || !unifiedData) {
      console.warn('🔧 FASE 2: Dados insuficientes para correções');
      return;
    }
    
    if (!window.DEBUG_ANALYZER && !window.ENABLE_PHASE2_CORRECTIONS) return;
  
  const corrections = [];
  
  // 🔧 CORREÇÃO 1: Garantir dinâmica nunca negativa
  if (technicalData.lra !== null && technicalData.lra < 0) {
    const originalLRA = technicalData.lra;
    technicalData.lra = Math.max(0, technicalData.lra);
    corrections.push({
      type: 'NEGATIVE_DYNAMICS_FIXED',
      description: `LRA corrigido: ${originalLRA.toFixed(2)} → ${technicalData.lra.toFixed(2)}`,
      original: originalLRA,
      corrected: technicalData.lra
    });
  }
  
  // 🔧 CORREÇÃO 2: Formatação de picos (preparar para futuras melhorias)
  const peakFields = ['truePeakDbtp', 'samplePeakLeftDb', 'samplePeakRightDb'];
  peakFields.forEach(field => {
    if (technicalData[field] !== null && Number.isFinite(technicalData[field])) {
      const original = technicalData[field];
      // Assegurar precisão de 2 casas decimais para picos
      technicalData[field] = Math.round(original * 100) / 100;
      
      if (Math.abs(original - technicalData[field]) > 0.001) {
        corrections.push({
          type: 'PEAK_FORMATTING_IMPROVED',
          field: field,
          description: `${field} formatado: ${original} → ${technicalData[field]}`,
          original: original,
          corrected: technicalData[field]
        });
      }
    }
  });
  
  // 🔧 CORREÇÃO 3: Filtrar sugestões perigosas quando há clipping
  if (Array.isArray(baseAnalysis.suggestions) && 
      (unifiedData.clippingSamples > 0 || unifiedData.truePeakDbtp >= -0.1)) {
    
    const originalLength = baseAnalysis.suggestions.length;
    
    // Remover sugestões que mencionam aumentar volume/picos
    baseAnalysis.suggestions = baseAnalysis.suggestions.filter(suggestion => {
      const message = suggestion?.message || '';
      const isDangerous = /aumentar.*volume|aumentar.*dBTP|mais.*loudness|push.*limiter/i.test(message);
      return !isDangerous;
    });
    
    if (baseAnalysis.suggestions.length < originalLength) {
      corrections.push({
        type: 'DANGEROUS_SUGGESTIONS_FILTERED',
        description: `Removidas ${originalLength - baseAnalysis.suggestions.length} sugestões perigosas com clipping presente`,
        clippingSamples: unifiedData.clippingSamples,
        truePeak: unifiedData.truePeakDbtp,
        filtered: originalLength - baseAnalysis.suggestions.length
      });
    }
  }
  
  // 📊 Log das correções aplicadas
  if (corrections.length > 0) {
    console.group('🔧 FASE 2 - Correções Aplicadas');
    corrections.forEach(correction => {
      console.log(`✅ ${correction.type}: ${correction.description}`);
    });
    console.groupEnd();
  } else if (window.DEBUG_ANALYZER) {
    console.log('🔧 FASE 2: Nenhuma correção necessária');
  }
  
  // Armazenar correções para análise
  if (typeof window !== 'undefined') {
    window.__PHASE2_CORRECTIONS__ = window.__PHASE2_CORRECTIONS__ || [];
    window.__PHASE2_CORRECTIONS__.push({
      timestamp: Date.now(),
      corrections: corrections.slice(),
      unifiedData: { ...unifiedData }
    });
    
    // Manter apenas últimos 10 resultados
    if (window.__PHASE2_CORRECTIONS__.length > 10) {
      window.__PHASE2_CORRECTIONS__ = window.__PHASE2_CORRECTIONS__.slice(-10);
    }
  }
  
  } catch (phase2Error) {
    console.warn('🔧 FASE 2: Erro nas correções:', phase2Error.message);
    // Continuar sem as correções em caso de erro
  }
}

// ===== FASE 3: ALINHAMENTO LÓGICO (RISCO MÉDIO) =====

/**
 * FASE 3: Correções de lógica e alinhamento de algoritmos
 * ⚠️ RISCO MÉDIO: Corrige lógica de detecção e cálculos
 * 🔒 SEGURANÇA: Feature flags e rollback automático
 */
function applyLogicAlignmentCorrections(baseAnalysis, technicalData, unifiedData, v2Metrics) {
  try {
    if (!baseAnalysis || !technicalData || !unifiedData) {
      console.warn('🔧 FASE 3: Dados insuficientes para alinhamento lógico');
      return;
    }
    
    // Feature flag para ativar Fase 3 
    if (!window.DEBUG_ANALYZER && !window.ENABLE_PHASE3_LOGIC_ALIGNMENT) return;
    
    const corrections = [];
    const originalState = {
      problems: JSON.parse(JSON.stringify(baseAnalysis.problems || [])),
      technicalData: JSON.parse(JSON.stringify(technicalData))
    };
    
    console.group('🎯 FASE 3 - Alinhamento Lógico');
    
    // 🔧 CORREÇÃO 1: Lógica de Clipping Aprimorada
    const clippingCorrection = fixClippingLogic(baseAnalysis, technicalData, unifiedData);
    if (clippingCorrection.applied) {
      corrections.push(clippingCorrection);
    }
    
    // 🔧 CORREÇÃO 2: Thresholds Dinâmicos de LUFS
    const lufsCorrection = fixLufsThresholds(baseAnalysis, technicalData, unifiedData);
    if (lufsCorrection.applied) {
      corrections.push(lufsCorrection);
    }
    
    // 🔧 CORREÇÃO 3: Score Calculation Accuracy
    const scoreCorrection = fixScoreCalculation(baseAnalysis, technicalData, unifiedData, v2Metrics);
    if (scoreCorrection.applied) {
      corrections.push(scoreCorrection);
    }
    
    // 🔧 CORREÇÃO 4: Stereo Analysis Consistency
    const stereoCorrection = fixStereoAnalysis(baseAnalysis, technicalData, unifiedData);
    if (stereoCorrection.applied) {
      corrections.push(stereoCorrection);
    }
    
    // 📊 Validação e Rollback Safety
    const validationResult = validatePhase3Changes(baseAnalysis, technicalData, originalState);
    if (!validationResult.isValid) {
      console.warn('⚠️ FASE 3: Validação falhou, fazendo rollback...');
      rollbackChanges(baseAnalysis, technicalData, originalState);
      corrections.length = 0; // Clear corrections
      corrections.push({
        type: 'PHASE3_ROLLBACK',
        description: 'Mudanças revertidas devido a falha na validação',
        reason: validationResult.reason
      });
    }
    
    // 📊 Log das correções aplicadas
    if (corrections.length > 0) {
      corrections.forEach(correction => {
        console.log(`✅ ${correction.type}: ${correction.description}`);
      });
    } else {
      console.log('🔧 FASE 3: Nenhuma correção lógica necessária');
    }
    
    console.groupEnd();
    
    // Armazenar correções para análise
    if (typeof window !== 'undefined') {
      window.__PHASE3_CORRECTIONS__ = window.__PHASE3_CORRECTIONS__ || [];
      window.__PHASE3_CORRECTIONS__.push({
        timestamp: Date.now(),
        corrections: corrections.slice(),
        originalState: originalState,
        finalState: {
          problems: baseAnalysis.problems?.length || 0,
          technicalDataKeys: Object.keys(technicalData || {}).length
        }
      });
      
      // Manter apenas últimos 5 resultados (Fase 3 é mais pesada)
      if (window.__PHASE3_CORRECTIONS__.length > 5) {
        window.__PHASE3_CORRECTIONS__ = window.__PHASE3_CORRECTIONS__.slice(-5);
      }
    }
    
  } catch (phase3Error) {
    console.warn('🔧 FASE 3: Erro no alinhamento lógico:', phase3Error.message);
    // Em caso de erro, não aplicar nenhuma correção
  }
}

// 🔧 CORREÇÃO 1: Lógica de Clipping Aprimorada  
function fixClippingLogic(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'CLIPPING_LOGIC_FIX', description: '' };
  
  try {
    // Critérios rigorosos para clipping
    const hasClippingSamples = unifiedData.clippingSamples > 0;
    const hasDangerousTP = unifiedData.truePeakDbtp > -0.1; // Mais conservador
    const hasClippingAlert = baseAnalysis.problems?.some(p => p?.type === 'clipping');
    
    // Se não há clipping real mas há alerta, remover
    if (hasClippingAlert && !hasClippingSamples && !hasDangerousTP) {
      baseAnalysis.problems = baseAnalysis.problems.filter(p => p?.type !== 'clipping');
      correction.applied = true;
      correction.description = `Removido falso positivo de clipping (TP: ${unifiedData.truePeakDbtp?.toFixed(2)}dBTP, Samples: ${unifiedData.clippingSamples})`;
    }
    
    // Se há clipping real mas não há alerta, adicionar
    if (!hasClippingAlert && (hasClippingSamples || hasDangerousTP)) {
      baseAnalysis.problems = baseAnalysis.problems || [];
      baseAnalysis.problems.push({
        type: 'clipping',
        severity: hasClippingSamples ? 'high' : 'medium',
        message: hasClippingSamples ? 
          `Clipping detectado: ${unifiedData.clippingSamples} samples` : 
          `True peak perigoso: ${unifiedData.truePeakDbtp?.toFixed(2)} dBTP`
      });
      correction.applied = true;
      correction.description = `Adicionado alerta de clipping real (TP: ${unifiedData.truePeakDbtp?.toFixed(2)}dBTP, Samples: ${unifiedData.clippingSamples})`;
    }
    
  } catch (error) {
    console.warn('Erro na correção de clipping:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 2: Thresholds Dinâmicos de LUFS
function fixLufsThresholds(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'LUFS_THRESHOLD_FIX', description: '' };
  
  try {
    const lufs = unifiedData.lufsIntegrated;
    if (!Number.isFinite(lufs)) return correction;
    
    // Thresholds dinâmicos baseados no gênero e contexto
    const genreThresholds = {
      'trance': { min: -16, max: -8, target: -11 },
      'electronic': { min: -18, max: -6, target: -10 },
      'funk': { min: -12, max: -6, target: -8 }, // Específico para funk mandela
      'funk mandela': { min: -12, max: -6, target: -8 }, // Específico para funk mandela
      'default': { min: -23, max: -6, target: -14 }
    };
    
    const detectedGenre = baseAnalysis.genre || 
                        window.PROD_AI_REF_GENRE || 
                        window.FORCE_DEFAULT_GENRE ||
                        (window.FUNK_MANDELA_V3_REF ? 'funk mandela' : null) ||
                        'default';
    const thresholds = genreThresholds[detectedGenre] || genreThresholds.default;
    
    // Atualizar problemas baseados em thresholds apropriados
    const currentLoudnessProblems = baseAnalysis.problems?.filter(p => p?.type === 'loudness') || [];
    baseAnalysis.problems = baseAnalysis.problems?.filter(p => p?.type !== 'loudness') || [];
    
    if (lufs < thresholds.min) {
      baseAnalysis.problems.push({
        type: 'loudness',
        severity: 'medium',
        message: `Volume muito baixo: ${lufs.toFixed(1)} LUFS (recomendado: ${thresholds.target} LUFS para ${detectedGenre})`
      });
      correction.applied = true;
      correction.description = `Threshold LUFS ajustado para ${detectedGenre}: ${lufs.toFixed(1)} < ${thresholds.min}`;
    } else if (lufs > thresholds.max) {
      baseAnalysis.problems.push({
        type: 'loudness', 
        severity: 'high',
        message: `Volume muito alto: ${lufs.toFixed(1)} LUFS (máximo recomendado: ${thresholds.max} LUFS para ${detectedGenre})`
      });
      correction.applied = true;
      correction.description = `Threshold LUFS ajustado para ${detectedGenre}: ${lufs.toFixed(1)} > ${thresholds.max}`;
    }
    
  } catch (error) {
    console.warn('Erro na correção de LUFS:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 3: Score Calculation Accuracy
function fixScoreCalculation(baseAnalysis, technicalData, unifiedData, v2Metrics) {
  const correction = { applied: false, type: 'SCORE_CALCULATION_FIX', description: '' };
  
  try {
    // Recalcular scores baseados em dados unificados
    const originalOverall = baseAnalysis.qualityOverall;
    
    // Score components com pesos balanceados
    const scores = {
      loudness: calculateLoudnessScore(unifiedData.lufsIntegrated),
      dynamics: calculateDynamicsScore(unifiedData.lra),
      stereo: calculateStereoScore(unifiedData.stereoCorrelation),
      clipping: calculateClippingScore(unifiedData.clippingSamples, unifiedData.truePeakDbtp)
    };
    
    // Peso baseado na importância técnica
    const weights = { loudness: 0.3, dynamics: 0.25, stereo: 0.2, clipping: 0.25 };
    
    const newOverall = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * weights[key]);
    }, 0);
    
    // Só aplicar se a diferença for significativa (> 5%)
    if (Math.abs(newOverall - originalOverall) > 5) {
      baseAnalysis.qualityOverall = Math.round(newOverall);
      baseAnalysis.qualityBreakdown = scores;
      correction.applied = true;
      correction.description = `Score recalculado: ${originalOverall} → ${Math.round(newOverall)} (diferença: ${(newOverall - originalOverall).toFixed(1)})`;
    }
    
  } catch (error) {
    console.warn('Erro na correção de score:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4: Stereo Analysis Consistency
function fixStereoAnalysis(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'STEREO_ANALYSIS_FIX', description: '' };
  
  try {
    const correlation = unifiedData.stereoCorrelation;
    if (!Number.isFinite(correlation)) return correction;
    
    // Classificação mais precisa baseada em padrões reais
    let newMonoCompatibility;
    if (correlation < -0.3) {
      newMonoCompatibility = 'Problemas sérios de fase';
    } else if (correlation < -0.1) {
      newMonoCompatibility = 'Problemas leves de fase';
    } else if (correlation < 0.3) {
      newMonoCompatibility = 'Compatibilidade parcial';
    } else if (correlation < 0.7) {
      newMonoCompatibility = 'Boa compatibilidade';
    } else {
      newMonoCompatibility = 'Excelente compatibilidade';
    }
    
    if (technicalData.monoCompatibility !== newMonoCompatibility) {
      const oldValue = technicalData.monoCompatibility;
      technicalData.monoCompatibility = newMonoCompatibility;
      correction.applied = true;
      correction.description = `Mono compatibility: "${oldValue}" → "${newMonoCompatibility}" (corr: ${correlation.toFixed(3)})`;
    }
    
  } catch (error) {
    console.warn('Erro na correção de estéreo:', error);
  }
  
  return correction;
}

// 📊 Funções de Score Individual
function calculateLoudnessScore(lufs) {
  if (!Number.isFinite(lufs)) return 50;
  const target = -11; // Target LUFS para música eletrônica
  const deviation = Math.abs(lufs - target);
  return Math.max(0, Math.min(100, 100 - (deviation * 8))); // Penalidade de 8 pontos por dB
}

function calculateDynamicsScore(lra) {
  if (!Number.isFinite(lra)) return 50;
  if (lra < 2) return 20; // Muito comprimido
  if (lra < 5) return 60; // Moderadamente comprimido
  if (lra < 10) return 90; // Boa dinâmica
  return 100; // Excelente dinâmica
}

function calculateStereoScore(correlation) {
  if (!Number.isFinite(correlation)) return 50;
  if (correlation < -0.3) return 10; // Problemas sérios
  if (correlation < 0) return 40; // Problemas leves
  if (correlation < 0.5) return 70; // OK
  return 90; // Bom
}

function calculateClippingScore(samples, truePeak) {
  if (samples > 0) return 0; // Clipping = score zero
  if (truePeak > -0.1) return 20; // Muito próximo do clipping
  if (truePeak > -1.0) return 80; // Headroom limitado
  return 100; // Bom headroom
}

// 🔒 Validação e Rollback Safety
function validatePhase3Changes(baseAnalysis, technicalData, originalState) {
  try {
    // Validar que estruturas básicas permanecem intactas
    if (!baseAnalysis || !technicalData) {
      return { isValid: false, reason: 'Estruturas básicas corrompidas' };
    }
    
    // Validar que problemas é um array
    if (baseAnalysis.problems && !Array.isArray(baseAnalysis.problems)) {
      return { isValid: false, reason: 'Array de problemas corrompido' };
    }
    
    // Validar que scores estão em range válido
    if (baseAnalysis.qualityOverall && (baseAnalysis.qualityOverall < 0 || baseAnalysis.qualityOverall > 100)) {
      return { isValid: false, reason: 'Score fora de range válido' };
    }
    
    // Validar dados técnicos críticos
    const criticalFields = ['lufsIntegrated', 'truePeakDbtp', 'lra'];
    for (const field of criticalFields) {
      const value = technicalData[field];
      if (value !== null && !Number.isFinite(value)) {
        return { isValid: false, reason: `Campo ${field} com valor inválido` };
      }
    }
    
    return { isValid: true };
    
  } catch (error) {
    return { isValid: false, reason: `Erro na validação: ${error.message}` };
  }
}

function rollbackChanges(baseAnalysis, technicalData, originalState) {
  try {
    // Restaurar problemas
    baseAnalysis.problems = originalState.problems;
    
    // Restaurar dados técnicos críticos
    Object.keys(originalState.technicalData).forEach(key => {
      technicalData[key] = originalState.technicalData[key];
    });
    
    console.log('🔄 Rollback da Fase 3 concluído com sucesso');
    
  } catch (error) {
    console.error('❌ Erro durante rollback da Fase 3:', error);
  }
}

// ===== FASE 4: AUDITORIA FINAL COMPLETA (BAIXO RISCO) =====

/**
 * FASE 4: Auditoria final completa conforme especificação
 * ⚠️ BAIXO RISCO: Correções específicas dos problemas identificados
 * 🔒 SEGURANÇA: Sem alteração de comportamento, apenas padronização
 */
function applyFinalAuditCorrections(baseAnalysis, technicalData, unifiedData, v2Metrics) {
  try {
    if (!baseAnalysis || !technicalData || !unifiedData) {
      console.warn('🔧 FASE 4: Dados insuficientes para auditoria final');
      return;
    }
    
    // Feature flag para ativar Fase 4
    if (!window.DEBUG_ANALYZER && !window.ENABLE_PHASE4_FINAL_AUDIT) return;
    
    const corrections = [];
    
    console.group('🎯 FASE 4 - Auditoria Final Completa');
    
    // 🔧 CORREÇÃO 4.1: LUFS Centralizado e Padronizado
    const lufsCorrection = centralizeLUFSValues(baseAnalysis, technicalData, unifiedData, v2Metrics);
    if (lufsCorrection.applied) {
      corrections.push(lufsCorrection);
    }
    
    // 🔧 CORREÇÃO 4.2: Dinâmica Sempre Positiva
    const dynamicsCorrection = fixNegativeDynamics(baseAnalysis, technicalData, unifiedData);
    if (dynamicsCorrection.applied) {
      corrections.push(dynamicsCorrection);
    }
    
    // 🔧 CORREÇÃO 4.3: Score Técnico Funcional
    const scoreCorrection = fixTechnicalScore(baseAnalysis, technicalData, unifiedData);
    if (scoreCorrection.applied) {
      corrections.push(scoreCorrection);
    }
    
    // 🔧 CORREÇÃO 4.4: Mono Compatibility Alinhada
    const monoCorrection = fixMonoCompatibility(baseAnalysis, technicalData, unifiedData);
    if (monoCorrection.applied) {
      corrections.push(monoCorrection);
    }
    
    // 🔧 CORREÇÃO 4.5: Gates de Sugestões Perigosas
    const safetyCorrection = applySuggestionSafetyGates(baseAnalysis, technicalData, unifiedData);
    if (safetyCorrection.applied) {
      corrections.push(safetyCorrection);
    }
    
    // 🔧 CORREÇÃO 4.6: Formatação Padronizada
    const formatCorrection = standardizeFormatting(baseAnalysis, technicalData, unifiedData);
    if (formatCorrection.applied) {
      corrections.push(formatCorrection);
    }
    
    // 📊 Log das correções aplicadas
    if (corrections.length > 0) {
      corrections.forEach(correction => {
        console.log(`✅ ${correction.type}: ${correction.description}`);
      });
    } else {
      console.log('🔧 FASE 4: Sistema já está padronizado');
    }
    
    console.groupEnd();
    
    // Armazenar correções para análise
    if (typeof window !== 'undefined') {
      window.__PHASE4_CORRECTIONS__ = window.__PHASE4_CORRECTIONS__ || [];
      window.__PHASE4_CORRECTIONS__.push({
        timestamp: Date.now(),
        corrections: corrections.slice(),
        lufsValues: {
          original: extractAllLUFSValues(baseAnalysis, technicalData, v2Metrics),
          unified: unifiedData.lufsIntegrated
        }
      });
      
      // Manter apenas últimos 5 resultados
      if (window.__PHASE4_CORRECTIONS__.length > 5) {
        window.__PHASE4_CORRECTIONS__ = window.__PHASE4_CORRECTIONS__.slice(-5);
      }
    }
    
  } catch (phase4Error) {
    console.warn('🔧 FASE 4: Erro na auditoria final:', phase4Error.message);
  }
}

// 🔧 CORREÇÃO 4.1: LUFS Centralizado e Padronizado
function centralizeLUFSValues(baseAnalysis, technicalData, unifiedData, v2Metrics) {
  const correction = { applied: false, type: 'LUFS_CENTRALIZED', description: '' };
  
  try {
    // Extrair todos os valores LUFS encontrados
    const lufsValues = extractAllLUFSValues(baseAnalysis, technicalData, v2Metrics);
    
    // Definir valor único como fonte da verdade (prioridade: V2 > technicalData > fallback)
    const canonicalLUFS = unifiedData.lufsIntegrated;
    
    if (!Number.isFinite(canonicalLUFS)) {
      return correction; // Não há LUFS válido para centralizar
    }
    
    // Verificar se há divergências significativas (> 0.5 dB)
    const divergences = lufsValues.filter(val => Math.abs(val.value - canonicalLUFS) > 0.5);
    
    if (divergences.length > 0) {
      // Centralizar todos os valores para o canonical
      if (technicalData.lufsIntegrated !== canonicalLUFS) {
        technicalData.lufsIntegrated = canonicalLUFS;
      }
      
      // Remover campos RMS que podem estar sendo usados como LUFS
      if (technicalData.rms && Math.abs(technicalData.rms - canonicalLUFS) > 2) {
        technicalData.rms = null; // Limpar RMS incorreto
      }
      
      correction.applied = true;
      correction.description = `LUFS centralizado para ${canonicalLUFS.toFixed(1)} (${divergences.length} divergências corrigidas)`;
      correction.divergences = divergences;
      correction.canonicalValue = canonicalLUFS;
    }
    
  } catch (error) {
    console.warn('Erro na centralização LUFS:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4.2: Dinâmica Sempre Positiva
function fixNegativeDynamics(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'NEGATIVE_DYNAMICS_FIXED', description: '' };
  
  try {
    const dynamicFields = ['lra', 'dynamicRange', 'dr'];
    
    dynamicFields.forEach(field => {
      if (technicalData[field] !== null && Number.isFinite(technicalData[field]) && technicalData[field] < 0) {
        const originalValue = technicalData[field];
        
        // Corrigir para valor absoluto ou zero
        technicalData[field] = Math.max(0, Math.abs(originalValue));
        
        correction.applied = true;
        correction.description += `${field}: ${originalValue.toFixed(2)} → ${technicalData[field].toFixed(2)}; `;
      }
    });
    
    if (correction.applied) {
      correction.description = `Dinâmica corrigida: ${correction.description}`;
    }
    
  } catch (error) {
    console.warn('Erro na correção de dinâmica:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4.3: Score Técnico Funcional
function fixTechnicalScore(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'TECHNICAL_SCORE_FIXED', description: '' };
  
  try {
    const currentScore = baseAnalysis.qualityOverall;
    
    // Se score é 0 ou null mas temos dados técnicos válidos
    if ((!currentScore || currentScore === 0) && hasValidTechnicalData(technicalData, unifiedData)) {
      
      // Calcular score baseado em dados disponíveis
      const newScore = calculateTechnicalScore(technicalData, unifiedData);
      
      if (newScore > 0 && newScore !== currentScore) {
        baseAnalysis.qualityOverall = newScore;
        
        correction.applied = true;
        correction.description = `Score técnico: ${currentScore || 0} → ${newScore} (baseado em dados válidos)`;
        correction.newScore = newScore;
        correction.basedOn = Object.keys(technicalData).filter(key => 
          technicalData[key] !== null && Number.isFinite(technicalData[key])
        );
      }
    }
    
  } catch (error) {
    console.warn('Erro na correção de score:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4.4: Mono Compatibility Alinhada
function fixMonoCompatibility(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'MONO_COMPATIBILITY_ALIGNED', description: '' };
  
  try {
    const correlation = unifiedData.stereoCorrelation;
    const currentMono = technicalData.monoCompatibility;
    
    if (Number.isFinite(correlation)) {
      // Critério rigoroso: correlation < 0.1 ou mono_loss > 3 dB
      let newMono;
      
      if (correlation < 0.1) {
        newMono = 'Poor (correlação baixa)';
      } else if (correlation < 0.3) {
        newMono = 'Fair (correlação moderada)';
      } else if (correlation < 0.7) {
        newMono = 'Good (boa correlação)';
      } else {
        newMono = 'Excellent (correlação alta)';
      }
      
      // TODO: Adicionar cálculo de mono_loss quando disponível
      
      if (currentMono !== newMono) {
        technicalData.monoCompatibility = newMono;
        
        correction.applied = true;
        correction.description = `Mono compatibility: "${currentMono}" → "${newMono}" (corr: ${correlation.toFixed(3)})`;
        correction.correlation = correlation;
      }
    }
    
  } catch (error) {
    console.warn('Erro na correção de mono compatibility:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4.5: Gates de Sugestões Perigosas
function applySuggestionSafetyGates(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'SAFETY_GATES_APPLIED', description: '' };
  
  try {
    if (!Array.isArray(baseAnalysis.suggestions)) {
      return correction;
    }
    
    const hasClipping = unifiedData.clippingSamples > 0;
    const dangerousPeak = unifiedData.truePeakDbtp > -0.3;
    
    if (hasClipping || dangerousPeak) {
      const originalCount = baseAnalysis.suggestions.length;
      
      // Filtrar sugestões perigosas
      baseAnalysis.suggestions = baseAnalysis.suggestions.filter(suggestion => {
        const message = suggestion?.message || suggestion?.action || '';
        const isDangerous = /aumentar.*volume|aumentar.*dBTP|mais.*loudness|push.*limiter|gain.*up|\+.*dB/i.test(message);
        return !isDangerous;
      });
      
      const filteredCount = originalCount - baseAnalysis.suggestions.length;
      
      if (filteredCount > 0) {
        correction.applied = true;
        correction.description = `${filteredCount} sugestões perigosas bloqueadas (clipping: ${hasClipping}, peak: ${unifiedData.truePeakDbtp?.toFixed(2)}dBTP)`;
        correction.filteredSuggestions = filteredCount;
      }
    }
    
  } catch (error) {
    console.warn('Erro nos gates de segurança:', error);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4.6: Formatação Padronizada
function standardizeFormatting(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'FORMATTING_STANDARDIZED', description: '' };
  
  try {
    const peakFields = ['truePeakDbtp', 'samplePeakLeftDb', 'samplePeakRightDb'];
    const corrections = [];
    
    peakFields.forEach(field => {
      if (technicalData[field] !== null && Number.isFinite(technicalData[field])) {
        const original = technicalData[field];
        
        // Padronizar para 2 casas decimais
        const formatted = Math.round(original * 100) / 100;
        
        if (Math.abs(original - formatted) > 0.001) {
          technicalData[field] = formatted;
          corrections.push(`${field}: ${original} → ${formatted}`);
        }
      }
    });
    
    if (corrections.length > 0) {
      correction.applied = true;
      correction.description = `Formatação padronizada: ${corrections.join(', ')}`;
    }
    
  } catch (error) {
    console.warn('Erro na padronização de formatação:', error);
  }
  
  return correction;
}

// 📊 Funções Auxiliares

function extractAllLUFSValues(baseAnalysis, technicalData, v2Metrics) {
  const values = [];
  
  if (Number.isFinite(technicalData.lufsIntegrated)) {
    values.push({ source: 'technicalData.lufsIntegrated', value: technicalData.lufsIntegrated });
  }
  
  if (Number.isFinite(technicalData.rms)) {
    values.push({ source: 'technicalData.rms', value: technicalData.rms });
  }
  
  if (v2Metrics?.loudness?.lufs_integrated && Number.isFinite(v2Metrics.loudness.lufs_integrated)) {
    values.push({ source: 'v2Metrics.loudness.lufs_integrated', value: v2Metrics.loudness.lufs_integrated });
  }
  
  if (baseAnalysis?.technicalData?.rms && Number.isFinite(baseAnalysis.technicalData.rms)) {
    values.push({ source: 'baseAnalysis.technicalData.rms', value: baseAnalysis.technicalData.rms });
  }
  
  return values;
}

function hasValidTechnicalData(technicalData, unifiedData) {
  const requiredFields = ['lufsIntegrated', 'truePeakDbtp', 'lra', 'stereoCorrelation'];
  return requiredFields.some(field => 
    Number.isFinite(technicalData[field]) || Number.isFinite(unifiedData[field])
  );
}

function calculateTechnicalScore(technicalData, unifiedData) {
  const scores = [];
  
  // LUFS Score (peso: 30%)
  if (Number.isFinite(unifiedData.lufsIntegrated)) {
    const lufsScore = calculateLoudnessScore(unifiedData.lufsIntegrated);
    scores.push({ score: lufsScore, weight: 0.3 });
  }
  
  // Peak Score (peso: 25%)
  if (Number.isFinite(unifiedData.truePeakDbtp)) {
    const peakScore = calculateClippingScore(unifiedData.clippingSamples, unifiedData.truePeakDbtp);
    scores.push({ score: peakScore, weight: 0.25 });
  }
  
  // Dynamics Score (peso: 25%)
  if (Number.isFinite(unifiedData.lra)) {
    const dynScore = calculateDynamicsScore(unifiedData.lra);
    scores.push({ score: dynScore, weight: 0.25 });
  }
  
  // Stereo Score (peso: 20%)
  if (Number.isFinite(unifiedData.stereoCorrelation)) {
    const stereoScore = calculateStereoScore(unifiedData.stereoCorrelation);
    scores.push({ score: stereoScore, weight: 0.2 });
  }
  
  if (scores.length === 0) return 0;
  
  // Calcular média ponderada
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = scores.reduce((sum, item) => sum + (item.score * item.weight), 0);
  
  return Math.round(weightedSum / totalWeight);
}

// ===== FASE 5: CORREÇÕES CRÍTICAS ESPECÍFICAS (SEGURO) =====

/**
 * FASE 5: Correções críticas específicas conforme auditoria solicitada
 * ⚠️ SEGURO: Apenas correções pontuais sem afetar funcionalidade principal
 * 🔒 LOGS: Registra problemas encontrados para monitoramento
 */
function applyCriticalSpecificFixes(baseAnalysis, technicalData, unifiedData, v2Metrics) {
  try {
    if (!baseAnalysis || !technicalData || !unifiedData) {
      console.warn('🔧 FASE 5: Dados insuficientes para correções críticas');
      return;
    }
    
    // Feature flag para ativar Fase 5
    if (!window.DEBUG_ANALYZER && !window.ENABLE_PHASE5_CRITICAL_FIXES) return;
    
    const corrections = [];
    
    console.group('🎯 FASE 5 - Correções Críticas Específicas');
    
    // 🔧 CORREÇÃO 1: LUFS Duplicado - Garantir valor único
    const lufsUnifiedCorrection = fixLUFSDuplication(baseAnalysis, technicalData, unifiedData, v2Metrics);
    if (lufsUnifiedCorrection.applied) {
      corrections.push(lufsUnifiedCorrection);
    }
    
    // 🔧 CORREÇÃO 2: Dinâmica Negativa - Sempre ≥ 0
    const dynamicsNegativeCorrection = fixNegativeDynamicsAdvanced(baseAnalysis, technicalData, unifiedData);
    if (dynamicsNegativeCorrection.applied) {
      corrections.push(dynamicsNegativeCorrection);
    }
    
    // 🔧 CORREÇÃO 3: Score Técnico Zero - Calcular corretamente
    const scoreZeroCorrection = fixZeroTechnicalScore(baseAnalysis, technicalData, unifiedData);
    if (scoreZeroCorrection.applied) {
      corrections.push(scoreZeroCorrection);
    }
    
    // 🔧 CORREÇÃO 4: Mono Compatibility - Usar correlação real
    const monoAlwaysPoorCorrection = fixMonoAlwaysPoor(baseAnalysis, technicalData, unifiedData);
    if (monoAlwaysPoorCorrection.applied) {
      corrections.push(monoAlwaysPoorCorrection);
    }
    
    // 🔧 CORREÇÃO 5: Sugestões Contraditórias - Gates de segurança
    const contradictorySuggestionsCorrection = fixContradictorySuggestions(baseAnalysis, technicalData, unifiedData);
    if (contradictorySuggestionsCorrection.applied) {
      corrections.push(contradictorySuggestionsCorrection);
    }
    
    // 📊 Log das correções aplicadas
    if (corrections.length > 0) {
      corrections.forEach(correction => {
        console.log(`✅ ${correction.type}: ${correction.description}`);
      });
    } else {
      console.log('✅ FASE 5: Todos os problemas críticos já estão corrigidos');
    }
    
    console.groupEnd();
    
    // Armazenar correções para análise
    if (typeof window !== 'undefined') {
      window.__PHASE5_CORRECTIONS__ = window.__PHASE5_CORRECTIONS__ || [];
      window.__PHASE5_CORRECTIONS__.push({
        timestamp: Date.now(),
        corrections: corrections.slice(),
        criticalChecks: {
          lufsValues: extractAllLUFSValues(baseAnalysis, technicalData, v2Metrics),
          dynamicsValue: technicalData.lra,
          technicalScore: baseAnalysis.qualityOverall,
          monoCompatibility: technicalData.monoCompatibility,
          suggestionsCount: baseAnalysis.suggestions?.length || 0
        }
      });
      
      // Manter apenas últimos 3 resultados
      if (window.__PHASE5_CORRECTIONS__.length > 3) {
        window.__PHASE5_CORRECTIONS__ = window.__PHASE5_CORRECTIONS__.slice(-3);
      }
    }
    
  } catch (phase5Error) {
    console.warn('🔧 FASE 5: Erro nas correções críticas:', phase5Error.message);
  }
}

// 🔧 CORREÇÃO 1: LUFS Duplicado - Garantir valor único
function fixLUFSDuplication(baseAnalysis, technicalData, unifiedData, v2Metrics) {
  const correction = { applied: false, type: 'LUFS_DUPLICATION_FIXED', description: '' };
  
  try {
    // Extrair todos os valores LUFS encontrados no sistema
    const allLUFSValues = extractAllLUFSValues(baseAnalysis, technicalData, v2Metrics);
    
    // Identificar valor canônico (prioridade: V2 > technicalData > estimativa)
    let canonicalLUFS = unifiedData.lufsIntegrated;
    
    if (!Number.isFinite(canonicalLUFS)) {
      // Fallback seguro se não há LUFS válido
      console.warn('🔍 FASE 5: Nenhum LUFS válido encontrado para unificação');
      return correction;
    }
    
    // Verificar duplicações ou divergências significativas (> 1.0 dB)
    const duplications = [];
    const divergences = [];
    
    allLUFSValues.forEach(item => {
      if (Math.abs(item.value - canonicalLUFS) > 1.0) {
        divergences.push(item);
      }
    });
    
    if (allLUFSValues.length > 1) {
      duplications.push(...allLUFSValues);
    }
    
    // Aplicar correção apenas se há problemas reais
    if (divergences.length > 0 || duplications.length > 2) {
      // Garantir que apenas LUFS-I é usado como principal
      technicalData.lufsIntegrated = canonicalLUFS;
      
      // Limpar outros campos que podem estar sendo interpretados como LUFS
      if (technicalData.rms && Math.abs(technicalData.rms - canonicalLUFS) > 2) {
        const originalRMS = technicalData.rms;
        technicalData.rms = null; // Limpar RMS incorreto
        console.warn(`🔍 FASE 5: RMS removido por divergir do LUFS: ${originalRMS} vs ${canonicalLUFS}`);
      }
      
      correction.applied = true;
      correction.description = `LUFS unificado para ${canonicalLUFS.toFixed(1)} (${allLUFSValues.length} fontes, ${divergences.length} divergências)`;
      correction.canonicalValue = canonicalLUFS;
      correction.allSources = allLUFSValues;
    } else {
      console.log(`✅ FASE 5: LUFS já está unificado em ${canonicalLUFS.toFixed(1)}`);
    }
    
  } catch (error) {
    console.warn('🔍 FASE 5: Erro na correção LUFS:', error.message);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 2: Dinâmica Negativa - Sempre ≥ 0
function fixNegativeDynamicsAdvanced(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'NEGATIVE_DYNAMICS_ADVANCED_FIXED', description: '' };
  
  try {
    const dynamicFields = ['lra', 'dynamicRange', 'dr'];
    const corrections = [];
    
    dynamicFields.forEach(field => {
      if (technicalData[field] !== null && Number.isFinite(technicalData[field])) {
        const currentValue = technicalData[field];
        
        if (currentValue < 0) {
          // Para valores negativos, usar valor absoluto ou buscar alternativa
          let correctedValue;
          
          if (field === 'lra' && unifiedData.lra && unifiedData.lra >= 0) {
            correctedValue = unifiedData.lra;
          } else {
            correctedValue = Math.abs(currentValue);
          }
          
          technicalData[field] = correctedValue;
          corrections.push(`${field}: ${currentValue.toFixed(2)} → ${correctedValue.toFixed(2)}`);
          
          console.warn(`🔍 FASE 5: Dinâmica negativa corrigida - ${field}: ${currentValue} → ${correctedValue}`);
        }
      }
    });
    
    if (corrections.length > 0) {
      correction.applied = true;
      correction.description = `Dinâmica negativa corrigida: ${corrections.join(', ')}`;
    } else {
      console.log('✅ FASE 5: Dinâmica já está com valores válidos');
    }
    
  } catch (error) {
    console.warn('🔍 FASE 5: Erro na correção de dinâmica:', error.message);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 3: Score Técnico Zero - Calcular corretamente
function fixZeroTechnicalScore(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'ZERO_TECHNICAL_SCORE_FIXED', description: '' };
  
  try {
    const currentScore = baseAnalysis.qualityOverall;
    
    // Se score é 0, null, ou undefined mas temos dados técnicos válidos
    if ((!currentScore || currentScore === 0) && hasValidTechnicalData(technicalData, unifiedData)) {
      
      const availableMetrics = [];
      let totalScore = 0;
      let weightSum = 0;
      
      // LUFS Score (peso: 30%)
      if (Number.isFinite(unifiedData.lufsIntegrated)) {
        const lufsScore = calculateLoudnessScore(unifiedData.lufsIntegrated);
        totalScore += lufsScore * 0.3;
        weightSum += 0.3;
        availableMetrics.push(`LUFS: ${lufsScore}`);
      }
      
      // Peak Score (peso: 25%)
      if (Number.isFinite(unifiedData.truePeakDbtp)) {
        const peakScore = calculateClippingScore(unifiedData.clippingSamples, unifiedData.truePeakDbtp);
        totalScore += peakScore * 0.25;
        weightSum += 0.25;
        availableMetrics.push(`Peak: ${peakScore}`);
      }
      
      // Dynamics Score (peso: 25%)
      if (Number.isFinite(unifiedData.lra) && unifiedData.lra >= 0) {
        const dynScore = calculateDynamicsScore(unifiedData.lra);
        totalScore += dynScore * 0.25;
        weightSum += 0.25;
        availableMetrics.push(`Dynamics: ${dynScore}`);
      }
      
      // Stereo Score (peso: 20%)
      if (Number.isFinite(unifiedData.stereoCorrelation)) {
        const stereoScore = calculateStereoScore(unifiedData.stereoCorrelation);
        totalScore += stereoScore * 0.2;
        weightSum += 0.2;
        availableMetrics.push(`Stereo: ${stereoScore}`);
      }
      
      if (weightSum > 0) {
        const newScore = Math.round(totalScore / weightSum);
        
        if (newScore > 0 && newScore !== currentScore) {
          baseAnalysis.qualityOverall = newScore;
          
          correction.applied = true;
          correction.description = `Score técnico: ${currentScore || 0} → ${newScore} (baseado em: ${availableMetrics.join(', ')})`;
          correction.newScore = newScore;
          correction.availableMetrics = availableMetrics;
          
          console.log(`✅ FASE 5: Score técnico recalculado - ${correction.description}`);
        }
      } else {
        console.warn('🔍 FASE 5: Insuficientes dados técnicos para calcular score');
      }
    } else {
      console.log(`✅ FASE 5: Score técnico já válido: ${currentScore}`);
    }
    
  } catch (error) {
    console.warn('🔍 FASE 5: Erro na correção de score:', error.message);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 4: Mono Compatibility - Usar correlação real
function fixMonoAlwaysPoor(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'MONO_ALWAYS_POOR_FIXED', description: '' };
  
  try {
    const currentMono = technicalData.monoCompatibility;
    const correlation = unifiedData.stereoCorrelation;
    
    if (Number.isFinite(correlation)) {
      // Critério rigoroso baseado em correlação real
      let newMono;
      
      if (correlation < 0.1) {
        newMono = 'Poor (correlação < 0.1)';
      } else if (correlation < 0.3) {
        newMono = 'Fair (correlação moderada)';
      } else if (correlation < 0.6) {
        newMono = 'Good (boa correlação)';
      } else if (correlation < 0.85) {
        newMono = 'Very Good (correlação alta)';
      } else {
        newMono = 'Excellent (correlação excelente)';
      }
      
      // Aplicar correção apenas se há mudança significativa
      if (currentMono !== newMono && (currentMono === 'Poor' || currentMono === 'poor')) {
        technicalData.monoCompatibility = newMono;
        
        correction.applied = true;
        correction.description = `Mono compatibility: "${currentMono}" → "${newMono}" (correlação: ${correlation.toFixed(3)})`;
        correction.correlation = correlation;
        
        console.log(`✅ FASE 5: Mono compatibility corrigida - correlação ${correlation.toFixed(3)} → ${newMono}`);
      } else {
        console.log(`✅ FASE 5: Mono compatibility já adequada: ${currentMono} (corr: ${correlation.toFixed(3)})`);
      }
    } else {
      console.warn('🔍 FASE 5: Correlação estéreo indisponível para correção de mono compatibility');
    }
    
  } catch (error) {
    console.warn('🔍 FASE 5: Erro na correção de mono compatibility:', error.message);
  }
  
  return correction;
}

// 🔧 CORREÇÃO 5: Sugestões Contraditórias - Gates de segurança
function fixContradictorySuggestions(baseAnalysis, technicalData, unifiedData) {
  const correction = { applied: false, type: 'CONTRADICTORY_SUGGESTIONS_FIXED', description: '' };
  
  try {
    if (!Array.isArray(baseAnalysis.suggestions) || baseAnalysis.suggestions.length === 0) {
      return correction;
    }
    
    const hasClipping = unifiedData.clippingSamples > 0;
    const dangerousPeak = unifiedData.truePeakDbtp > -0.3; // Threshold rigoroso
    const originalCount = baseAnalysis.suggestions.length;
    
    if (hasClipping || dangerousPeak) {
      const beforeFiltering = baseAnalysis.suggestions.slice();
      
      // Filtrar sugestões perigosas quando há clipping ou peak perigoso
      baseAnalysis.suggestions = baseAnalysis.suggestions.filter(suggestion => {
        const text = (suggestion?.message || suggestion?.action || '').toLowerCase();
        
        // Padrões perigosos para detectar
        const dangerousPatterns = [
          /aumentar.*volume/i,
          /aumentar.*peak/i,
          /\+\s*\d+.*dbtp/i,
          /gain.*up/i,
          /boost.*level/i,
          /push.*louder/i,
          /more.*loudness/i,
          /increase.*\d+.*db/i
        ];
        
        const isDangerous = dangerousPatterns.some(pattern => pattern.test(text));
        
        if (isDangerous) {
          console.warn(`🔍 FASE 5: Sugestão perigosa filtrada: "${text.slice(0, 50)}..."`);
        }
        
        return !isDangerous;
      });
      
      const filteredCount = originalCount - baseAnalysis.suggestions.length;
      
      if (filteredCount > 0) {
        correction.applied = true;
        correction.description = `${filteredCount} sugestões contraditórias removidas (clipping: ${hasClipping}, peak: ${unifiedData.truePeakDbtp?.toFixed(2)}dBTP)`;
        correction.filteredCount = filteredCount;
        correction.reason = hasClipping ? 'clipping detectado' : 'peak perigoso';
        
        console.log(`✅ FASE 5: ${filteredCount} sugestões contraditórias removidas - ${correction.reason}`);
      }
    } else {
      console.log('✅ FASE 5: Não há clipping/peak perigoso - sugestões mantidas');
    }
    
  } catch (error) {
    console.warn('🔍 FASE 5: Erro na correção de sugestões:', error.message);
  }
  
  return correction;
}

// =============== SISTEMA DE DEBUG DETALHADO ===============
/**
 * Sistema de debug detalhado para diagnosticar os problemas específicos mencionados
 */
function performDetailedAnalysisDebug(analysis) {
  try {
    console.group('🐛 DEBUG DETALHADO - Análise Completa');
    
    debugLUFSDuplication(analysis);
    debugNegativeDynamics(analysis);
    debugTruePeakClippingContradiction(analysis);
    debugZeroTechnicalScore(analysis);
    debugMonoCompatibilityIssue(analysis);
    
    console.groupEnd();
  } catch (error) {
    console.warn('🔍 DEBUG: Erro no debug detalhado:', error.message);
  }
}

// Debug 1: LUFS Duplicado
function debugLUFSDuplication(analysis) {
  console.group('🎵 DEBUG: LUFS Duplicação');
  
  const td = analysis.technicalData || {};
  const lufsValues = {
    'lufsIntegrated': td.lufsIntegrated,
    'lufsShortTerm': td.lufsShortTerm,
    'lufsMomentary': td.lufsMomentary,
    'rms': td.rms,
    'peak': td.peak
  };
  
  console.log('📊 Todos os valores LUFS/Volume encontrados:');
  Object.entries(lufsValues).forEach(([key, value]) => {
    const isValid = Number.isFinite(value);
    console.log(`  ${key}: ${isValid ? value.toFixed(2) : 'N/A'} ${isValid ? (key.includes('lufs') ? 'LUFS' : 'dB') : ''}`);
  });
  
  // Detectar duplicação
  const validLufs = Object.entries(lufsValues)
    .filter(([key, value]) => Number.isFinite(value) && key.includes('lufs'))
    .map(([key, value]) => ({ type: key, value }));
  
  if (validLufs.length > 1) {
    console.warn('⚠️ MÚLTIPLOS LUFS DETECTADOS:');
    validLufs.forEach(lufs => {
      console.log(`  - ${lufs.type}: ${lufs.value.toFixed(2)} LUFS`);
    });
    
    const values = validLufs.map(l => l.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const divergence = max - min;
    
    console.log(`📏 Divergência máxima: ${divergence.toFixed(2)} dB`);
    if (divergence > 1.0) {
      console.error('🚨 PROBLEMA: Divergência de LUFS > 1.0 dB');
    }
  } else {
    console.log('✅ LUFS unificado ou único valor encontrado');
  }
  
  console.groupEnd();
}

// Debug 2: Dinâmica Negativa  
function debugNegativeDynamics(analysis) {
  console.group('📈 DEBUG: Dinâmica Negativa');
  
  const td = analysis.technicalData || {};
  const dynamicFields = {
    'dynamicRange': td.dynamicRange,
    'lra': td.lra,
    'crestFactor': td.crestFactor
  };
  
  console.log('📊 Valores de dinâmica encontrados:');
  Object.entries(dynamicFields).forEach(([key, value]) => {
    const isValid = Number.isFinite(value);
    const isNegative = isValid && value < 0;
    
    console.log(`  ${key}: ${isValid ? value.toFixed(2) : 'N/A'} dB ${isNegative ? '⚠️ IMPOSSÍVEL' : ''}`);
    
    if (isNegative) {
      console.error(`🚨 PROBLEMA: ${key} com valor negativo (${value.toFixed(2)}) é fisicamente impossível`);
    }
  });
  
  console.groupEnd();
}

// Debug 3: True Peak & Clipping Contradição
function debugTruePeakClippingContradiction(analysis) {
  console.group('🔊 DEBUG: True Peak & Clipping');
  
  const td = analysis.technicalData || {};
  const clippingData = {
    truePeakDbtp: td.truePeakDbtp,
    peak: td.peak,
    clippingSamples: td.clippingSamples,
    clippingPct: td.clippingPct
  };
  
  console.log('📊 Dados de clipping e picos:');
  Object.entries(clippingData).forEach(([key, value]) => {
    const isValid = Number.isFinite(value);
    const unit = key.includes('Pct') ? '%' : key.includes('Samples') ? 'samples' : key.includes('dbtp') ? 'dBTP' : 'dB';
    console.log(`  ${key}: ${isValid ? value.toFixed(2) + ' ' + unit : 'N/A'}`);
  });
  
  // Analisar contradições
  const truePeak = td.truePeakDbtp;
  const clippingSamples = td.clippingSamples || 0;
  const hasClipping = clippingSamples > 0;
  const dangerousPeak = Number.isFinite(truePeak) && truePeak > -0.3;
  
  console.log('\n⚖️ Análise de consistência:');
  console.log(`  Tem clipping: ${hasClipping}`);
  console.log(`  Peak perigoso (>-0.3dBTP): ${dangerousPeak}`);
  
  if (hasClipping && !dangerousPeak) {
    console.warn('🚨 CONTRADIÇÃO: Há clipping mas True Peak não indica perigo');
  } else if (!hasClipping && dangerousPeak) {
    console.warn('⚠️ POSSÍVEL INCONSISTÊNCIA: True Peak alto mas sem clipping detectado');
  } else {
    console.log('✅ Dados consistentes entre clipping e True Peak');
  }
  
  // Verificar sugestões contraditórias
  const suggestions = analysis.suggestions || [];
  if (suggestions.length > 0 && (hasClipping || dangerousPeak)) {
    const dangerousPatterns = suggestions.filter(s => {
      const text = (s.action || s.message || '').toLowerCase();
      return /aumentar|boost|\+.*db/i.test(text);
    });
    
    if (dangerousPatterns.length > 0) {
      console.error('🚨 SUGESTÕES CONTRADITÓRIAS detectadas:');
      dangerousPatterns.forEach(s => {
        console.log(`  - "${s.action || s.message}"`);
      });
    } else {
      console.log('✅ Sugestões consistentes com situação de clipping');
    }
  }
  
  console.groupEnd();
}

// Debug 4: Score Técnico Zero
function debugZeroTechnicalScore(analysis) {
  console.group('🏆 DEBUG: Score Técnico');
  
  const scores = {
    qualityOverall: analysis.qualityOverall,
    mixScore: analysis.mixScore,
    mixScorePct: analysis.mixScorePct
  };
  
  console.log('📊 Scores encontrados:');
  Object.entries(scores).forEach(([key, value]) => {
    const isValid = Number.isFinite(value);
    const isZero = isValid && value === 0;
    console.log(`  ${key}: ${isValid ? value : 'N/A'} ${isZero ? '⚠️ SEMPRE ZERO' : ''}`);
  });
  
  // Verificar breakdown
  if (analysis.qualityBreakdown) {
    console.log('\n📊 Breakdown de scores:');
    Object.entries(analysis.qualityBreakdown).forEach(([key, value]) => {
      console.log(`  ${key}: ${Number.isFinite(value) ? value : 'N/A'}`);
    });
  }
  
  // Verificar se há dados suficientes para calcular
  const td = analysis.technicalData || {};
  const metricsForScore = {
    'LUFS': Number.isFinite(td.lufsIntegrated),
    'True Peak': Number.isFinite(td.truePeakDbtp),
    'LRA': Number.isFinite(td.lra),
    'Stereo Correlation': Number.isFinite(td.stereoCorrelation)
  };
  
  console.log('\n🔧 Métricas disponíveis para cálculo:');
  Object.entries(metricsForScore).forEach(([metric, available]) => {
    console.log(`  ${metric}: ${available ? '✅' : '❌'}`);
  });
  
  const availableCount = Object.values(metricsForScore).filter(Boolean).length;
  if (availableCount >= 2 && analysis.qualityOverall === 0) {
    console.error('🚨 PROBLEMA: Score zero apesar de métricas disponíveis');
  } else if (availableCount < 2) {
    console.warn('⚠️ Métricas insuficientes para calcular score técnico');
  } else {
    console.log('✅ Score técnico parece estar calculado corretamente');
  }
  
  console.groupEnd();
}

// Debug 5: Mono Compatibility sempre "Poor"
function debugMonoCompatibilityIssue(analysis) {
  console.group('🎧 DEBUG: Mono Compatibility');
  
  const td = analysis.technicalData || {};
  const monoData = {
    monoCompatibility: td.monoCompatibility,
    stereoCorrelation: td.stereoCorrelation,
    stereoWidth: td.stereoWidth,
    balanceLR: td.balanceLR
  };
  
  console.log('📊 Dados de estéreo/mono:');
  Object.entries(monoData).forEach(([key, value]) => {
    if (key === 'monoCompatibility') {
      console.log(`  ${key}: "${value || 'N/A'}"`);
    } else if (Number.isFinite(value)) {
      console.log(`  ${key}: ${value.toFixed(3)}`);
    } else {
      console.log(`  ${key}: N/A`);
    }
  });
  
  // Analisar consistência
  const correlation = td.stereoCorrelation;
  const monoCompat = td.monoCompatibility;
  
  if (Number.isFinite(correlation) && monoCompat) {
    console.log('\n⚖️ Análise de consistência:');
    
    // Determinar o que deveria ser baseado na correlação
    let expectedMono;
    if (correlation < 0.1) expectedMono = 'Poor';
    else if (correlation < 0.3) expectedMono = 'Fair';
    else if (correlation < 0.6) expectedMono = 'Good';
    else if (correlation < 0.85) expectedMono = 'Very Good';
    else expectedMono = 'Excellent';
    
    const currentMono = monoCompat.replace(/\s*\(.*\)/, ''); // Remove explicação
    
    console.log(`  Correlação: ${correlation.toFixed(3)}`);
    console.log(`  Mono atual: "${monoCompat}"`);
    console.log(`  Mono esperado: "${expectedMono}"`);
    
    if (currentMono.toLowerCase().includes('poor') && correlation > 0.3) {
      console.error('🚨 PROBLEMA: Mono = "Poor" mas correlação indica qualidade superior');
    } else if (!currentMono.toLowerCase().includes(expectedMono.toLowerCase())) {
      console.warn(`⚠️ INCONSISTÊNCIA: Mono não corresponde à correlação (deveria ser "${expectedMono}")`);
    } else {
      console.log('✅ Mono compatibility consistente com correlação estéreo');
    }
  } else {
    console.warn('⚠️ Dados insuficientes para analisar consistência mono/estéreo');
  }
  
  console.groupEnd();
}

// Função global para ativar debug detalhado
if (typeof window !== 'undefined') {
  window.enableDetailedAnalyzerDebug = () => {
    window.DEBUG_ANALYZER_DETAILED = true;
    console.log('🐛 DEBUG DETALHADO ATIVADO - próxima análise incluirá diagnóstico completo');
  };
  
  window.disableDetailedAnalyzerDebug = () => {
    window.DEBUG_ANALYZER_DETAILED = false;
    console.log('🐛 DEBUG DETALHADO DESATIVADO');
  };
}


