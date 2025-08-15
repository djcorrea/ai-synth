// 📐 DYNAMICS METRICS (Audit Mode)
// Fornece DR estatístico (P95 RMS_300ms - P10 RMS_300ms) separado de Crest Factor
// Mantém compatibilidade: não altera campos existentes; consumidor decide usar dr_stat
// Tudo somente ativado quando flags audit estão ligadas (AUDIT_MODE)

function windowRMS(channel, sampleRate, winMs = 300, hopMs = 100) {
  const win = Math.max(1, Math.round(sampleRate * winMs / 1000));
  const hop = Math.max(1, Math.round(sampleRate * hopMs / 1000));
  const out = [];
  let sum = 0;
  let buf = new Float32Array(win);
  let bi = 0; let filled = 0;
  for (let i = 0; i < channel.length; i++) {
    const x = channel[i];
    const prev = buf[bi];
    buf[bi] = x;
    bi = (bi + 1) % win;
    if (filled < win) { sum += x * x; filled++; } else { sum += x * x - prev * prev; }
    if (i + 1 >= win && ((i - win) % hop === 0)) {
      const ms = sum / win;
      out.push(ms > 0 ? 20 * Math.log10(Math.sqrt(ms)) : -Infinity);
    }
  }
  return out;
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const a = arr.filter(v => Number.isFinite(v)).sort((x,y)=>x-y);
  if (!a.length) return null;
  const idx = Math.min(a.length - 1, Math.max(0, Math.floor(a.length * p)));
  return a[idx];
}

export function computeDynamicStats(left, right, sampleRate) {
  const n = Math.min(left.length, right.length);
  const mid = new Float32Array(n);
  for (let i=0;i<n;i++) mid[i] = 0.5*(left[i]+right[i]);
  const rmsSeries = windowRMS(mid, sampleRate, 300, 100);
  const p95 = percentile(rmsSeries, 0.95);
  const p10 = percentile(rmsSeries, 0.10);
  const drStat = (p95 != null && p10 != null && Number.isFinite(p95) && Number.isFinite(p10)) ? (p95 - p10) : null;
  return { dr_stat: drStat, rms_windows: rmsSeries.length, p95_rms: p95, p10_rms: p10 };
}

export function computeCrestFactor(left, right) {
  const n = Math.min(left.length, right.length);
  let peak = 0; let sum = 0;
  for (let i=0;i<n;i++) { const m = 0.5*(left[i]+right[i]); const am=Math.abs(m); if (am>peak) peak=am; sum += m*m; }
  const rms = Math.sqrt(sum/Math.max(1,n));
  const peakDb = peak>0 ? 20*Math.log10(peak) : -Infinity;
  const rmsDb = rms>0 ? 20*Math.log10(rms) : -Infinity;
  return { crest_legacy: (peakDb>-Infinity && rmsDb>-Infinity)? (peakDb - rmsDb): null, peak_db: peakDb, rms_db: rmsDb };
}

export function dcOffsetHPF(channel, sampleRate) {
  const fc = 20;
  const w = 2*Math.PI*fc/sampleRate;
  const alpha = w / (w + 1);
  let y=0, xPrev=0, yPrev=0;
  let sum=0;
  for (let i=0;i<channel.length;i++) {
    const x = channel[i];
    y = alpha*(yPrev + x - xPrev);
    yPrev = y; xPrev = x;
    sum += y;
  }
  return sum/Math.max(1,channel.length);
}

export default { computeDynamicStats, computeCrestFactor, dcOffsetHPF };
