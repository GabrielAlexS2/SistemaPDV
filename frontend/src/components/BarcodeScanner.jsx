import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };
    
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Encontrou código
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(err => console.error("Failed to stop scanner", err));
      },
      (errorMessage) => {
        // Ignora erros de leitura (frames sem código)
      }
    ).catch((err) => {
      console.error("Erro ao iniciar câmera", err);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[60] p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <h3 className="text-white font-medium">Escanear Código de Barras</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 bg-black">
          <div id="reader" className="w-full rounded-lg overflow-hidden" ref={scannerRef}></div>
        </div>
        <div className="p-4 bg-slate-800 text-center text-sm text-slate-400">
          Aponte a câmera para o código de barras
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
