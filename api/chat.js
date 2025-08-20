import { auth, db } from './firebaseAdmin.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import cors from 'cors';
import formidable from 'formidable';
import fs from 'fs';

// ✅ CORREÇÃO: Configuração para suporte a multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Função para processar multipart/form-data (versão Vercel-friendly)
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB (Vercel limit friendly)
      maxFiles: 3,
      multiples: true,
      allowEmptyFiles: false,
      keepExtensions: true,
      filter: function ({ name, originalFilename, mimetype }) {
        console.log('🔍 Filtering file:', { name, originalFilename, mimetype });
        // Aceitar campos de texto e imagens
        if (name === 'message' || name === 'conversationHistory' || name === 'idToken') {
          return true;
        }
        // Aceitar apenas imagens válidas
        if (name === 'images' && mimetype && mimetype.startsWith('image/')) {
          return true;
        }
        console.log('❌ File rejected:', { name, mimetype });
        return false;
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('❌ Erro no formidable:', {
          message: err.message,
          code: err.code,
          httpCode: err.httpCode
        });
        reject(new Error(`FORMIDABLE_ERROR: ${err.message}`));
        return;
      }

      console.log('📋 Campos recebidos:', Object.keys(fields));
      console.log('📁 Arquivos recebidos:', Object.keys(files));

      try {
        // ✅ Processar imagens de forma assíncrona e robusta
        const images = [];
        if (files.images) {
          const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
          
          for (const [index, file] of imageFiles.entries()) {
            try {
              console.log(`📸 Processando imagem ${index + 1}:`, {
                name: file.originalFilename,
                size: file.size,
                type: file.mimetype,
                exists: fs.existsSync(file.filepath)
              });
              
              // Verificar se arquivo existe e é válido
              if (!fs.existsSync(file.filepath)) {
                console.error(`❌ Arquivo não encontrado: ${file.filepath}`);
                continue;
              }

              if (file.size === 0) {
                console.error(`❌ Arquivo vazio: ${file.originalFilename}`);
                continue;
              }
              
              // Ler arquivo de forma segura
              const buffer = await fs.promises.readFile(file.filepath);
              const base64 = buffer.toString('base64');
              
              // Validar base64
              if (!base64 || base64.length < 100) { // Mínimo razoável para uma imagem
                console.error(`❌ Base64 inválido para: ${file.originalFilename}`);
                continue;
              }
              
              images.push({
                base64,
                filename: file.originalFilename || `image-${index + 1}.jpg`,
                type: file.mimetype || 'image/jpeg',
                size: file.size
              });
              
              console.log(`✅ Imagem ${index + 1} processada: ${(base64.length/1024).toFixed(1)}KB base64`);
              
            } catch (fileError) {
              console.error(`❌ Erro ao processar imagem ${index + 1}:`, fileError.message);
              // Continuar processando outras imagens
            } finally {
              // Sempre tentar limpar arquivo temporário
              try {
                if (fs.existsSync(file.filepath)) {
                  await fs.promises.unlink(file.filepath);
                }
              } catch (cleanupError) {
                console.warn(`⚠️ Erro ao limpar ${file.filepath}:`, cleanupError.message);
              }
            }
          }
        }

        console.log(`✅ Multipart processado: ${images.length} imagem(ns) válida(s)`);

        // Processar campos de texto
        const getFieldValue = (field) => {
          if (!field) return '';
          return Array.isArray(field) ? field[0] : field;
        };

        resolve({
          message: getFieldValue(fields.message) || '',
          conversationHistory: getFieldValue(fields.conversationHistory) || '[]',
          idToken: getFieldValue(fields.idToken) || '',
          images
        });

      } catch (processError) {
        console.error('❌ Erro ao processar dados do formulário:', processError);
        reject(new Error(`PROCESS_ERROR: ${processError.message}`));
      }
    });
  });
}

// ✅ Função para processar request body (JSON ou multipart) com error handling
async function parseRequestBody(req) {
  const contentType = req.headers['content-type'] || '';
  
  try {
    if (contentType.includes('multipart/form-data')) {
      console.log('📦 Processando multipart/form-data...');
      const result = await parseMultipart(req);
      console.log('✅ Multipart processado com sucesso');
      return result;
    } else {
      console.log('📝 Processando application/json...');
      // Vercel já faz parse do JSON por padrão se bodyParser não for false
      const body = req.body || {};
      console.log('✅ JSON processado:', { hasMessage: !!body.message, hasImages: !!(body.images && body.images.length) });
      return body;
    }
  } catch (error) {
    console.error('❌ Erro ao processar request body:', error);
    throw new Error(`BODY_PARSE_ERROR: ${error.message}`);
  }
}

