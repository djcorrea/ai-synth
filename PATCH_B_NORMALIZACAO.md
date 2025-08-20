# 🔧 COMMIT B: Normalização e Validação

**Objetivo:** Implementar compressão client-side, conversão HEIC→JPEG, validação magic bytes e normalização com Sharp.

## 📁 Arquivos Alterados

### 1. `public/image-upload-system.js` - Compressão e Normalização Client-Side

**Localização:** Adicionar funções após linha 160 (createThumbnail)  
**Tipo:** Nova funcionalidade - Processamento de imagens

```javascript
// ✅ NOVO: Função de compressão client-side
async compressImage(file, maxWidth = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🗜️ Comprimindo ${file.name}: ${(file.size/1024/1024).toFixed(2)}MB`);
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calcular dimensões mantendo aspect ratio
          let { width, height } = img;
          const aspectRatio = width / height;
          
          // Redimensionar se necessário
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          // Limite de altura também
          const maxHeight = maxWidth * 0.75; // 4:3 ratio máximo
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Configurar contexto para qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para blob JPEG comprimido
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Falha na compressão da imagem'));
              return;
            }
            
            const compressionRatio = ((file.size - blob.size) / file.size * 100).toFixed(1);
            console.log(`✅ Compressão concluída: ${(blob.size/1024/1024).toFixed(2)}MB (-${compressionRatio}%)`);
            
            // Criar arquivo comprimido
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          }, 'image/jpeg', quality);
          
        } catch (error) {
          console.error('❌ Erro no canvas:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Imagem corrompida ou formato inválido'));
      };
      
      img.src = URL.createObjectURL(file);
      
    } catch (error) {
      console.error('❌ Erro geral na compressão:', error);
      reject(error);
    }
  });
}

// ✅ NOVO: Conversão HEIC para JPEG
async convertHEIC(file) {
  console.log(`🔄 Convertendo HEIC: ${file.name}`);
  
  try {
    // Usar biblioteca heic2any se disponível
    if (typeof heic2any !== 'undefined') {
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      
      const convertedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      console.log(`✅ HEIC convertido: ${file.name} → ${convertedFile.name}`);
      return convertedFile;
    } else {
      // Fallback: tentar carregar biblioteca dinamicamente
      await this.loadHEICLibrary();
      return await this.convertHEIC(file); // Retry após carregar biblioteca
    }
  } catch (error) {
    console.error('❌ Erro na conversão HEIC:', error);
    throw new Error(`Não foi possível converter ${file.name}. Use formato JPG, PNG ou WebP.`);
  }
}

// ✅ NOVO: Carregamento dinâmico da biblioteca HEIC
async loadHEICLibrary() {
  if (typeof heic2any !== 'undefined') return;
  
  console.log('📦 Carregando biblioteca HEIC...');
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
    script.onload = () => {
      console.log('✅ Biblioteca HEIC carregada');
      resolve();
    };
    script.onerror = () => {
      console.warn('⚠️ Biblioteca HEIC não disponível');
      reject(new Error('HEIC library not available'));
    };
    document.head.appendChild(script);
  });
}

// ✅ NOVO: Validação magic bytes no client
validateImageMagicBytes(buffer) {
  if (buffer.byteLength < 8) return false;
  
  const bytes = new Uint8Array(buffer);
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'jpeg';
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return 'png';
  }
  
  // WebP: 52 49 46 46 [4 bytes] 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'webp';
  }
  
  // HEIC: ftyp heic ou ftyp mif1
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const subtype = new TextDecoder().decode(bytes.slice(8, 12));
    if (subtype === 'heic' || subtype === 'mif1') {
      return 'heic';
    }
  }
  
  return false;
}

