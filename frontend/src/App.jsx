import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import usePdvStore from './store/pdvStore';
import useOnlineSync from './hooks/useOnlineSync';
import Layout from './components/Layout';
import Login from './pages/Login';
import PDV from './pages/PDV';
import Estoque from './pages/Estoque';
import Dashboard from './pages/Dashboard';

// Componente para proteger rotas autenticadas
const RotaProtegida = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

// Hook de sincronização online/offline e websockets (roda globalmente)
const SyncProvider = ({ children }) => {
  useOnlineSync();

  // Inicializa o espelhamento em tempo real (WebSockets)
  useEffect(() => {
    usePdvStore.getState().initSocket();
  }, []);

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas com layout */}
        <Route path="/" element={
          <RotaProtegida>
            <SyncProvider>
              <Layout />
            </SyncProvider>
          </RotaProtegida>
        }>
          <Route index element={<Navigate to="/pdv" replace />} />
          <Route path="pdv" element={<PDV />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* Redirecionar qualquer rota desconhecida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
