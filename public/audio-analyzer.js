// 🎵 AUDIO ANALYZER V1 - Ponte para V2 com cache-busting agressivo
// Versão v1.5-FIXED-CLEAN sem duplicações
// Implementação usando Web Audio API (100% gratuito)

class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyzer = null;
    this.dataArray = null;
    this.isAnalyzing = false;
    this._v2Loaded = false;
    this._v2LoadingPromise = null;
    
    console.log('🎯 AudioAnalyzer V1 construído - ponte para V2');
    this._preloadV2();
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
  async analyzeAudioFile(file) {
    const tsStart = new Date().toISOString();
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

    return new Promise((resolve, reject) => {
      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na análise do áudio (30s)'));
      }, 30000);

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (window.DEBUG_ANALYZER === true) console.log('� Decodificando áudio...');
          const audioData = e.target.result;
          const audioBuffer = await this.audioContext.decodeAudioData(audioData);
          
          if (window.DEBUG_ANALYZER === true) console.log('🔬 Realizando análise completa...');
          // Análise completa do áudio (V1)
          let analysis = this.performFullAnalysis(audioBuffer);

          // Enriquecimento Fase 2 (sem alterar UI): tenta carregar V2 e mapear novas métricas
          try {
            analysis = await this._enrichWithPhase2Metrics(audioBuffer, analysis, file);
          } catch (enrichErr) {
            console.warn('⚠️ Falha ao enriquecer com métricas Fase 2:', enrichErr?.message || enrichErr);
          }
          
          clearTimeout(timeout);
          if (window.DEBUG_ANALYZER === true) console.log('✅ Análise concluída com sucesso!');
          // Telemetria pós-json: chaves de 1º nível
          try {
            const topKeys = analysis ? Object.keys(analysis) : [];
            const techKeys = analysis?.technicalData ? Object.keys(analysis.technicalData) : [];
            if (window.DEBUG_ANALYZER === true) console.log('🛰️ [Telemetry] Front após "json" (obj pronto):', { topLevelKeys: topKeys, technicalKeys: techKeys });
          } catch {}
          resolve(analysis);
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Erro na decodificação:', error);
          reject(new Error(`Erro ao decodificar áudio: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Erro ao ler arquivo:', error);
        reject(new Error('Erro ao ler arquivo de áudio'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

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
    setIfValid('lra', loud.lra, 'v2:loudness');
    setIfValid('headroomDb', loud.headroom_db, 'v2:loudness');
    // True Peak
    setIfValid('truePeakDbtp', tp.true_peak_dbtp, 'v2:truepeak');
    setIfValid('samplePeakLeftDb', tp.sample_peak_left_db, 'v2:truepeak');
    setIfValid('samplePeakRightDb', tp.sample_peak_right_db, 'v2:truepeak');
    // Core / espectrais extra
    setIfValid('spectralCentroid', core.spectralCentroid, 'v2:spectral');
    setIfValid('spectralRolloff85', core.spectralRolloff85, 'v2:spectral');
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

  // Scores de qualidade e tempo total de processamento
  baseAnalysis.qualityOverall = isFinite(metrics?.quality?.overall) ? metrics.quality.overall : null;
  baseAnalysis.qualityBreakdown = metrics?.quality?.breakdown || null;
  baseAnalysis.processingMs = Number.isFinite(v2res?.processingTime) ? v2res.processingTime : null;

    // Frequências dominantes: manter existentes; se vazio, usar do V2
    if ((!Array.isArray(td.dominantFrequencies) || td.dominantFrequencies.length === 0) && metrics?.spectral?.dominantFrequencies) {
      td.dominantFrequencies = metrics.spectral.dominantFrequencies;
    }

    // Telemetria: chaves novas adicionadas
  const added = ['lufsIntegrated','lufsShortTerm','lufsMomentary','headroomDb','lra','truePeakDbtp','samplePeakLeftDb','samplePeakRightDb','spectralCentroid','spectralRolloff85','spectralFlux','stereoCorrelation','balanceLR','tonalBalance','crestFactor','stereoWidth','monoCompatibility','spectralFlatness','dcOffset','clippingSamples','clippingPct','qualityOverall','processingMs'];

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
        const ref = (typeof window !== 'undefined' && window.PROD_AI_REF_DATA) ? window.PROD_AI_REF_DATA : null;
        const safe = (v,def=0)=> Number.isFinite(v)?v:def;
        const lufsInt = safe(td.lufsIntegrated, safe(baseAnalysis.technicalData?.rms));
        const dr = safe(baseAnalysis.technicalData?.dynamicRange);
        const crest = safe(td.crestFactor);
        const corr = safe(td.stereoCorrelation,0);
        const centroid = safe(td.spectralCentroid);
        const freqIdealLow = 1800, freqIdealHigh = 3200;
        const refLufs = ref?.lufs_target ?? -14;
        const refDR = ref?.dr_target ?? 10;
        // Scores
        const scoreLoud = 100 - Math.min(100, Math.abs(lufsInt - refLufs) * 6); // 3 dB -> -18 pontos
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
        // Se qualityOverall ausente, calcular média ponderada
        if (!Number.isFinite(baseAnalysis.qualityOverall)) {
          baseAnalysis.qualityOverall = clamp((scoreDyn*0.25 + scoreTech*0.25 + scoreLoud*0.3 + scoreFreq*0.2));
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

    return baseAnalysis;
  }

  // (remoção do conversor WAV — não é mais necessário)

  // 🔬 Realizar análise completa
  performFullAnalysis(audioBuffer) {
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

    // 📊 Análise de Volume e Dinâmica
    analysis.technicalData.peak = this.findPeakLevel(leftChannel);
    analysis.technicalData.rms = this.calculateRMS(leftChannel);
    analysis.technicalData.dynamicRange = this.calculateDynamicRange(leftChannel);
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
      const clipThreshold = 0.95; // igual ao V2
      for (let i = 0; i < len; i++) {
        const s = leftChannel[i];
        dcSum += s;
        if (Math.abs(s) >= clipThreshold) clipped++;
      }
      const dcOffset = dcSum / Math.max(1, len);
      const clippingPct = (clipped / Math.max(1, len)) * 100;
      if (!Number.isFinite(analysis.technicalData.dcOffset)) {
        analysis.technicalData.dcOffset = dcOffset;
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

    // 🔒 Validação final dos arrays essenciais
    analysis.problems = Array.isArray(analysis.problems) ? analysis.problems : [];
    analysis.suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];
    analysis.technicalData.dominantFrequencies = Array.isArray(analysis.technicalData.dominantFrequencies) ? analysis.technicalData.dominantFrequencies : [];

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

  // 🎚️ Calcular range dinâmico
  calculateDynamicRange(channelData) {
    const peak = this.findPeakLevel(channelData);
    const rms = this.calculateRMS(channelData);
    
    // Verificar valores válidos
    if (rms === -Infinity || isNaN(peak) || isNaN(rms)) {
      return 0;
    }
    
    return Math.abs(peak - rms);
  }

  // 🎵 Encontrar frequências dominantes
  findDominantFrequencies(channelData, sampleRate) {
  if (window.DEBUG_ANALYZER === true) console.log('🎯 Iniciando análise de frequências...');
    
    // Implementação simplificada e mais rápida
    const fftSize = 256; // Reduzido para melhor performance
    const frequencies = [];
    const maxSections = 20; // Limitar número de seções
    
    const stepSize = Math.max(fftSize * 4, Math.floor(channelData.length / maxSections));
    
    // Analisar diferentes seções do áudio
    for (let i = 0; i < channelData.length - fftSize && frequencies.length < maxSections; i += stepSize) {
      try {
        const section = channelData.slice(i, i + fftSize);
        const spectrum = this.simpleFFT(section);
        
        // Encontrar frequência dominante nesta seção
        let maxMagnitude = 0;
        let dominantBin = 0;
        
        for (let j = 1; j < spectrum.length / 2; j++) { // Começar do bin 1
          const magnitude = spectrum[j];
          if (magnitude > maxMagnitude) {
            maxMagnitude = magnitude;
            dominantBin = j;
          }
        }
        
        const dominantFreq = (dominantBin * sampleRate) / fftSize;
        if (dominantFreq > 20 && dominantFreq < 20000) { // Faixa audível
          frequencies.push(dominantFreq);
        }
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

  // 📊 Agrupar frequências similares
  groupFrequencies(frequencies) {
    const groups = {};
    const tolerance = 50; // Hz
    
    frequencies.forEach(freq => {
      const rounded = Math.round(freq / tolerance) * tolerance;
      groups[rounded] = (groups[rounded] || 0) + 1;
    });
    
    return Object.entries(groups)
      .sort(([,a], [,b]) => b - a)
      .map(([freq, count]) => ({ frequency: parseFloat(freq), occurrences: count }));
  }

  // 🚨 Detectar problemas comuns
  detectCommonProblems(analysis) {
    const { peak, rms, dynamicRange } = analysis.technicalData;

    // Problema: Clipping
    if (peak > -0.5) {
      analysis.problems.push({
        type: 'clipping',
        severity: 'high',
        message: 'Áudio com clipping detectado',
        solution: 'Reduza o volume geral ou use limitador'
      });
    }

    // Problema: Volume muito baixo
    if (rms < -30) {
      analysis.problems.push({
        type: 'low_volume',
        severity: 'medium',
        message: 'Volume RMS muito baixo',
        solution: 'Aumente o volume ou use compressão'
      });
    }

    // Problema: Falta de dinâmica
    if (dynamicRange < 6) {
      analysis.problems.push({
        type: 'over_compressed',
        severity: 'medium',
        message: 'Áudio muito comprimido',
        solution: 'Reduza compressão ou use compressão multibanda'
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
    const { peak, rms, dominantFrequencies, spectralCentroid, lufsIntegrated } = analysis.technicalData;

    // Sugestões baseadas no LUFS integrado real (quando disponível)
    if (lufsIntegrated !== null && Number.isFinite(lufsIntegrated)) {
      if (lufsIntegrated >= -16 && lufsIntegrated <= -13) {
        analysis.suggestions.push({
          type: 'mastering',
          message: 'Nível ideal para streaming (-14 LUFS)',
          action: `Seu áudio está no volume ideal para plataformas digitais (${lufsIntegrated.toFixed(1)} LUFS)`
        });
      }
    } else if (rms > -16 && rms < -12) {
      // Fallback para RMS quando LUFS não disponível (com aviso)
      analysis.suggestions.push({
        type: 'mastering',
        message: 'Volume adequado (estimativa via RMS)',
        action: `Volume estimado adequado (${rms.toFixed(1)} dB RMS - LUFS não calculado)`
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
          type: 'low_end_excess',
          message: `Excesso de graves (Centroide: ${Math.round(spectralCentroid)}Hz)`,
          action: `Reduzir 60-200Hz (-2 a -4dB) ou usar high-pass suave`
        });
      } 
      else if (spectralCentroid < thresholds.dark) {
        analysis.suggestions.push({
          type: 'highs_deficient',
          message: `Som escuro - agudos insuficientes (${Math.round(spectralCentroid)}Hz)`,
          action: `Adicionar presença em 3-6kHz (+2 a +3dB) e brilho em 10kHz (+1 a +2dB)`
        });
      }
      else if (spectralCentroid >= thresholds.balanced_low && spectralCentroid <= thresholds.balanced_high) {
        // Zona equilibrada - sem sugestões de correção
        if (window.DEBUG_ANALYZER) console.log(`[V1] ✅ Frequências equilibradas (${Math.round(spectralCentroid)}Hz)`);
      }
      else if (spectralCentroid > thresholds.bright) {
        analysis.suggestions.push({
          type: 'highs_excess',
          message: `Som muito brilhante (Centroide: ${Math.round(spectralCentroid)}Hz)`,
          action: `Reduzir 8-12kHz (-1 a -3dB), verificar sibilância em 6-8kHz`
        });
      }
      else if (spectralCentroid > thresholds.balanced_high) {
        analysis.suggestions.push({
          type: 'bass_deficient',
          message: `Falta de corpo/graves (Centroide: ${Math.round(spectralCentroid)}Hz)`,
          action: `Reforçar 100-500Hz (+2 a +4dB) para adicionar corpo`
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
  }

  // 🎯 Gerar prompt personalizado para IA
  generateAIPrompt(analysis) {
    let prompt = `🎵 ANÁLISE TÉCNICA DE ÁUDIO DETECTADA:\n\n`;
    
    prompt += `📊 DADOS TÉCNICOS:\n`;
    prompt += `• Peak: ${analysis.technicalData.peak.toFixed(1)}dB\n`;
    prompt += `• RMS: ${analysis.technicalData.rms.toFixed(1)}dB\n`;
    prompt += `• Dinâmica: ${analysis.technicalData.dynamicRange.toFixed(1)}dB\n`;
    prompt += `• Duração: ${analysis.duration.toFixed(1)}s\n`;
    prompt += `• Sample Rate: ${analysis.sampleRate}Hz\n`;
    prompt += `• Canais: ${analysis.channels}\n\n`;

    if (analysis.technicalData.dominantFrequencies.length > 0) {
      prompt += `🎯 FREQUÊNCIAS DOMINANTES:\n`;
      analysis.technicalData.dominantFrequencies.slice(0, 5).forEach(freq => {
        prompt += `• ${Math.round(freq.frequency)}Hz (${freq.occurrences}x detectada)\n`;
      });
      prompt += `\n`;
    }

    if (analysis.problems.length > 0) {
      prompt += `🚨 PROBLEMAS DETECTADOS:\n`;
      analysis.problems.forEach(problem => {
        prompt += `• ${problem.message}\n`;
        prompt += `  Solução: ${problem.solution}\n`;
      });
      prompt += `\n`;
    }

    if (analysis.suggestions.length > 0) {
      prompt += `💡 SUGESTÕES AUTOMÁTICAS:\n`;
      analysis.suggestions.forEach(suggestion => {
        prompt += `• ${suggestion.message}\n`;
        prompt += `  Ação: ${suggestion.action}\n`;
      });
      prompt += `\n`;
    }

    prompt += `🎯 CONTEXTO: Sou um produtor musical que precisa de ajuda específica para melhorar meu áudio. `;
    prompt += `Com base nesta análise técnica REAL do meu arquivo, me forneça conselhos práticos e específicos `;
    prompt += `incluindo valores exatos de EQ, compressão, limitação e outros processamentos. `;
    prompt += `Se detectou frequências problemáticas, me diga exatamente onde cortar/realçar e com qual Q. `;
    prompt += `Se o volume está inadequado, me diga os valores exatos de compressão e limitação para corrigir.`;

  // ⚠️ Regra obrigatória para reforçar uso dos dados do JSON na resposta da IA
  prompt += `\n\n⚠️ REGRA OBRIGATÓRIA: Use obrigatoriamente todos os valores de Peak, RMS, Dinâmica e Frequências Dominantes fornecidos no JSON para criar recomendações técnicas reais e específicas de EQ, compressão, limitação, saturação e outros processamentos. Sempre inclua valores exatos nas recomendações.`;

    return prompt;
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
        setIfBetter('headroomDb', lres.headroom_db);
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
              for (let i=0;i<bins.length;i++) {
                const f = bins[i];
                if (f >= fLow && f < fHigh) { energy += mags[i]; count++; }
              }
              if (count>0) {
                const lin = energy / count; // média simples
                // Converter para dB relativo ao total médio das magnitudes
                const norm = lin / (totalEnergy / bins.length);
                const db = 10 * Math.log10(norm || 1e-9);
                bandEnergies[band] = { energy: lin, rms_db: db };
              } else {
                bandEnergies[band] = { energy: 0, rms_db: -Infinity };
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
                bandEnergiesLog[band] = { rms_db: db, proportion: ratio };
              }
              td.bandEnergiesLog = bandEnergiesLog;
              (td._sources = td._sources || {}).bandEnergiesLog = 'advanced:spectrum:log';
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
              for (const [band, data] of Object.entries(bandEnergies)) {
                if (addedCount >= maxBandSuggestions) break;
                const refBand = ref?.bands?.[band];
                if (!refBand || !Number.isFinite(refBand.target_db) || !Number.isFinite(refBand.tol_db)) continue;
                if (!Number.isFinite(data.rms_db) || data.rms_db === -Infinity) continue;
                const diff = data.rms_db - refBand.target_db;
                const outOfRange = Math.abs(diff) > refBand.tol_db;
                if (outOfRange) {
                  const direction = diff > 0 ? 'reduzir' : 'aumentar';
                  const action = diff > 0 ? `Cortar ${band} em ~${Math.abs(diff).toFixed(1)}dB (target ${refBand.target_db.toFixed(1)}±${refBand.tol_db})` : `Boost ${band} em ~${Math.abs(diff).toFixed(1)}dB`;
                  const key = `band:${band}`;
                  if (!existingKeys.has(key)) {
                    // Acrescentar faixa sugerida (Hz) nos detalhes, usando definição das bandas
                    const br = bandDefs[band];
                    const rangeTxt = Array.isArray(br) && br.length===2 ? ` | faixa ${Math.round(br[0])}-${Math.round(br[1])}Hz` : '';
                    sug.push({
                      type: 'band_adjust',
                      _bandKey: key,
                      message: `Banda ${band} fora do alvo (${data.rms_db.toFixed(1)}dB vs ${refBand.target_db.toFixed(1)}dB)` ,
                      action,
                      details: `Diferença ${diff>0?'+':''}${diff.toFixed(2)}dB | tolerância ±${refBand.tol_db}${rangeTxt}`
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
      if (Number.isFinite(td.lra)) {
        // LRA plausível: não maior que 3× DR e não negativa
        if (Number.isFinite(dr)) {
          mv.lraPlausibility = (td.lra >= 0 && td.lra <= dr * 3) ? 'ok' : 'check';
        }
      }
    } catch (e) { if (debug) console.warn('⚠️ [ADV] Validação métricas falhou:', e?.message || e); }

    return baseAnalysis;
  } catch (err) {
    if (typeof window !== 'undefined' && window.DEBUG_ANALYZER === true) console.warn('⚠️ [ADV] Adapter geral falhou:', err?.message || err);
    return baseAnalysis;
  }
};

