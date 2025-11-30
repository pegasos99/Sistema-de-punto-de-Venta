import React, { useState } from 'react';
import { X, Scale } from 'lucide-react';

interface WeightSaleModalProps {
  product: any;
  onSave: (product: any, weight: number, pricePerGram: number) => void;
  onClose: () => void;
}

export function WeightSaleModal({ product, onSave, onClose }: WeightSaleModalProps) {
  const [weight, setWeight] = useState(0);
  const [pricePerGram, setPricePerGram] = useState(product.pricePerGram || 0);

  const totalPrice = weight * pricePerGram;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (weight <= 0) {
      alert('El peso debe ser mayor a 0');
      return;
    }

    if (pricePerGram <= 0) {
      alert('El precio por gramo debe ser mayor a 0');
      return;
    }

    onSave(product, weight, pricePerGram);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Venta por Peso</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-center mb-4">
            <Scale className="w-16 h-16 mx-auto text-yellow-600 mb-2" />
            <h4 className="font-semibold text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-600">{product.category}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso (gramos)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 2.5"
              className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              autoFocus
              required
              min="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio por Gramo (CLP)
            </label>
            <input
              type="number"
              step="1"
              value={pricePerGram}
              onChange={(e) => setPricePerGram(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 25000"
              className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              required
              min="1"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total a cobrar:</p>
              <p className="text-3xl font-bold text-blue-600">
                ${totalPrice.toLocaleString('es-CL')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {weight}g × ${pricePerGram.toLocaleString('es-CL')}/g
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={weight <= 0 || pricePerGram <= 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
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

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-700">
            💡 Tip: Puedes ajustar el precio por gramo según el mercado actual antes de agregar al carrito
          </p>
        </div>
      </div>
    </div>
  );
}