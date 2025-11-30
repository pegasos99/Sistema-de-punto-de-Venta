import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, ArrowRightLeft, Warehouse, Store } from 'lucide-react';

interface StockTransferProps {
  product: Product;
  onClose: () => void;
}

export function StockTransfer({ product, onClose }: StockTransferProps) {
  const { transferStock } = useApp();
  const [quantity, setQuantity] = useState(1);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantity > product.stockWarehouse) {
      alert('No hay suficiente stock en bodega');
      return;
    }

    transferStock(product.id, quantity);
    alert(`Se transfirieron ${quantity} unidades de "${product.name}" de bodega a tienda`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Transferir Stock</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Warehouse className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Stock en Bodega:</span>
              </div>
              <span className="font-semibold text-gray-900">{product.stockWarehouse}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Stock en Tienda:</span>
              </div>
              <span className="font-semibold text-blue-600">{product.stockStore}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a transferir (Bodega → Tienda)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              max={product.stockWarehouse}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo disponible: {product.stockWarehouse} unidades
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Resultado de la transferencia:</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Bodega quedará con:</span>
                <span className="font-semibold">{Math.max(0, product.stockWarehouse - quantity)} unidades</span>
              </div>
              <div className="flex justify-between">
                <span>Tienda quedará con:</span>
                <span className="font-semibold text-blue-600">{product.stockStore + quantity} unidades</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={quantity <= 0 || quantity > product.stockWarehouse}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Transferir Stock
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
      </div>
    </div>
  );
}