// Middleware CORS dinâmico
const corsMiddleware = cors({
  origin: (origin, callback) => {
    const fixedOrigin = 'https://prod-ai-teste.vercel.app';
    const prodFrontend = 'https://ai-synth.vercel.app';
    const apiPreviewRegex = /^https:\/\/prod-ai-teste-[a-z0-9\-]+\.vercel\.app$/;
    const frontendPreviewRegex = /^https:\/\/ai-synth(?:-[a-z0-9\-]+)?\.vercel\.app$/;

    // Adicionar suporte para desenvolvimento local
    const localOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];

    // Permitir origens locais, Vercel e file://
    if (!origin ||
        origin === fixedOrigin ||
        origin === prodFrontend ||
        apiPreviewRegex.test(origin) ||
        frontendPreviewRegex.test(origin) ||
        localOrigins.includes(origin) ||
        origin.startsWith('file://')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Função para validar e sanitizar dados de entrada - ATUALIZADA COM SUPORTE A IMAGENS
function validateAndSanitizeInput(requestData) {
  const { message, conversationHistory, idToken, images = [] } = requestData;
  
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('TOKEN_MISSING');
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('MESSAGE_INVALID');
  }
  
  // ✅ Processar conversationHistory (pode vir como string do FormData)
  let validHistory = [];
  let historyData = conversationHistory;
  
  if (typeof conversationHistory === 'string') {
    try {
      historyData = JSON.parse(conversationHistory);
    } catch (error) {
      console.warn('⚠️ Erro ao parsear conversationHistory:', error);
      historyData = [];
    }
  }
  
  if (Array.isArray(historyData)) {
    validHistory = historyData
      .filter(msg => {
        return msg && 
          typeof msg === 'object' && 
          msg.role && 
          msg.content &&
          typeof msg.content === 'string' &&
          msg.content.trim().length > 0 &&
          ['user', 'assistant', 'system'].includes(msg.role);
      })
      .slice(-5); // Histórico reduzido para performance
  }
  
  // ✅ Validar imagens se presentes
  let validImages = [];
  if (Array.isArray(images) && images.length > 0) {
    if (images.length > 3) {
      throw new Error('IMAGES_LIMIT_EXCEEDED');
    }
    
    validImages = images.filter(img => {
      return img && 
        typeof img === 'object' && 
        img.base64 && 
        typeof img.base64 === 'string' &&
        img.filename && 
        typeof img.filename === 'string';
    }).slice(0, 3); // Garantir máximo de 3 imagens
    
    console.log(`✅ ${validImages.length} imagem(ns) válida(s) processada(s)`);
  }
  
  return {
    message: message.trim().substring(0, 2000),
    conversationHistory: validHistory,
    idToken: idToken.trim(),
    images: validImages,
    // 🎤 Detectar se é voice message (GRATUITO)
    isVoiceMessage: message.startsWith('[VOICE MESSAGE]'),
    // 🖼️ Detectar se tem imagens (requer GPT-4 Vision)
    hasImages: validImages.length > 0
  };
}

// Função para gerenciar limites de usuário e cota de imagens - ATUALIZADA
async function handleUserLimits(db, uid, email) {
  const userRef = db.collection('usuarios').doc(uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const now = Timestamp.now();
      const today = now.toDate().toDateString();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let userData;

      if (!snap.exists) {
        userData = {
          uid,
          plano: 'gratis',
          mensagensRestantes: 9,
          dataUltimoReset: now,
          createdAt: now,
          // Cota de análise de imagens
          imagemAnalises: {
            usadas: 0,
            limite: 5, // Grátis: 5/mês
            mesAtual: currentMonth,
            anoAtual: currentYear,
            resetEm: now
          }
        };
        if (email) {
          userData.email = email;
        }
        tx.set(userRef, userData);
      } else {
        userData = snap.data();
        const lastReset = userData.dataUltimoReset?.toDate().toDateString();

        // VERIFICAÇÃO AUTOMÁTICA DE EXPIRAÇÃO DO PLANO PLUS
        if (userData.plano === 'plus' && userData.planExpiresAt) {
          const currentDate = new Date();
          const expirationDate = userData.planExpiresAt instanceof Date ? 
            userData.planExpiresAt : 
            userData.planExpiresAt.toDate ? userData.planExpiresAt.toDate() : new Date(userData.planExpiresAt);
          
          if (expirationDate <= currentDate) {
            console.log('⏰ Plano Plus expirado, convertendo para gratuito:', uid);
            
            // Dados para converter plano expirado
            const expiredPlanData = {
              plano: 'gratis',
              isPlus: false,
              mensagensRestantes: 10,
              planExpiredAt: now,
              previousPlan: 'plus',
              dataUltimoReset: now,
              // Reset cota de imagens para plano gratuito
              imagemAnalises: {
                usadas: 0,
                limite: 5,
                mesAtual: currentMonth,
                anoAtual: currentYear,
                resetEm: now
              }
            };
            
            // Atualizar no Firestore
            tx.update(userRef, expiredPlanData);
            
            // Atualizar userData local para refletir as mudanças
            userData = { ...userData, ...expiredPlanData };
            
            console.log('✅ Usuário convertido de Plus expirado para gratuito:', uid);
          }
        }

        // Verificar reset diário das mensagens
        if (lastReset !== today) {
          userData.mensagensRestantes = 10;
          tx.update(userRef, {
            mensagensRestantes: 10,
            dataUltimoReset: now,
          });
        }

        // Verificar reset mensal da cota de imagens
        if (!userData.imagemAnalises || 
            userData.imagemAnalises.mesAtual !== currentMonth || 
            userData.imagemAnalises.anoAtual !== currentYear) {
          
          const limiteImagens = userData.plano === 'plus' ? 20 : 5;
          userData.imagemAnalises = {
            usadas: 0,
            limite: limiteImagens,
            mesAtual: currentMonth,
            anoAtual: currentYear,
            resetEm: now
          };
          
          tx.update(userRef, {
            imagemAnalises: userData.imagemAnalises
          });
          
          console.log(`🔄 Reset mensal da cota de imagens: ${limiteImagens} análises disponíveis para usuário ${userData.plano}`);
        }

        // Verificar limite de mensagens diárias (apenas plano gratuito)
        if (userData.plano === 'gratis') {
          if (userData.mensagensRestantes <= 0) {
            throw new Error('LIMIT_EXCEEDED');
          }
          tx.update(userRef, {
            mensagensRestantes: FieldValue.increment(-1),
          });
          userData.mensagensRestantes =
            (userData.mensagensRestantes || 10) - 1;
        }
      }

      return userData;
    });

    const finalSnap = await userRef.get();
    return { ...result, perfil: finalSnap.data().perfil };
  } catch (error) {
    if (error.message === 'LIMIT_EXCEEDED') {
      console.warn('🚫 Limite de mensagens atingido para:', email);
      throw error;
    }
    console.error('❌ Erro na transação do usuário:', error);
    throw new Error('Erro ao processar limites do usuário');
  }
}

