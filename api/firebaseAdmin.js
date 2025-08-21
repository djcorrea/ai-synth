
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let auth, db;

// ✅ TEMPORARY: Permitir mock em produção até configurar service account  
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.warn('⚠️  Firebase Admin em modo mock (produção temporária)');
  
  // Mock para desenvolvimento e produção temporária
  auth = {
    verifyIdToken: async (token) => {
      // ✅ ACEITAR QUALQUER TOKEN para teste temporário
      console.log(`🔑 Mock: Validando token: ${token?.substring(0, 20)}...`);
      return { 
        uid: 'mock-user-123', 
        email: 'mock@test.com',
        name: 'Usuário Mock' 
      };
    }
  };
  
  db = {
    collection: (name) => ({ 
      doc: (id) => ({ 
        get: async () => ({ 
          exists: true,
          data: () => ({
            plano: 'gratuito',
            mensagensEnviadas: 5,
            mesAtual: new Date().getMonth(),
            anoAtual: new Date().getFullYear(),
            imagemAnalises: {
              quantidade: 2,
              mesAtual: new Date().getMonth(),
              anoAtual: new Date().getFullYear()
            }
          }) 
        }),
        set: async (data) => {
          console.log('📝 Mock: Salvando dados:', data);
          return data;
        },
        update: async (data) => {
          console.log('📝 Mock: Atualizando dados:', data);
          return data;
        }
      }) 
    }),
    runTransaction: async (fn) => {
      console.log('🔄 Mock: Executando transação');
      const mockTx = {
        get: async () => ({ 
          exists: true,
          data: () => ({
            plano: 'gratuito',
            mensagensEnviadas: 5,
            mesAtual: new Date().getMonth(),
            anoAtual: new Date().getFullYear()
          })
        }),
        set: async (ref, data) => {
          console.log('📝 Mock TX: Salvando:', data);
          return data;
        },
        update: async (ref, data) => {
          console.log('📝 Mock TX: Atualizando:', data);
          return data;
        }
      };
      return await fn(mockTx);
    }
  };
  
} else {
  // Produção: validação segura da variável de ambiente
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is required');
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
  }

  let app;
  if (!getApps().length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin inicializado com sucesso');
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do FIREBASE_SERVICE_ACCOUNT:', parseError.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
    }
  } else {
    app = getApps()[0];
    console.log('✅ Firebase Admin já estava inicializado');
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
