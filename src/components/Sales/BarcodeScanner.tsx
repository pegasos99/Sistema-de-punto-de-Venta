import React, { useState } from 'react';
import { Keyboard, X, Check, ShoppingCart } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [lastScannedProduct, setLastScannedProduct] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setScannedItems(prev => [...prev, barcode.trim()]);
      setLastScannedProduct(`Producto escaneado: ${barcode.trim()}`);
      setBarcode(''); // Limpiar el campo para el siguiente escaneo
    }
  };

  const handleFinish = () => {
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Escanear Códigos de Barras</h3>
            <p className="text-sm text-gray-600">Productos escaneados: {scannedItems.length}</p>
          </div>
          <button
            onClick={handleFinish}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lastScannedProduct && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">{lastScannedProduct}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-6">
            <Keyboard className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">
              Escanea o ingresa códigos de barras
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Puedes escanear múltiples productos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Barras
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Ej: 1234567890123"
              className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
              autoFocus
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              disabled={!barcode.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Agregar</span>
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Terminar</span>
            </button>
          </div>
        </form>

        {scannedItems.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos Escaneados:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scannedItems.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 Tips: 
            • Usa un lector USB para mayor rapidez
            • Escanea todos los productos que necesites
            • Presiona "Terminar" cuando hayas terminado
          </p>
        </div>
      </div>
    </div>
  );
}