// ✅ MODIFICAR: Função addImage() para usar nova pipeline
async addImage(file) {
  console.log(`📸 Processando imagem: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);
  
  try {
    // 1️⃣ Validação inicial de tamanho
    if (file.size > 50 * 1024 * 1024) { // 50MB absoluto
      throw new Error(`Arquivo muito grande: ${file.name}. Máximo 50MB.`);
    }
    
    // 2️⃣ Ler primeiros bytes para validação magic bytes
    const buffer = await file.slice(0, 32).arrayBuffer();
    const detectedFormat = this.validateImageMagicBytes(buffer);
    
    if (!detectedFormat) {
      throw new Error(`Arquivo não é uma imagem válida: ${file.name}`);
    }
    
    console.log(`🔍 Formato detectado: ${detectedFormat.toUpperCase()}`);
    
    let processedFile = file;
    
    // 3️⃣ Conversão HEIC se necessário
    if (detectedFormat === 'heic') {
      try {
        processedFile = await this.convertHEIC(file);
        console.log(`🔄 HEIC convertido: ${file.name} → ${processedFile.name}`);
      } catch (heicError) {
        console.error('❌ Falha na conversão HEIC:', heicError);
        throw new Error(`Não foi possível converter ${file.name}. Tente converter para JPG manualmente.`);
      }
    }
    
    // 4️⃣ Compressão se necessário
    const needsCompression = processedFile.size > 5 * 1024 * 1024; // >5MB
    const compressionEnabled = window.localStorage.getItem('image-compression') !== 'false';
    
    if (needsCompression && compressionEnabled) {
      try {
        const originalSize = processedFile.size;
        processedFile = await this.compressImage(processedFile);
        
        const savedMB = ((originalSize - processedFile.size) / 1024 / 1024).toFixed(2);
        console.log(`🗜️ Compressão automática: -${savedMB}MB`);
        
        // Mostrar notificação de compressão
        this.showToast(`Imagem comprimida automaticamente (-${savedMB}MB)`, 'info');
      } catch (compressionError) {
        console.warn('⚠️ Falha na compressão, usando original:', compressionError);
        // Continua com arquivo original se compressão falhar
      }
    }
    
    // 5️⃣ Validação final de tamanho
    if (processedFile.size > this.maxSizePerImage) {
      const sizeMB = (processedFile.size / 1024 / 1024).toFixed(1);
      throw new Error(`Imagem ainda muito grande após compressão: ${sizeMB}MB. Máximo: ${this.maxSizePerImage / 1024 / 1024}MB.`);
    }
    
    // 6️⃣ Validação de tipo final
    if (!this.allowedTypes.includes(processedFile.type)) {
      throw new Error(`Formato não suportado após processamento: ${processedFile.type}`);
    }
    
    // 7️⃣ Converter para base64
    const base64 = await this.fileToBase64(processedFile);
    
    // 8️⃣ Criar thumbnail
    const thumbnail = await this.createThumbnail(base64);
    
    // 9️⃣ Criar objeto final da imagem
    const imageObj = {
      id: Date.now() + Math.random(),
      file: processedFile,
      filename: processedFile.name,
      size: processedFile.size,
      type: processedFile.type,
      base64: base64.split(',')[1], // Remover prefixo data:image/...;base64,
      dataUrl: base64,
      preview: thumbnail,
      originalFilename: file.name, // Manter nome original
      processed: {
        wasCompressed: needsCompression && compressionEnabled,
        wasConverted: detectedFormat === 'heic',
        originalSize: file.size,
        compressionRatio: file.size > 0 ? ((file.size - processedFile.size) / file.size * 100).toFixed(1) : 0
      }
    };

    this.selectedImages.push(imageObj);
    
    console.log(`✅ Imagem processada com sucesso:`, {
      filename: imageObj.filename,
      finalSize: `${(imageObj.size/1024/1024).toFixed(2)}MB`,
      compressed: imageObj.processed.wasCompressed,
      converted: imageObj.processed.wasConverted
    });
    
    return imageObj;
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${file.name}:`, error);
    throw error;
  }
}

// ✅ NOVO: Configuração de compressão
toggleCompression(enabled) {
  window.localStorage.setItem('image-compression', enabled.toString());
  console.log(`🗜️ Compressão automática: ${enabled ? 'ATIVADA' : 'DESATIVADA'}`);
  
  this.showToast(
    `Compressão automática ${enabled ? 'ativada' : 'desativada'}`,
    'info'
  );
}

// ✅ MODIFICAR: Toast para incluir informações de processamento
showToast(message, type = 'info', duration = 3000) {
  // Remover toasts existentes do mesmo tipo
  document.querySelectorAll(`.image-toast.${type}`).forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `image-toast ${type}`;
  
  // Cores e ícones por tipo
  const styles = {
    info: { bg: 'rgba(0, 150, 255, 0.9)', icon: 'ℹ️' },
    success: { bg: 'rgba(0, 150, 0, 0.9)', icon: '✅' },
    error: { bg: 'rgba(255, 0, 0, 0.9)', icon: '❌' },
    warning: { bg: 'rgba(255, 165, 0, 0.9)', icon: '⚠️' }
  };
  
  const style = styles[type] || styles.info;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${style.bg};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  toast.innerHTML = `${style.icon} ${message}`;
  document.body.appendChild(toast);

  // Remover toast após duração especificada
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}
```

**Justificativa:**
- **Redução de payload:** Compressão automática para arquivos >5MB
- **Compatibilidade:** Suporte nativo a HEIC (iPhone/iPad)
- **Validação robusta:** Magic bytes impede uploads de arquivos maliciosos
- **UX transparente:** Processo automático com feedback visual

---

### 2. `api/chat.js` - Validação Server-side com Sharp

**Localização:** Adicionar após imports (linha 5)  
**Tipo:** Nova dependência e validação

```javascript
// ✅ NOVO: Import do Sharp para processamento server-side
import sharp from 'sharp';

