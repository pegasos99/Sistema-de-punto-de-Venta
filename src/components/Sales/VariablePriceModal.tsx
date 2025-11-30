import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface VariablePriceModalProps {
  product: any;
  onSave: (product: any, customPrice: number) => void;
  onClose: () => void;
}

export function VariablePriceModal({ product, onSave, onClose }: VariablePriceModalProps) {
  const [customPrice, setCustomPrice] = useState(product.price || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customPrice <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    onSave(product, customPrice);
  };

  const profit = customPrice - product.costPrice;
  const profitMargin = customPrice > 0 ? ((profit / customPrice) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Precio Variable</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-center mb-4">
            <DollarSign className="w-16 h-16 mx-auto text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-600">{product.category}</p>
            <p className="text-xs text-gray-500 mt-1">
              Precio base: ${product.price.toLocaleString('es-CL')} | 
              Costo: ${product.costPrice.toLocaleString('es-CL')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Venta (CLP)
            </label>
            <input
              type="number"
              step="1"
              value={customPrice}
              onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 15000"
              className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              autoFocus
              required
              min="1"
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Precio final:</p>
              <p className="text-3xl font-bold text-green-600">
                ${customPrice.toLocaleString('es-CL')}
              </p>
              <div className="mt-2 text-sm">
                <p className="text-gray-600">
                  Ganancia: ${profit.toLocaleString('es-CL')} ({profitMargin.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={customPrice <= 0}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Agregar al Carrito
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 Tip: Puedes ajustar el precio según las condiciones del mercado o negociación con el cliente
          </p>
        </div>
      </div>
    </div>
  );
}