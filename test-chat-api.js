import http from 'http';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FIREBASE_SERVICE_ACCOUNT defined:', !!process.env.FIREBASE_SERVICE_ACCOUNT);

// Usar mock para desenvolvimento se não há FIREBASE_SERVICE_ACCOUNT
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log('⚠️  Usando Firebase mock para desenvolvimento');
  process.env.NODE_ENV = 'development';
}

// Import após carregar env
import chatHandler from './api/chat.js';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    try {
      await chatHandler(req, res);
    } catch (error) {
      console.error('Error in chat handler:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'HANDLER_ERROR',
        message: error.message,
        stack: error.stack
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🔧 Test chat API server running on http://localhost:${PORT}`);
});