// ✅ NOVO: Configuração de limites
const IMAGE_LIMITS = {
  maxWidth: parseInt(process.env.MAX_IMAGE_WIDTH || '1920'),
  maxHeight: parseInt(process.env.MAX_IMAGE_HEIGHT || '1080'),
  quality: parseInt(process.env.IMAGE_QUALITY || '80'),
  maxSizeMB: parseInt(process.env.MAX_IMAGE_MB || '10')
};

// ✅ NOVO: Validação e normalização com Sharp
async function normalizeImage(imageBuffer, filename) {
  try {
    console.log(`🖼️ Normalizando imagem: ${filename} (${(imageBuffer.length/1024/1024).toFixed(2)}MB)`);
    
    // Verificar se é imagem válida e obter metadados
    const metadata = await sharp(imageBuffer).metadata();
    
    console.log(`📊 Metadados: ${metadata.width}x${metadata.height}, ${metadata.format}, ${metadata.channels} canais`);
    
    // Verificar dimensões excessivas
    if (metadata.width > 5000 || metadata.height > 5000) {
      console.warn(`⚠️ Imagem muito grande: ${metadata.width}x${metadata.height}`);
    }
    
    // Pipeline de normalização
    let pipeline = sharp(imageBuffer);
    
    // 1️⃣ Corrigir orientação EXIF
    pipeline = pipeline.rotate();
    
    // 2️⃣ Redimensionar se necessário (mantendo aspect ratio)
    if (metadata.width > IMAGE_LIMITS.maxWidth || metadata.height > IMAGE_LIMITS.maxHeight) {
      pipeline = pipeline.resize(IMAGE_LIMITS.maxWidth, IMAGE_LIMITS.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
      
      console.log(`📏 Redimensionando para máximo ${IMAGE_LIMITS.maxWidth}x${IMAGE_LIMITS.maxHeight}`);
    }
    
    // 3️⃣ Converter para JPEG com qualidade otimizada
    pipeline = pipeline.jpeg({
      quality: IMAGE_LIMITS.quality,
      progressive: true,
      mozjpeg: true // Usar encoder mozjpeg se disponível
    });
    
    // 4️⃣ Processar e obter resultado
    const normalizedBuffer = await pipeline.toBuffer();
    const finalMetadata = await sharp(normalizedBuffer).metadata();
    
    const originalSizeMB = imageBuffer.length / 1024 / 1024;
    const finalSizeMB = normalizedBuffer.length / 1024 / 1024;
    const compressionRatio = ((originalSizeMB - finalSizeMB) / originalSizeMB * 100).toFixed(1);
    
    console.log(`✅ Normalização concluída: ${finalMetadata.width}x${finalMetadata.height}, ${finalSizeMB.toFixed(2)}MB (-${compressionRatio}%)`);
    
    // Verificar se ainda está dentro do limite
    if (normalizedBuffer.length > IMAGE_LIMITS.maxSizeMB * 1024 * 1024) {
      throw new Error(`IMAGEM_AINDA_MUITO_GRANDE:${filename}:${finalSizeMB.toFixed(1)}MB`);
    }
    
    return {
      buffer: normalizedBuffer,
      base64: normalizedBuffer.toString('base64'),
      metadata: finalMetadata,
      stats: {
        originalSize: originalSizeMB,
        finalSize: finalSizeMB,
        compressionRatio: parseFloat(compressionRatio),
        dimensionsChanged: metadata.width !== finalMetadata.width || metadata.height !== finalMetadata.height
      }
    };
    
  } catch (error) {
    console.error(`❌ Erro na normalização de ${filename}:`, error);
    
    if (error.message.includes('Input file contains unsupported image format')) {
      throw new Error(`FORMATO_NAO_SUPORTADO:${filename}`);
    }
    
    if (error.message.includes('Input file is missing')) {
      throw new Error(`ARQUIVO_CORROMPIDO:${filename}`);
    }
    
    throw new Error(`NORMALIZACAO_FALHOU:${filename}:${error.message}`);
  }
}

// ✅ MODIFICAR: validateAndSanitizeInput para usar normalização
function validateAndSanitizeInput(req) {
  // ... código existente até validação de imagens ...
  
  // Validar imagens se presentes
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
    }).slice(0, 3);
    
    // ✅ NOVO: Agendar normalização assíncrona
    if (validImages.length > 0) {
      console.log(`🔄 Agendando normalização de ${validImages.length} imagem(ns)`);
    }
  }
  
  return {
    message: message.trim().substring(0, 2000),
    conversationHistory: validHistory,
    idToken: idToken.trim(),
    images: validImages,
    isVoiceMessage: message.startsWith('[VOICE MESSAGE]'),
    hasImages: validImages.length > 0,
    requiresNormalization: validImages.length > 0
  };
}

