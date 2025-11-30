// Contenido para: src/components/Inventory/AddStockModal.tsx (NUEVO)

import React, { useState } from 'react';
import { Product } from '../../types';
import { X, PackagePlus, DollarSign } from 'lucide-react';

interface AddStockModalProps {
  product: Product;
  onSave: (
    variantId: string | undefined, // Mantenemos por compatibilidad de la firma
    quantity: number,
    cost: number,
    destination: 'store' | 'warehouse'
  ) => void;
  onClose: () => void;
}

export function AddStockModal({ product, onSave, onClose }: AddStockModalProps) {
  const [quantity, setQuantity] = useState(0);
  const [cost, setCost] = useState(0);
  const [destination, setDestination] = useState<'store' | 'warehouse'>('warehouse');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (cost < 0) {
      alert('El costo no puede ser negativo');
      return;
    }

    // Como no hay variantes (según tu cambio anterior), el variantId es undefined
    onSave(undefined, quantity, cost, destination);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <PackagePlus className="w-6 h-6 text-green-600" />
            <span>Agregar Stock</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600">
            Stock Actual: {product.stockStore} (Tienda) / {product.stockWarehouse} (Bodega)
          </p>
          <p className="text-sm text-gray-600">
            Costo Total Actual: ${product.costPrice.toLocaleString('es-CL')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a Agregar
              </label>
              <input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Ej: 10"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo de esta Compra
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={cost || ''}
                  onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full p-3 pl-9 border border-gray-300 rounded-lg"
                  placeholder="Ej: 50000"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destino del Stock
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as 'store' | 'warehouse')}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="warehouse">Bodega</option>
              <option value="store">Tienda</option>
            </select>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">Resumen</h4>
            <p className="text-sm text-gray-700">
              Se agregarán <strong className="text-green-700">{quantity}</strong> unidades a <strong className="text-green-700">{destination === 'store' ? 'Tienda' : 'Bodega'}</strong>.
            </p>
            <p className="text-sm text-gray-700">
              Se sumarán <strong className="text-green-700">${cost.toLocaleString('es-CL')}</strong> al costo total del producto.
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Nuevo Costo Total: <strong className="text-green-700">${(product.costPrice + cost).toLocaleString('es-CL')}</strong>
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={quantity <= 0}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
            >
              Agregar Stock
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}