import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductForm } from './ProductForm';
import { StockTransfer } from './StockTransfer';
import { AddStockModal } from './AddStockModal'; // <-- AÑADIDO
import { 
  Search, 
  Plus, 
  CreditCard as Edit, 
  Trash2, 
  AlertTriangle, 
  ArrowRightLeft, 
  Warehouse, 
  Store,
  PackagePlus // <-- AÑADIDO
} from 'lucide-react';
import { Product } from '../../types';

export function Inventory() {
  // --- CAMBIO: Añadido 'addStockToProduct' ---
  const { products, addProduct, updateProduct, deleteProduct, addStockToProduct } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false); // <-- AÑADIDO
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [addStockProduct, setAddStockProduct] = useState<Product | null>(null); // <-- AÑADIDO
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcodes && product.barcodes.some(b => b.includes(searchTerm)));
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = (productData: any) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      deleteProduct(product.id);
    }
  };

  const handleTransfer = (product: Product) => {
    setTransferProduct(product);
    setShowTransfer(true);
  };

  // --- FUNCIÓN AÑADIDA ---
  const handleAddStock = (product: Product) => {
    setAddStockProduct(product);
    setShowAddStock(true);
  };

  // --- FUNCIÓN AÑADIDA ---
  const handleSaveAddStock = (
    variantId: string | undefined,
    quantity: number,
    cost: number,
    destination: 'store' | 'warehouse'
  ) => {
    if (addStockProduct) {
      // Llama a la función del contexto
      addStockToProduct(addStockProduct.id, variantId, quantity, cost, destination);
      // Cierra el modal
      setShowAddStock(false);
      setAddStockProduct(null);
    }
  };

  const lowStockProducts = filteredProducts.filter(p => (p.stockStore + p.stockWarehouse) <= p.minStock);

  const calculateProfit = (product: Product) => {
    return product.price - product.costPrice;
  };

  const calculateProfitMargin = (product: Product) => {
    return product.price > 0 ? ((product.price - product.costPrice) / product.price * 100) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Alerta de Stock Bajo</h3>
          </div>
          <p className="text-red-600">
            {lowStockProducts.length} producto(s) con stock total por debajo del mínimo
          </p>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>


      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ganancia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                      {product.hasVariablePrice && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ml-1">
                          Precio variable
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.barcodes && product.barcodes.length > 0 
                      ? product.barcodes.join(', ') 
                      : 'Sin código'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        Venta: ${(product.price || 0).toLocaleString('es-CL')}
                      </div>
                      <div className="text-red-600">
                        Costo Total: ${(product.costPrice || 0).toLocaleString('es-CL')}
                      </div>
                      <div className="text-gray-600 text-xs">
                        Costo Unit: ${((product.stockStore + product.stockWarehouse) > 0 
                          ? (product.costPrice / (product.stockStore + product.stockWarehouse))
                          : 0).toLocaleString('es-CL')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Store className="w-4 h-4 text-blue-600" />
                        <span className={`font-medium ${
                          product.stockStore > product.minStock ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.stockStore}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Warehouse className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">{product.stockWarehouse}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: {product.stockStore + product.stockWarehouse}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        ${(calculateProfit(product) || 0).toLocaleString('es-CL')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(calculateProfitMargin(product) || 0).toFixed(1)}% margen
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                    
                    {/* --- BOTÓN AÑADIDO --- */}
                    <button
                      onClick={() => handleAddStock(product)}
                      className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                      title="Agregar stock"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleTransfer(product)}
                      className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded"
                      title="Transferir stock"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct || undefined}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showTransfer && transferProduct && (
        <StockTransfer
          product={transferProduct}
          onClose={() => {
            setShowTransfer(false);
            setTransferProduct(null);
          }}
        />
      )}

      {/* --- MODAL AÑADIDO --- */}
      {showAddStock && addStockProduct && (
        <AddStockModal
          product={addStockProduct}
          onSave={handleSaveAddStock}
          onClose={() => {
            setShowAddStock(false);
            setAddStockProduct(null);
          }}
        />
      )}
    </div>
  );
}