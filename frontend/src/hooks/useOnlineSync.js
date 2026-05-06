// Hook para detectar estado online/offline e sincronizar vendas
import { useEffect } from 'react';
import usePdvStore from '../store/pdvStore';
import toast from 'react-hot-toast';

const useOnlineSync = () => {
  const { sincronizarVendas, carregarPendentes } = usePdvStore();

  useEffect(() => {
    carregarPendentes();

    const handleOnline = () => {
      toast('🌐 Conexão restaurada! Sincronizando...', { icon: '🔄' });
      sincronizarVendas();
    };

    const handleOffline = () => {
      toast('📴 Sem conexão. Modo offline ativo.', { icon: '⚠️', duration: 4000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
};

export default useOnlineSync;
