
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let auth, db;

// ✅ FORÇAR MODO MOCK EM PRODUÇÃO - Firebase real desabilitado temporariamente
console.warn('🔧 Firebase Admin FORÇADO em modo mock (produção)');

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

export { auth, db };