// Função para consumir cota de análise de imagens - NOVA
async function consumeImageAnalysisQuota(db, uid, email, userData) {
  const userRef = db.collection('usuarios').doc(uid);
  
  try {
    const result = await db.runTransaction(async (tx) => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Usar userData já carregado ou buscar novamente
      let currentUserData = userData;
      if (!currentUserData.imagemAnalises) {
        const snap = await tx.get(userRef);
        currentUserData = snap.data();
      }
      
      // Verificar se precisa resetar cota mensal
      if (!currentUserData.imagemAnalises || 
          currentUserData.imagemAnalises.mesAtual !== currentMonth || 
          currentUserData.imagemAnalises.anoAtual !== currentYear) {
        
        const limiteImagens = currentUserData.plano === 'plus' ? 20 : 5;
        currentUserData.imagemAnalises = {
          usadas: 0,
          limite: limiteImagens,
          mesAtual: currentMonth,
          anoAtual: currentYear,
          resetEm: Timestamp.now()
        };
      }
      
      // Verificar se ainda tem cota disponível
      if (currentUserData.imagemAnalises.usadas >= currentUserData.imagemAnalises.limite) {
        throw new Error('IMAGE_QUOTA_EXCEEDED');
      }
      
      // Consumir uma unidade da cota
      const novaQuantidade = currentUserData.imagemAnalises.usadas + 1;
      tx.update(userRef, {
        'imagemAnalises.usadas': novaQuantidade,
        'imagemAnalises.ultimoUso': Timestamp.now()
      });
      
      console.log(`🖼️ Cota de imagem consumida: ${novaQuantidade}/${currentUserData.imagemAnalises.limite} para usuário ${currentUserData.plano}`);
      
      return {
        ...currentUserData.imagemAnalises,
        usadas: novaQuantidade
      };
    });
    
    return result;
  } catch (error) {
    if (error.message === 'IMAGE_QUOTA_EXCEEDED') {
      console.warn('🚫 Cota de análise de imagens esgotada para:', email);
      throw error;
    }
    console.error('❌ Erro ao consumir cota de imagens:', error);
    throw error;
  }
}

