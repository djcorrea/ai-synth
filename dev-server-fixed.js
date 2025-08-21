/**
 * Servidor HTTP simples para desenvolvimento com API de Upload
 * Servidor nativo Node.js para evitar problemas de dependências
 * 
 * Uso: node dev-server.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Setup ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Import da API de upload
let uploadHandler;
try {
  const uploadModule = await import('./api/upload-audio.js');
  uploadHandler = uploadModule.default;
  console.log('✅ API de upload carregada com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar API de upload:', error.message);
  uploadHandler = (req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'SERVICO_INDISPONIVEL',
      message: 'API de upload não está disponível'
    }));
  };
}

// Função para detectar content-type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Função para servir arquivos estáticos
function serveStatic(req, res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Arquivo não encontrado');
      return;
    }
    
    const contentType = getContentType(filePath);
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  // Configurar CORS para todas as respostas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Tratar preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  console.log(`${req.method} ${pathname}`);
  
  // Rota da API de upload
  if (pathname === '/api/upload-audio') {
    uploadHandler(req, res);
    return;
  }
  
  // Rota raiz
  if (pathname === '/') {
    const landingPath = path.join(__dirname, 'public', 'landing.html');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (fs.existsSync(landingPath)) {
      serveStatic(req, res, landingPath);
    } else if (fs.existsSync(indexPath)) {
      serveStatic(req, res, indexPath);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Página não encontrada');
    }
    return;
  }
  
  // Servir arquivos estáticos
  let filePath;
  
  if (pathname.startsWith('/refs/')) {
    filePath = path.join(__dirname, pathname);
  } else if (pathname.startsWith('/lib/')) {
    filePath = path.join(__dirname, pathname);
  } else {
    filePath = path.join(__dirname, 'public', pathname);
  }
  
  // Verificar se o arquivo existe
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      serveStatic(req, res, filePath);
      return;
    }
  }
  
  // Arquivo não encontrado
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Arquivo não encontrado');
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`
🚀 Servidor de desenvolvimento iniciado
📍 URL: http://localhost:${PORT}
🎵 Upload de áudio: http://localhost:${PORT}/api/upload-audio
📋 Teste: http://localhost:${PORT}/test-upload-60mb.html
🔧 Limite de upload: ${process.env.MAX_UPLOAD_MB || 60}MB

✅ Pronto para receber uploads de áudio!
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Servidor finalizado graciosamente');
  server.close(() => {
    process.exit(0);
  });
});
