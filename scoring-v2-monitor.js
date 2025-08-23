
// 📊 SCRIPT DE MONITORAMENTO DO SCORING V2
// Cole este código no console do browser para monitorar

window.SCORING_V2_MONITOR = {
  stats: { v1Count: 0, v2Count: 0, fallbackCount: 0, errorCount: 0 },
  
  start() {
    console.log('📊 Iniciando monitoramento do Scoring V2...');
    
    // Interceptar console.log para capturar eventos de scoring
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('[SCORING_V1]')) this.stats.v1Count++;
      if (message.includes('[SCORING_V2]')) this.stats.v2Count++;
      if (message.includes('fallback')) this.stats.fallbackCount++;
      if (message.includes('[SCORING_CRITICAL]')) this.stats.errorCount++;
      
      originalLog.apply(console, args);
    };
    
    setInterval(() => this.report(), 30000); // Report a cada 30s
  },
  
  report() {
    console.log('📊 SCORING V2 STATS:', this.stats);
    
    const total = this.stats.v1Count + this.stats.v2Count;
    if (total > 0) {
      const v2Rate = (this.stats.v2Count / total * 100).toFixed(1);
      const fallbackRate = (this.stats.fallbackCount / total * 100).toFixed(1);
      const errorRate = (this.stats.errorCount / total * 100).toFixed(1);
      
      console.log(`📈 V2 Usage: ${v2Rate}%, Fallback: ${fallbackRate}%, Errors: ${errorRate}%`);
      
      // Alert se erro rate muito alto
      if (parseFloat(errorRate) > 5) {
        console.warn('🚨 ALTO ERRO RATE! Considerar rollback.');
      }
    }
  },
  
  reset() {
    this.stats = { v1Count: 0, v2Count: 0, fallbackCount: 0, errorCount: 0 };
    console.log('🔄 Stats resetados');
  }
};

// Iniciar automaticamente
window.SCORING_V2_MONITOR.start();
