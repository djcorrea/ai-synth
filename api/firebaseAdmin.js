
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let auth, db;

// ✅ DEVELOPMENT MODE: Permitir mock quando service account não está disponível
if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.warn('⚠️  Firebase Admin em modo mock para desenvolvimento');
  
  // Mock para desenvolvimento local
  auth = {
    verifyIdToken: async (token) => {
      if (token === 'test-token' || token.startsWith('valid-')) {
        return { uid: 'dev-user-123', email: 'dev@test.com' };
      }
      throw new Error('Invalid token');
    }
  };
  
  db = {
    collection: (name) => ({ 
      doc: (id) => ({ 
        get: async () => ({ 
          exists: false,
          data: () => null 
        }),
        set: async (data) => data,
        update: async (data) => data
      }) 
    }),
    runTransaction: async (fn) => {
      const mockTx = {
        get: async () => ({ 
          exists: false,
          data: () => null 
        }),
        set: async (ref, data) => data,
        update: async (ref, data) => data
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