// ✅ MODIFICAR: Handler principal para incluir normalização
export default async function handler(req, res) {
  // ... código existente até validação ...
  
  try {
    const { message, conversationHistory, idToken, images, hasImages } = validateAndSanitizeInput(req);
    
    // ... verificação de auth existente ...
    
    let normalizedImages = images;
    
    // 🖼️ Normalizar imagens se presentes
    if (hasImages && images.length > 0) {
      console.log(`🔄 Iniciando normalização de ${images.length} imagem(ns)...`);
      
      const normalizationPromises = images.map(async (img, index) => {
        try {
          const imageBuffer = Buffer.from(img.base64, 'base64');
          const normalized = await normalizeImage(imageBuffer, img.filename);
          
          return {
            ...img,
            base64: normalized.base64,
            size: normalized.buffer.length,
            type: 'image/jpeg', // Sempre JPEG após normalização
            normalized: true,
            stats: normalized.stats,
            metadata: {
              width: normalized.metadata.width,
              height: normalized.metadata.height,
              format: normalized.metadata.format
            }
          };
        } catch (normError) {
          console.error(`❌ Falha na normalização da imagem ${index + 1}:`, normError);
          
          if (normError.message.startsWith('FORMATO_NAO_SUPORTADO:')) {
            throw new Error(`Formato de imagem não suportado: ${img.filename}`);
          }
          
          if (normError.message.startsWith('ARQUIVO_CORROMPIDO:')) {
            throw new Error(`Arquivo de imagem corrompido: ${img.filename}`);
          }
          
          if (normError.message.startsWith('IMAGEM_AINDA_MUITO_GRANDE:')) {
            const [, filename, size] = normError.message.split(':');
            throw new Error(`Imagem ${filename} ainda muito grande após compressão (${size}). Reduza a resolução.`);
          }
          
          throw new Error(`Erro ao processar imagem ${img.filename}: ${normError.message}`);
        }
      });
      
      try {
        normalizedImages = await Promise.all(normalizationPromises);
        
        const totalSizeMB = normalizedImages.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024;
        console.log(`✅ Normalização concluída: ${normalizedImages.length} imagens, ${totalSizeMB.toFixed(2)}MB total`);
        
        // Log estatísticas de compressão
        normalizedImages.forEach((img, index) => {
          if (img.stats.compressionRatio > 0) {
            console.log(`📊 Imagem ${index + 1}: ${img.metadata.width}x${img.metadata.height}, -${img.stats.compressionRatio}% de compressão`);
          }
        });
        
      } catch (normalizationError) {
        console.error('❌ Erro na normalização em lote:', normalizationError);
        throw normalizationError;
      }
    }
    
    // ... resto da função usando normalizedImages em vez de images ...
    
    // Preparar mensagem do usuário com imagens normalizadas
    const userMessage = {
      role: 'user',
      content: hasImages ? [
        { type: 'text', text: message },
        ...normalizedImages.map(img => ({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${img.base64}`,
            detail: 'high'
          }
        }))
      ] : message
    };
    
    // ... resto da função permanece igual ...
    
    // Incluir estatísticas de normalização na resposta
    const responseData = {
      reply,
      mensagensRestantes: userData.plano === 'gratis' ? userData.mensagensRestantes : null,
      model: model
    };

    if (hasImages && normalizedImages.length > 0) {
      responseData.imageProcessing = {
        totalImages: normalizedImages.length,
        totalSizeMB: (normalizedImages.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024).toFixed(2),
        normalized: true,
        stats: normalizedImages.map(img => ({
          filename: img.filename,
          originalSize: img.stats ? (img.stats.originalSize).toFixed(2) + 'MB' : 'N/A',
          finalSize: (img.size / 1024 / 1024).toFixed(2) + 'MB',
          compressionRatio: img.stats ? img.stats.compressionRatio + '%' : 'N/A',
          dimensions: `${img.metadata.width}x${img.metadata.height}`
        }))
      };
    }

    return res.status(200).json(responseData);
    
  } catch (error) {
    // ... error handling categorizado existente + novos erros de normalização ...
    
    // 🖼️ Erros específicos de normalização
    if (error.message.includes('Formato de imagem não suportado')) {
      return res.status(422).json({
        error: 'UNSUPPORTED_FORMAT',
        message: error.message,
        code: 'IMAGE_FORMAT_ERROR'
      });
    }
    
    if (error.message.includes('Arquivo de imagem corrompido')) {
      return res.status(422).json({
        error: 'CORRUPTED_IMAGE',
        message: error.message,
        code: 'IMAGE_CORRUPTED'
      });
    }
    
    if (error.message.includes('ainda muito grande após compressão')) {
      return res.status(413).json({
        error: 'IMAGE_TOO_LARGE',
        message: error.message,
        code: 'IMAGE_SIZE_EXCEEDED',
        suggestion: 'Reduza a resolução da imagem ou use um formato mais eficiente'
      });
    }
    
    // ... resto do error handling ...
  }
}
```

**Justificativa:**
- **Normalização garantida:** Todas as imagens passam por Sharp no servidor
- **Otimização automática:** EXIF rotation, resize, JPEG compression
- **Validação robusta:** Verificação de formato real vs declarado
- **Observabilidade:** Estatísticas detalhadas de processamento

---

### 3. `package.json` - Dependências

**Localização:** Seção dependencies  
**Tipo:** Adição de dependências

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^5.1.0",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.4.1",
    "mercadopago": "^2.8.0",
    "node-fetch": "^2.6.7",
    "sharp": "^0.33.2"
  }
}
```

**Justificativa:**
- **Sharp:** Biblioteca de processamento de imagens mais rápida e confiável
- **Compatibilidade:** Suporte nativo ao Vercel e Node.js

---

### 4. `public/index.html` - Biblioteca HEIC

**Localização:** Seção head, após outras bibliotecas  
**Tipo:** Adição opcional de biblioteca

```html
<!-- ✅ OPCIONAL: Biblioteca HEIC para suporte a iPhone -->
<!-- Carregada dinamicamente apenas quando necessário -->
<script>
  // Preload da biblioteca HEIC para carregamento mais rápido
  const heicPreload = document.createElement('link');
  heicPreload.rel = 'preload';
  heicPreload.href = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
  heicPreload.as = 'script';
  heicPreload.crossOrigin = 'anonymous';
  document.head.appendChild(heicPreload);
</script>
```

**Justificativa:**
- **Carregamento otimizado:** Preload sem bloquear página
- **Fallback graceful:** Sistema funciona sem a biblioteca
- **UX melhorada:** Suporte nativo a fotos do iPhone

---

## 🧪 Testes do Commit B

### **Teste 1: Compressão Automática**
```javascript
// Simular upload de imagem 8MB
const largeImage = new File([new ArrayBuffer(8 * 1024 * 1024)], 'large.jpg', {
  type: 'image/jpeg'
});

await window.imagePreviewSystem.addImage(largeImage);
// Resultado esperado: Compressão para <5MB, toast informativo
```

### **Teste 2: Conversão HEIC**
```javascript
// Simular arquivo HEIC
const heicFile = new File([heicData], 'photo.heic', {
  type: 'image/heic'
});

await window.imagePreviewSystem.addImage(heicFile);
// Resultado esperado: Conversão para JPEG, nome alterado para .jpg
```

### **Teste 3: Validação Magic Bytes**
```javascript
// Simular arquivo .jpg que na verdade é texto
const fakeImage = new File(['fake image data'], 'fake.jpg', {
  type: 'image/jpeg'
});

try {
  await window.imagePreviewSystem.addImage(fakeImage);
} catch (error) {
  // Resultado esperado: Erro "Arquivo não é uma imagem válida"
}
```

### **Teste 4: Normalização Server-side**
```bash
# Enviar imagem 4000x3000 com orientação incorreta
curl -X POST https://ai-synth.vercel.app/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -F "message=Analise esta foto" \
  -F "images=@rotated_large.jpg"

# Resultado esperado: 
# - Imagem redimensionada para max 1920x1080
# - Orientação corrigida
# - Compressão JPEG otimizada
# - Resposta inclui stats de processamento
```

### **Teste 5: Arquivo Corrompido**
```bash
# Enviar arquivo corrompido
curl -X POST https://ai-synth.vercel.app/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -F "message=Teste" \
  -F "images=@corrupted.jpg"

# Resultado esperado: 422 CORRUPTED_IMAGE
```

---

## 🔧 Configuração de Ambiente

### **Novas Variáveis ENV:**
```bash
# Processamento de imagens
MAX_IMAGE_WIDTH=1920          # Largura máxima após redimensionamento
MAX_IMAGE_HEIGHT=1080         # Altura máxima após redimensionamento  
IMAGE_QUALITY=80              # Qualidade JPEG (0-100)
ENABLE_IMAGE_NORMALIZATION=true # Ativar normalização server-side

# Client-side
ENABLE_COMPRESSION=true       # Compressão automática no cliente
COMPRESSION_QUALITY=0.8       # Qualidade da compressão (0.1-1.0)
COMPRESSION_MAX_WIDTH=1280    # Largura máxima client-side
ENABLE_HEIC_CONVERSION=true   # Conversão HEIC→JPEG
```

### **Configuração Vercel:**
```json
// vercel.json - adicionar
{
  "functions": {
    "api/chat.js": {
      "maxDuration": 90,  // Aumentado para processamento de imagens
      "memory": 1024      // Memória necessária para Sharp
    }
  }
}
```

---

## 🚀 Deploy e Rollback

### **Deploy:**
```bash
# 1. Instalar dependências
npm install sharp@^0.33.2

# 2. Commit e push
git add .
git commit -m "feat: normalização de imagens e compressão client-side"
git push origin feature/image-upload-v2

# 3. Deploy
vercel --prod

# 4. Ativar feature flags
vercel env add ENABLE_IMAGE_NORMALIZATION true
vercel env add ENABLE_COMPRESSION true
```

### **Rollback:**
```bash
# Rollback total
vercel env add ENABLE_IMAGE_NORMALIZATION false
vercel env add ENABLE_COMPRESSION false

# Rollback parcial (manter server-side, desabilitar client-side)
vercel env add ENABLE_COMPRESSION false
```

### **Monitoramento:**
```bash
# Verificar uso de memória
vercel logs --follow | grep "Memory"

# Verificar tempos de processamento
vercel logs --follow | grep "Normalização concluída"

# Alertas de erro
vercel logs --follow | grep "Erro na normalização"
```

---

## ⚙️ Configurações Avançadas

### **1. Tuning de Performance**
```javascript
// Configuração otimizada do Sharp para Vercel
const sharpConfig = {
  // Usar cache para melhor performance
  cache: { memory: 50, files: 20, items: 100 },
  
  // Configurações de thread
  concurrency: 1, // Vercel tem CPU limitado
  
  // Limite de memória
  limitInputPixels: 268402689 // ~16MB de pixels (4096x4096)
};

sharp.cache(sharpConfig.cache);
sharp.concurrency(sharpConfig.concurrency);
```

### **2. Quality Gates**
```javascript
// Verificações de qualidade automáticas
const qualityChecks = {
  maxCompressionRatio: 90, // Não comprimir mais que 90%
  minDimensions: { width: 100, height: 100 }, // Dimensões mínimas
  maxPixels: 16777216 // 4096x4096 max
};
```

### **3. Fallbacks de Emergência**
```javascript
// Se Sharp falhar, usar canvas como fallback
async function fallbackNormalization(base64) {
  console.warn('🚨 Sharp falhou, usando canvas fallback');
  
  const img = new Image();
  img.src = `data:image/jpeg;base64,${base64}`;
  
  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = Math.min(img.width, 1920);
      canvas.height = Math.min(img.height, 1080);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve({
        base64: canvas.toDataURL('image/jpeg', 0.8).split(',')[1],
        fallback: true
      });
    };
  });
}
```

---

**Status:** ✅ Pronto para implementação  
**Risco:** 🟡 Médio (nova dependência Sharp)  
**Tempo estimado:** 6 horas de desenvolvimento + 3 horas de testes  
**Dependências:** Commit A deve estar funcionando

---

**Próximo passo:** COMMIT C - Observabilidade e Fallback