// System prompts para diferentes cenários
const SYSTEM_PROMPTS = {
  // Prompt para análise de imagens com GPT-4 Vision
  imageAnalysis: `Você é o PROD.AI 🎵, um especialista master em produção musical e análise visual.

INSTRUÇÕES PARA ANÁLISE DE IMAGENS:
- Analise detalhadamente todas as imagens fornecidas
- Identifique: interfaces, plugins, waveforms, espectrogramas, mixers, equipamentos, DAWs
- Forneça feedback técnico específico sobre configurações visíveis
- Sugira melhorias baseadas no que você vê
- Explique problemas identificados nas imagens
- Dê conselhos práticos e aplicáveis
- Use valores específicos quando relevante (Hz, dB, ms)
- Seja direto, técnico e preciso

ESPECIALIDADES:
- Análise de waveforms e espectrogramas
- Configurações de plugins (EQ, compressores, reverbs)
- Layouts de DAW e workflow
- Equipamentos de estúdio
- Problemas visuais em mixagem
- Configurações de master chain

Responda de forma detalhada sobre o que você vê nas imagens e como melhorar.`,

  // Prompt padrão para conversas sem imagens
  default: `Você é o PROD.AI 🎵, um especialista master em produção musical com conhecimento técnico avançado.

INSTRUÇÕES PRINCIPAIS:
- Seja direto, técnico e preciso em todas as respostas
- Use valores específicos, frequências exatas (Hz), faixas dinâmicas (dB), tempos (ms)
- Mencione equipamentos, plugins e técnicas por nome
- Forneça parâmetros exatos quando relevante
- Seja conciso mas completo - evite respostas genéricas
- Dê conselhos práticos e aplicáveis imediatamente

ESPECIALIDADES TÉCNICAS:
- Mixagem: EQ preciso, compressão dinâmica, reverb/delay, automação
- Mastering: Limiters, maximizers, análise espectral, LUFS, headroom
- Sound Design: Síntese, sampling, modulação, efeitos
- Arranjo: Teoria musical aplicada, harmonias, progressões
- Acústica: Tratamento de sala, posicionamento de monitores
- Workflow: Técnicas de produção rápida e eficiente`
};

