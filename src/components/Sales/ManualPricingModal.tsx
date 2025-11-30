import React, { useState, useEffect } from 'react';
import { X, Calculator, Scale, DollarSign } from 'lucide-react';

interface ManualPricingModalProps {
  product: any;
  onConfirm: (weight: number, pricePerGram: number) => void;
  onClose: () => void;
}

export function ManualPricingModal({ product, onConfirm, onClose }: ManualPricingModalProps) {
  // Si es precio manual por vendedor, no se necesita peso
  const isManualBySeller = product.requiresManualBySeller;

  const [weight, setWeight] = useState<number>(isManualBySeller ? 0 : product.weight || 0);
  const [pricePerGram, setPricePerGram] = useState<number>(product.pricePerGram || (isManualBySeller ? product.price || 0 : 0));

  const totalPrice = isManualBySeller ? pricePerGram : weight * pricePerGram;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isManualBySeller && weight <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0');
      return;
    }

    if (pricePerGram <= 0) {
      alert('Por favor ingresa un precio válido mayor a 0');
      return;
    }

    onConfirm(weight, pricePerGram);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            {isManualBySeller ? (
              <DollarSign className="w-6 h-6 text-blue-600" />
            ) : (
              <Scale className="w-6 h-6 text-blue-600" />
            )}
            <span>
              {isManualBySeller ? 'Precio Manual' : 'Configurar Precio por Peso'}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información del producto */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-1">{product.name}</h4>
          <p className="text-sm text-blue-700">Categoría: {product.category}</p>
          {!isManualBySeller && product.pricePerGram && (
            <p className="text-sm text-blue-700">
              Precio sugerido: ${product.pricePerGram.toLocaleString('es-CL')}/gramo
            </p>
          )}
          {isManualBySeller && product.price > 0 && (
            <p className="text-sm text-blue-700">
              Precio actual: ${product.price.toLocaleString('es-CL')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Peso solo si no es precio manual por vendedor */}
          {!isManualBySeller && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scale className="w-4 h-4 inline mr-1" />
                Peso del Producto (gramos) *
              </label>
              <input
                type="number"
                step="0.1"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                placeholder="Ej: 5.5"
                className="w-full p-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
                autoFocus
                required
                min="0.1"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Ingresa el peso exacto del producto
              </p>
            </div>
          )}

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              {isManualBySeller ? 'Precio del Producto (CLP) *' : 'Precio por Gramo (CLP) *'}
            </label>
            <input
              type="number"
              step="1"
              value={pricePerGram || ''}
              onChange={(e) => setPricePerGram(parseFloat(e.target.value) || 0)}
              placeholder={isManualBySeller ? 'Ej: 5000' : 'Ej: 25000'}
              className="w-full p-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
              required
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              {isManualBySeller
                ? 'Ingresa el precio total del producto'
                : 'Precio actual por gramo del producto'}
            </p>
          </div>

          {/* Cálculo automático solo si no es manual por vendedor */}
          {!isManualBySeller && weight > 0 && pricePerGram > 0 && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Calculator className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Cálculo Automático</span>
              </div>
              <div className="text-center space-y-2">
                <div className="text-lg text-green-700">
                  {weight}g × ${pricePerGram.toLocaleString('es-CL')}/g
                </div>
                <div className="text-3xl font-bold text-green-800 border-t border-green-300 pt-2">
                  Total: ${totalPrice.toLocaleString('es-CL')}
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={(!isManualBySeller && weight <= 0) || pricePerGram <= 0}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            >
              Agregar al Carrito
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors text-lg"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Información adicional */}
        {!isManualBySeller && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 text-center">
              💡 El precio por gramo puede variar según la calidad y tipo del producto
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
  