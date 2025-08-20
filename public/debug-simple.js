// Debug simples - testar se o problema é com o sistema completo
console.log('🔍 INICIANDO DEBUG SIMPLES...');

// Testar se conseguimos capturar o evento
window.addEventListener('chat:add-photos', function(event) {
  console.log('✅ EVENTO CAPTURADO!', event);
  console.log('📁 Arquivos:', event.detail);
  
  // Mostrar alert para confirmar
  alert(`Evento capturado! ${event.detail?.length || 0} arquivo(s)`);
});

// Função para testar manualmente
window.debugTestEvent = function() {
  console.log('🧪 Testando evento manualmente...');
  
  const event = new CustomEvent('chat:add-photos', {
    detail: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
  });
  
  window.dispatchEvent(event);
  console.log('🧪 Evento disparado');
};

// Verificar se os botões "+" existem
setTimeout(() => {
  const plusButtons = document.querySelectorAll('.chatbot-add-btn.chat-plus-btn');
  console.log('🔍 Botões + encontrados:', plusButtons.length);
  
  plusButtons.forEach((btn, index) => {
    console.log(`🔍 Botão ${index + 1}:`, btn);
    console.log(`🔍 Configurado?`, btn.hasAttribute('data-popover-configured'));
  });
}, 2000);

console.log('🔍 Debug simples carregado. Use debugTestEvent() no console para testar.');