// Função principal do handler
export default async function handler(req, res) {
  console.log('🔄 Nova requisição recebida:', {
    method: req.method,
    timestamp: new Date().toISOString(),
    hasBody: !!req.body
  });

  try {
    await runMiddleware(req, res, corsMiddleware);
  } catch (err) {
    console.error('CORS error:', err);
    return res.status(403).end();
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // ✅ CORREÇÃO: Processar body dinamicamente (JSON ou multipart) com error handling
    let requestData;
    try {
      requestData = await parseRequestBody(req);
      console.log('📨 Request data processado:', {
        hasMessage: !!requestData.message,
        hasImages: !!(requestData.images && requestData.images.length > 0),
        imageCount: requestData.images?.length || 0,
        contentType: req.headers['content-type']
      });
    } catch (parseError) {
      console.error('❌ Erro ao processar request body:', parseError);
      if (parseError.message.includes('BODY_PARSE_ERROR')) {
        return res.status(400).json({ 
          error: 'INVALID_REQUEST_FORMAT', 
          message: 'Formato de requisição inválido. Verifique se as imagens são válidas.' 
        });
      }
      throw parseError;
    }

    let validatedData;
    try {
      validatedData = validateAndSanitizeInput(requestData);
    } catch (error) {
      console.error('❌ Erro na validação:', error.message);
      if (error.message === 'TOKEN_MISSING') {
        return res.status(401).json({ error: 'AUTH_TOKEN_MISSING', message: 'Token de autenticação necessário' });
      }
      if (error.message === 'MESSAGE_INVALID') {
        return res.status(422).json({ error: 'MESSAGE_INVALID', message: 'Mensagem inválida ou vazia' });
      }
      if (error.message === 'IMAGES_LIMIT_EXCEEDED') {
        return res.status(422).json({ error: 'IMAGES_LIMIT_EXCEEDED', message: 'Máximo de 3 imagens por envio' });
      }
      throw error;
    }

    const { message, conversationHistory, idToken, images, hasImages } = validatedData;

    // Verificar autenticação
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    const uid = decoded.uid;
    const email = decoded.email;

    // Gerenciar limites de usuário
    let userData;
    try {
      userData = await handleUserLimits(db, uid, email);
    } catch (error) {
      if (error.message === 'LIMIT_EXCEEDED') {
        return res.status(403).json({ error: 'Limite diário de mensagens atingido' });
      }
      throw error;
    }

    // Se tem imagens, verificar e consumir cota de análise
    let imageQuotaInfo = null;
    if (hasImages) {
      try {
        imageQuotaInfo = await consumeImageAnalysisQuota(db, uid, email, userData);
        console.log(`✅ Cota de imagem consumida para análise visual`);
      } catch (error) {
        if (error.message === 'IMAGE_QUOTA_EXCEEDED') {
          const limite = userData.plano === 'plus' ? 20 : 5;
          return res.status(403).json({ 
            error: 'Cota de análise de imagens esgotada',
            message: `Você atingiu o limite de ${limite} análises de imagem deste mês.`,
            plano: userData.plano,
            limite: limite,
            proximoReset: 'Início do próximo mês'
          });
        }
        throw error;
      }
    }

    // Preparar mensagens para a IA
    const messages = [];
    
    // System prompt baseado no tipo de análise
    if (hasImages) {
      messages.push({
        role: 'system',
        content: SYSTEM_PROMPTS.imageAnalysis
      });
    } else {
      messages.push({
        role: 'system', 
        content: SYSTEM_PROMPTS.default
      });
    }

    // Adicionar histórico de conversa
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Preparar mensagem do usuário
    const userMessage = {
      role: 'user',
      content: hasImages ? [
        { type: 'text', text: message },
        ...images.map(img => ({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${img.base64}`,
            detail: 'high'
          }
        }))
      ] : message
    };

    messages.push(userMessage);

    // Escolher modelo baseado no tipo de análise
    const model = hasImages ? 'gpt-4o' : 'gpt-3.5-turbo';
    
    console.log(`🤖 Usando modelo: ${model} ${hasImages ? '(análise de imagem)' : '(texto)'}`);

    // Chamar API da OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: hasImages ? 2000 : 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro da OpenAI:', error);
      throw new Error('Erro na API da OpenAI');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('✅ Resposta da IA gerada com sucesso');

    // Preparar resposta final
    const responseData = {
      reply,
      mensagensRestantes: userData.plano === 'gratis' ? userData.mensagensRestantes : null,
      model: model
    };

    // Incluir informações de cota de imagem se aplicável
    if (hasImages && imageQuotaInfo) {
      responseData.imageAnalysis = {
        quotaUsed: imageQuotaInfo.usadas,
        quotaLimit: imageQuotaInfo.limite,
        quotaRemaining: imageQuotaInfo.limite - imageQuotaInfo.usadas,
        planType: userData.plano
      };
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 ERRO NO SERVIDOR:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: decoded?.uid || 'unknown',
      hasImages: !!hasImages,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      contentType: req.headers['content-type']
    });
    
    // ✅ Categorizar erros específicos para melhor debugging
    if (error.message.includes('FORMIDABLE_ERROR')) {
      return res.status(400).json({ 
        error: 'FILE_UPLOAD_ERROR', 
        message: 'Erro ao processar upload de arquivo. Verifique se as imagens são válidas.'
      });
    }
    
    if (error.message.includes('BODY_PARSE_ERROR')) {
      return res.status(400).json({ 
        error: 'REQUEST_FORMAT_ERROR', 
        message: 'Formato de requisição inválido.'
      });
    }
    
    if (error.message.includes('PROCESS_ERROR')) {
      return res.status(422).json({ 
        error: 'DATA_PROCESSING_ERROR', 
        message: 'Erro ao processar dados enviados.'
      });
    }
    
    if (error.message.includes('OpenAI')) {
      return res.status(503).json({ 
        error: 'AI_SERVICE_ERROR', 
        message: 'Serviço de IA temporariamente indisponível. Tente novamente.'
      });
    }
    
    if (error.message.includes('Firebase') || error.message.includes('auth')) {
      return res.status(401).json({ 
        error: 'AUTH_ERROR', 
        message: 'Erro de autenticação. Faça login novamente.'
      });
    }
    
    // Erro genérico
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Erro interno do servidor. Nossa equipe foi notificada.',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
